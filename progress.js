// Salvataggio dei progressi in localStorage.
// I risultati sono indicizzati per id del livello, così restano validi se l'ordine dei livelli cambia.
// Se localStorage non è disponibile (navigazione privata, file bloccati) il gioco funziona senza salvare.
const PROGRESS_KEY = "pipedreams.progress.v1";

// seenActs: atti di cui è già stata mostrata l'introduzione; stats e achievements: obiettivi;
// daily: risultati della sfida del giorno, per data (AAAA-MM-GG); terminal: livelli risolti
// in modalità terminale; marathon: record e partite della Maratona; training: livelli
// dell'allenamento risolti, per argomento
function emptyProgress() {
    return { levels: {}, lastLevel: 0, seenActs: [], stats: {}, achievements: {}, daily: {}, terminal: {}, marathon: {}, training: {} };
}

const isPlainObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

// Progressi letti da una fonte esterna (localStorage o backup): null se non sono progressi.
// I salvataggi precedenti non hanno i campi nuovi: si completano con i valori vuoti.
function normalizeProgress(data) {
    if (!isPlainObject(data) || !isPlainObject(data.levels)) return null;
    return {
        levels: data.levels,
        lastLevel: Number(data.lastLevel) || 0,
        seenActs: Array.isArray(data.seenActs) ? data.seenActs : [],
        stats: isPlainObject(data.stats) ? data.stats : {},
        achievements: isPlainObject(data.achievements) ? data.achievements : {},
        daily: isPlainObject(data.daily) ? data.daily : {},
        terminal: isPlainObject(data.terminal) ? data.terminal : {},
        marathon: isPlainObject(data.marathon) ? data.marathon : {},
        training: isPlainObject(data.training) ? data.training : {}
    };
}

function loadProgress() {
    try {
        const progress = normalizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY)));
        if (progress) return progress;
    } catch (e) {
        // dati corrotti o storage non accessibile: si riparte da zero
    }
    return emptyProgress();
}

function saveProgress(progress) {
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
        // storage pieno o bloccato: il progresso resta solo in memoria
    }
}

// Registra un livello risolto mantenendo il risultato migliore. Restituisce true se è un nuovo record.
function recordResult(progress, levelId, stars, used) {
    const previous = progress.levels[levelId];
    if (previous && (previous.stars > stars || (previous.stars === stars && previous.best <= used))) {
        return false;
    }
    progress.levels[levelId] = { stars, best: used };
    return true;
}

function levelStars(progress, levelId) {
    const entry = progress.levels[levelId];
    return entry ? entry.stars : 0;
}

// Un livello è sbloccato se è il primo o se il precedente è stato risolto
function isUnlocked(progress, levelList, index) {
    return index === 0 || Boolean(progress.levels[levelList[index - 1].id]);
}

function totalStars(progress, levelList) {
    return levelList.reduce((sum, lvl) => sum + levelStars(progress, lvl.id), 0);
}

function starString(stars) {
    return "★".repeat(stars) + "☆".repeat(3 - stars);
}

// Livello di prova scritto dall'editor e aperto dal gioco con index.html?test
const TEST_LEVEL_KEY = "pipedreams.editor.test";

function saveTestLevel(level) {
    try {
        localStorage.setItem(TEST_LEVEL_KEY, JSON.stringify(level));
        return true;
    } catch (e) {
        return false;
    }
}

function loadTestLevel() {
    try {
        const level = JSON.parse(localStorage.getItem(TEST_LEVEL_KEY));
        const valid = level && Array.isArray(level.stdin) && Array.isArray(level.target) &&
            Array.isArray(level.allowedCommands) && level.allowedCommands.every(step => COMMANDS[step.cmd]);
        return valid ? level : null;
    } catch (e) {
        return null;
    }
}

// Preferenze del giocatore (es. velocità dell'animazione), separate dai progressi
const SETTINGS_KEY = "pipedreams.settings.v1";

function loadSettings() {
    try {
        const data = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (data && typeof data === "object") return data;
    } catch (e) {
        // impostazioni corrotte o storage non accessibile: valori predefiniti
    }
    return {};
}

function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        // senza storage la preferenza vale solo per questa visita
    }
}
