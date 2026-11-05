// Obiettivi e statistiche. Lo stato è in progress.achievements (id → data di sblocco) e
// progress.stats (contatori); in modalità prova non si registra nulla.

const ACHIEVEMENTS = [
    { id: "hello", icon: "👋", title: "Hello, World", desc: "Risolvi il primo livello." },
    { id: "primo-colpo", icon: "🎯", title: "Al primo colpo", desc: "Risolvi al primo ESEGUI un livello da almeno 3 comandi." },
    { id: "senza-rete", icon: "🧠", title: "Senza rete", desc: "Risolvi un boss senza usare AIUTO." },
    { id: "testardo", icon: "🐐", title: "Testardo", desc: "Risolvi un livello dopo almeno 5 tentativi falliti." },
    { id: "fulmine", icon: "⚡", title: "Fulmine", desc: "Risolvi in meno di un minuto un livello da almeno 4 comandi." },
    { id: "perfezionista", icon: "⭐", title: "Perfezionista", desc: "Ottieni ★★★ in tutti i livelli di un atto." },
    { id: "guru", icon: "🏆", title: "Guru delle pipeline", desc: "Completa tutti i livelli." },
    { id: "rtfm", icon: "📖", title: "RTFM", desc: "Leggi 5 schede diverse del manuale." },
    { id: "scienziato", icon: "🧪", title: "Scienziato", desc: "Porta la pipeline di un livello nel laboratorio." },
    { id: "terminale", icon: "💻", title: "Pronto per il terminale", desc: "Copia una riga di shell." },
    { id: "terminalista", icon: "⌨️", title: "Terminalista", desc: "Risolvi un livello in modalità terminale, scrivendo la pipeline." },
    { id: "maratoneta", icon: "🏃", title: "Maratoneta", desc: "Risolvi 5 livelli in una sola Maratona." },
    { id: "palestra", icon: "🎯", title: "In palestra", desc: "Risolvi 10 livelli di allenamento." },
    { id: "detective", icon: "🔎", title: "Detective", desc: "Chiudi un caso a puntate." },
    { id: "sherlock", icon: "🕵️", title: "Elementare", desc: "Chiudi un caso con tutte le deduzioni al primo tentativo." },
    { id: "esploratore", icon: "🌍", title: "Esploratore", desc: "Risolvi 3 livelli della galleria della community." },
    { id: "abitudinario", icon: "📅", title: "Abitudinario", desc: "Risolvi la sfida del giorno." },
    { id: "serie", icon: "🔥", title: "In serie", desc: "Risolvi la sfida del giorno 3 giorni di fila." }
];

const STAT_LABELS = [
    ["runs", "Esecuzioni"],
    ["failures", "Tentativi falliti"],
    ["firstTry", "Vittorie al primo colpo"],
    ["hints", "Indizi usati"],
    ["labOpens", "Pipeline portate in laboratorio"],
    ["copies", "Righe di shell copiate"]
];

// Stato del livello in corso, azzerato a ogni caricamento
// hintTier: quanti aiuti progressivi sono stati chiesti (0-3)
let levelSession = { attempts: 0, hintUsed: false, hintTier: 0, start: Date.now() };

function startLevelSession() {
    levelSession = { attempts: 0, hintUsed: false, hintTier: 0, start: Date.now() };
}

function bumpStat(key) {
    if (TEST_MODE) return;
    progress.stats[key] = (progress.stats[key] || 0) + 1;
    persistProgress();
}

function unlockAchievement(id) {
    if (TEST_MODE || progress.achievements[id]) return;
    const achievement = ACHIEVEMENTS.find(item => item.id === id);
    if (!achievement) return;
    progress.achievements[id] = new Date().toISOString().slice(0, 10);
    persistProgress();
    showToast(`${achievement.icon} Obiettivo sbloccato: ${achievement.title}`);
}

// Un boss è l'ultimo livello del suo atto
const isBossLevel = index => index === levels.length - 1 || levels[index + 1].act !== levels[index].act;

// Obiettivi legati al singolo tentativo: valgono anche per la sfida del giorno
function checkSessionAchievements(par) {
    const seconds = (Date.now() - levelSession.start) / 1000;
    if (levelSession.attempts === 1) bumpStat("firstTry");
    if (levelSession.attempts === 1 && par >= 3) unlockAchievement("primo-colpo");
    if (levelSession.attempts >= 6) unlockAchievement("testardo");
    if (par >= 4 && seconds < 60) unlockAchievement("fulmine");
}

function checkWinAchievements(index, par) {
    const lvl = levels[index];
    checkSessionAchievements(par);
    if (index === 0) unlockAchievement("hello");
    if (isBossLevel(index) && !levelSession.hintUsed) unlockAchievement("senza-rete");
    const actLevels = levels.filter(other => other.act === lvl.act);
    if (actLevels.every(other => levelStars(progress, other.id) === 3)) unlockAchievement("perfezionista");
    if (levels.every(other => progress.levels[other.id])) unlockAchievement("guru");
}

function noteManualRead(entryId) {
    if (TEST_MODE) return;
    const read = new Set(progress.stats.manualRead || []);
    read.add(entryId);
    progress.stats.manualRead = [...read];
    persistProgress();
    if (read.size >= 5) unlockAchievement("rtfm");
}

// Notifiche in basso, una alla volta
const toastQueue = [];
let toastTimer = null;

function showToast(text) {
    toastQueue.push(text);
    if (!toastTimer) nextToast();
}

function nextToast() {
    const toast = document.getElementById("toast");
    const text = toastQueue.shift();
    if (text === undefined) {
        toast.hidden = true;
        toastTimer = null;
        return;
    }
    toast.textContent = text;
    toast.hidden = false;
    toastTimer = setTimeout(nextToast, 3200);
}

// Pannello "Obiettivi e statistiche", aperto dal menu dei livelli
function openAchievements() {
    closeMenu();
    const body = document.getElementById("stats-body");
    body.innerHTML = "";

    const solved = levels.filter(lvl => progress.levels[lvl.id]).length;
    const unlocked = ACHIEVEMENTS.filter(item => progress.achievements[item.id]).length;
    const rows = [
        ["Livelli risolti", `${solved}/${levels.length}`],
        ["Stelle", `${totalStars(progress, levels)}/${levels.length * 3}`],
        ["Obiettivi", `${unlocked}/${ACHIEVEMENTS.length}`],
        ["Sfide del giorno risolte", String(Object.keys(progress.daily).length)],
        ["Serie attuale", `${dailyStreak(progress.daily)} giorni`],
        ["Record Maratona", `${progress.marathon.best || 0} livelli`],
        ["Capitoli dei casi", `${STORIES.reduce((sum, story) => sum + solvedChapters(story), 0)}/${STORIES.reduce((sum, story) => sum + story.chapters.length, 0)}`],
        ["Deduzioni al primo colpo", String(STORIES.reduce((sum, story) => sum + storyStats(story).firstTry, 0))],
        ["Livelli della community", `${Object.keys(progress.community).length}/${COMMUNITY_LEVELS.length}`],
        ["Livelli di allenamento", String(Object.values(progress.training).reduce((sum, n) => sum + n, 0))],
        ...STAT_LABELS.map(([key, label]) => [label, String(progress.stats[key] || 0)]),
        ["Schede del manuale lette", String((progress.stats.manualRead || []).length)]
    ];
    const table = el("div", "stats-table");
    for (const [label, value] of rows) {
        table.append(el("span", "stats-label", label), el("span", "stats-value", value));
    }
    body.append(el("h3", "manual-section", "Statistiche"), table, el("h3", "manual-section", "Obiettivi"));

    const grid = el("div", "achievement-grid");
    for (const item of ACHIEVEMENTS) {
        const date = progress.achievements[item.id];
        const card = el("div", "achievement" + (date ? " unlocked" : ""));
        card.append(el("span", "achievement-icon", date ? item.icon : "🔒"),
            el("strong", "", item.title), el("span", "achievement-desc", item.desc));
        if (date) card.appendChild(el("span", "achievement-date", `sbloccato il ${date.split("-").reverse().join("/")}`));
        grid.appendChild(card);
    }
    body.appendChild(grid);
    document.getElementById("stats-overlay").hidden = false;
}

function closeAchievements() {
    document.getElementById("stats-overlay").hidden = true;
}
