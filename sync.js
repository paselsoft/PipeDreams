// Sincronizzazione dei progressi fra i dispositivi attraverso un repository GitHub privato.
// Il file progressi.json del repository contiene i progressi; ogni dispositivo li scarica, li
// UNISCE ai suoi (mergeProgress: per ogni livello il risultato migliore, quindi non si perde
// niente anche giocando su due dispositivi insieme) e li salva di nuovo se è cambiato qualcosa.
// La chiave (un token «fine-grained» di GitHub, con accesso solo a quel repository e solo ai
// contenuti) resta nel localStorage di questo browser e va solo a api.github.com.
// Quando: all'apertura del gioco, qualche secondo dopo ogni progresso, quando la pagina torna
// visibile o la connessione torna, e con «Sincronizza ora». Senza rete il gioco va avanti e
// riprova più tardi.

const SYNC_KEY = "pipedreams.sync.v1";
const SYNC_DEFAULT_REPO = "paselsoft/pipedreams-progressi";
const SYNC_FILE = "progressi.json";
const SYNC_API = "https://api.github.com";

const syncState = {
    config: null,         // { token, repo } oppure null se non è collegato
    status: "",           // testo dello stato, per la finestra del backup
    lastSync: null,       // ora dell'ultima sincronizzazione riuscita (ISO)
    running: null,        // Promise della sincronizzazione in corso
    again: false,         // un'altra sincronizzazione richiesta mentre una era in corso
    timer: null,
    delay: 5000,          // attesa dopo un progresso, per raccogliere più livelli in un salvataggio
    lastAttempt: 0
};

function loadSyncConfig() {
    try {
        const data = JSON.parse(localStorage.getItem(SYNC_KEY));
        if (data && typeof data.token === "string" && data.token && /^[\w.-]+\/[\w.-]+$/.test(data.repo)) {
            syncState.lastSync = typeof data.lastSync === "string" ? data.lastSync : null;
            return { token: data.token, repo: data.repo };
        }
    } catch (e) {
        // niente configurazione leggibile: sincronizzazione spenta
    }
    return null;
}

function saveSyncConfig() {
    try {
        if (syncState.config) localStorage.setItem(SYNC_KEY, JSON.stringify({ ...syncState.config, lastSync: syncState.lastSync }));
        else localStorage.removeItem(SYNC_KEY);
    } catch (e) {
        // storage bloccato: la chiave resta solo in memoria fino alla chiusura
    }
}

// Testo UTF-8 ⇄ base64, il formato dei contenuti nelle API di GitHub
function syncToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
}

function syncFromBase64(data) {
    const binary = atob(String(data).replace(/\s+/g, ""));
    return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

function syncRequest(path, options = {}) {
    return fetch(`${SYNC_API}${path}`, {
        ...options,
        cache: "no-store",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${syncState.config.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            ...(options.body ? { "Content-Type": "application/json" } : {})
        }
    });
}

// Un errore della sincronizzazione con il messaggio da mostrare
class SyncError extends Error {
    constructor(message, retry = false) {
        super(message);
        this.retry = retry;
    }
}

function syncHttpError(response) {
    if (response.status === 401) return new SyncError("la chiave non è valida o è scaduta: creane una nuova su GitHub e collegala di nuovo.");
    if (response.status === 403) return new SyncError("la chiave non ha il permesso di scrivere: su GitHub dalle «Contents: Read and write».");
    if (response.status === 404) return new SyncError(`il repository ${syncState.config.repo} non esiste o la chiave non lo può vedere.`);
    return new SyncError(`GitHub ha risposto ${response.status}: riprovo più tardi.`, true);
}

// Il file dei progressi su GitHub: { progress, sha } (progress null se il file non c'è ancora)
async function syncDownload() {
    const response = await syncRequest(`/repos/${syncState.config.repo}/contents/${SYNC_FILE}`);
    if (response.status === 404) {
        // Il file manca (prima sincronizzazione) oppure manca il repository: lo distingue questa richiesta
        const repo = await syncRequest(`/repos/${syncState.config.repo}`);
        if (!repo.ok) throw syncHttpError(repo);
        return { progress: null, sha: null };
    }
    if (!response.ok) throw syncHttpError(response);
    const file = await response.json();
    const result = readBackup(syncFromBase64(file.content));
    if (result.error) throw new SyncError(`il file ${SYNC_FILE} su GitHub non è un backup valido: ${result.error}`);
    return { progress: result.progress, sha: file.sha };
}

async function syncUpload(data, sha) {
    const response = await syncRequest(`/repos/${syncState.config.repo}/contents/${SYNC_FILE}`, {
        method: "PUT",
        body: JSON.stringify({
            message: `Progressi: ${progressSummary(data)}`,
            content: syncToBase64(JSON.stringify(backupData(data), null, 1) + "\n"),
            ...(sha ? { sha } : {})
        })
    });
    // 409/422: un altro dispositivo ha salvato nel frattempo, si riscarica e si riunisce
    if (response.status === 409 || response.status === 422) return false;
    if (!response.ok) throw syncHttpError(response);
    return true;
}

const syncSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Una sincronizzazione completa: scarica, unisce, salva se serve (al massimo 3 tentativi se un
// altro dispositivo salva nello stesso momento). Restituisce i livelli arrivati da GitHub.
async function syncOnce() {
    for (let attempt = 0; attempt < 3; attempt++) {
        const remote = await syncDownload();
        const local = cleanProgress(normalizeProgress(progress));
        const merged = remote.progress ? mergeProgress(local, remote.progress) : local;
        const before = levels.filter(lvl => progress.levels[lvl.id]).length;
        if (!syncSame(merged, local)) {
            progress = merged;
            saveProgress(progress);
        }
        const arrived = levels.filter(lvl => progress.levels[lvl.id]).length - before;
        if (remote.progress && syncSame(merged, remote.progress)) return arrived;
        if (await syncUpload(merged, remote.sha)) return arrived;
    }
    throw new SyncError("troppi salvataggi nello stesso momento: riprovo fra poco.", true);
}

function syncTime(iso) {
    const date = new Date(iso);
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function setSyncStatus(text) {
    syncState.status = text;
    renderSyncPanel();
}

// Avvia una sincronizzazione (o ne accoda una se ce n'è già una in corso)
function syncNow() {
    if (!syncState.config || TEST_MODE) return Promise.resolve();
    clearTimeout(syncState.timer);
    syncState.timer = null;
    if (syncState.running) {
        syncState.again = true;
        return syncState.running;
    }
    syncState.lastAttempt = Date.now();
    setSyncStatus("Sincronizzazione in corso...");
    syncState.running = syncOnce()
        .then(arrived => {
            syncState.lastSync = new Date().toISOString();
            saveSyncConfig();
            setSyncStatus(`Sincronizzato alle ${syncTime(syncState.lastSync)}.`);
            if (arrived > 0) syncArrived(arrived);
        })
        .catch(error => {
            if (error instanceof SyncError) {
                setSyncStatus(`Non sincronizzato: ${error.message}`);
                if (error.retry) scheduleSync(60000);
            } else {
                // fetch fallita: niente connessione (o GitHub irraggiungibile)
                setSyncStatus("Senza connessione: i progressi restano qui e si sincronizzano appena torna la rete.");
            }
        })
        .finally(() => {
            syncState.running = null;
            if (syncState.again) {
                syncState.again = false;
                syncNow();
            }
        });
    return syncState.running;
}

// Una sincronizzazione fra qualche secondo (dopo ogni progresso salvato)
function scheduleSync(delay = syncState.delay) {
    if (!syncState.config || TEST_MODE) return;
    clearTimeout(syncState.timer);
    syncState.timer = setTimeout(syncNow, delay);
}

// Sono arrivati livelli da un altro dispositivo: se il giocatore non ha ancora iniziato a
// giocare il livello aperto all'avvio, lo porta dove era arrivato
function syncArrived(count) {
    showToast(`🔄 Progressi aggiornati da un altro dispositivo: ${progressSummary(progress)}`);
    if (!document.getElementById("level-menu").hidden) renderMenu();
    const untouched = !dailyLevel && syncState.startLevel === currentLevelIndex && gridState.every(cell => cell === 0) && !isBusy;
    if (untouched && startLevelIndex() !== currentLevelIndex) loadLevel(startLevelIndex());
}

// Pannello «Sincronizza fra i dispositivi» nella finestra del backup
function renderSyncPanel() {
    const panel = document.getElementById("sync-panel");
    if (!panel) return;
    const connected = Boolean(syncState.config);
    document.getElementById("sync-off").hidden = connected;
    document.getElementById("sync-on").hidden = !connected;
    if (connected) {
        document.getElementById("sync-repo").textContent = syncState.config.repo;
        document.getElementById("sync-status").textContent = syncState.status
            || (syncState.lastSync ? `Ultima sincronizzazione alle ${syncTime(syncState.lastSync)}.` : "Collegato.");
    }
}

async function connectSync() {
    const token = document.getElementById("sync-token").value.trim();
    const repo = document.getElementById("sync-repo-input").value.trim();
    const message = document.getElementById("sync-message");
    if (!token) {
        message.textContent = "Incolla la chiave creata su GitHub.";
        return;
    }
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        message.textContent = "Il repository si scrive utente/nome, per esempio paselsoft/pipedreams-progressi.";
        return;
    }
    syncState.config = { token, repo };
    syncState.status = "";
    message.textContent = "Controllo la chiave...";
    try {
        const response = await syncRequest(`/repos/${repo}`);
        if (!response.ok) throw syncHttpError(response);
    } catch (error) {
        syncState.config = null;
        message.textContent = error instanceof SyncError ? `Non collegato: ${error.message}` : "Non collegato: serve la connessione a internet.";
        return;
    }
    saveSyncConfig();
    document.getElementById("sync-token").value = "";
    message.textContent = "";
    renderSyncPanel();
    await syncNow();
    document.getElementById("backup-summary").textContent = progressSummary(progress);
    document.getElementById("backup-code").value = backupCode(progress);
}

function disconnectSync() {
    if (!confirm("Scollegare la sincronizzazione su questo dispositivo? I progressi restano qui e su GitHub; la chiave viene cancellata da questo browser.")) return;
    clearTimeout(syncState.timer);
    syncState.config = null;
    syncState.status = "";
    syncState.lastSync = null;
    saveSyncConfig();
    renderSyncPanel();
}

function startSync() {
    syncState.config = loadSyncConfig();
    syncState.startLevel = currentLevelIndex;
    renderSyncPanel();
    if (TEST_MODE) return;
    syncNow();
    // Il telefono riapre la pagina dopo ore: si riallinea, ma non più di una volta ogni 30 secondi
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && Date.now() - syncState.lastAttempt > 30000) syncNow();
        // La pagina va in secondo piano con un salvataggio in attesa: lo fa subito
        if (document.visibilityState === "hidden" && syncState.timer) syncNow();
    });
    window.addEventListener("online", () => syncNow());
}

startSync();
