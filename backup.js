// Backup dei progressi: un codice da copiare o un file da scaricare, per passare da un
// dispositivo all'altro o non perdere nulla se si svuota il browser.
// Il ripristino può unire i progressi (tiene il risultato migliore di ognuno) o sostituirli.

const BACKUP_PREFIX = "PIPEDREAMS1:";
const BACKUP_MAX_LENGTH = 1000000;

const todayKey = () => new Date().toISOString().slice(0, 10);

function backupData(progress) {
    return { app: "pipedreams", version: APP_VERSION, date: todayKey(), progress };
}

const backupCode = progress => BACKUP_PREFIX + encodeData(backupData(progress));

// Legge un codice di backup o il contenuto di un file di backup: { progress, date } oppure { error }
function readBackup(text) {
    const trimmed = String(text).trim();
    if (!trimmed) return { error: "Incolla un codice di backup o scegli un file." };
    if (trimmed.length > BACKUP_MAX_LENGTH) return { error: "Il backup è troppo grande." };
    let data;
    try {
        if (trimmed.startsWith(BACKUP_PREFIX)) data = decodeData(trimmed.slice(BACKUP_PREFIX.length).replace(/\s+/g, ""));
        else if (trimmed.startsWith("{")) data = JSON.parse(trimmed);
        else return { error: `Non è un backup di Pipe Dreams: il codice inizia con ${BACKUP_PREFIX}` };
    } catch (e) {
        return { error: "Il backup è danneggiato: copialo di nuovo per intero." };
    }
    const progress = isPlainObject(data) && data.app === "pipedreams" ? normalizeProgress(data.progress) : null;
    if (!progress) return { error: "Non è un backup di Pipe Dreams." };
    return { progress: cleanProgress(progress), date: typeof data.date === "string" ? data.date : "" };
}

// Tiene solo i valori con la forma giusta: un backup modificato a mano non deve rompere il gioco
function cleanProgress(progress) {
    const pick = (object, valid) => Object.fromEntries(Object.entries(object).filter(([, value]) => valid(value)));
    const isCount = value => Number.isInteger(value) && value >= 0;
    const isResult = value => isPlainObject(value) && [1, 2, 3].includes(value.stars);
    return {
        levels: pick(progress.levels, value => isResult(value) && isCount(value.best)),
        lastLevel: isCount(progress.lastLevel) ? progress.lastLevel : 0,
        seenActs: progress.seenActs.filter(isCount),
        stats: pick(progress.stats, value => isCount(value) || (Array.isArray(value) && value.every(item => typeof item === "string"))),
        achievements: pick(progress.achievements, value => typeof value === "string"),
        daily: pick(progress.daily, value => isResult(value) && isCount(value.used)),
        terminal: pick(progress.terminal, value => value === true),
        marathon: pick(progress.marathon, isCount),
        training: pick(progress.training, isCount),
        community: pick(progress.community, value => isResult(value) && isCount(value.best)),
        stories: pick(Object.fromEntries(Object.entries(progress.stories).filter(([, story]) => isPlainObject(story)).map(([id, story]) => [id, {
            puzzles: pick(isPlainObject(story.puzzles) ? story.puzzles : {}, value => isResult(value) && isCount(value.best)),
            chapters: pick(isPlainObject(story.chapters) ? story.chapters : {}, value => isResult(value) && isCount(value.attempts)),
            tries: pick(isPlainObject(story.tries) ? story.tries : {}, isCount),
            wrong: isCount(story.wrong) ? story.wrong : 0,
            hints: isCount(story.hints) ? story.hints : 0
        }])), isPlainObject)
    };
}

// Unione di due salvataggi: per ogni livello e sfida il risultato migliore, obiettivi e
// contatori dal salvataggio più avanti
function mergeProgress(a, b) {
    const better = (x, y, count) => !x ? y : !y ? x : (y.stars > x.stars || (y.stars === x.stars && y[count] < x[count])) ? y : x;
    const mergeBy = (left, right, choose) => {
        const result = { ...left };
        for (const [key, value] of Object.entries(right)) result[key] = key in result ? choose(result[key], value) : value;
        return result;
    };
    return {
        levels: mergeBy(a.levels, b.levels, (x, y) => better(x, y, "best")),
        lastLevel: Math.max(a.lastLevel, b.lastLevel),
        seenActs: [...new Set([...a.seenActs, ...b.seenActs])].sort((x, y) => x - y),
        stats: mergeBy(a.stats, b.stats, (x, y) => Array.isArray(x) && Array.isArray(y) ? [...new Set([...x, ...y])]
            : typeof x === "number" && typeof y === "number" ? Math.max(x, y) : y),
        achievements: mergeBy(a.achievements, b.achievements, (x, y) => x < y ? x : y),
        daily: mergeBy(a.daily, b.daily, (x, y) => better(x, y, "used")),
        terminal: { ...a.terminal, ...b.terminal },
        marathon: mergeBy(a.marathon, b.marathon, Math.max),
        training: mergeBy(a.training, b.training, Math.max),
        community: mergeBy(a.community, b.community, (x, y) => better(x, y, "best")),
        stories: mergeBy(a.stories, b.stories, (x, y) => ({
            puzzles: mergeBy(x.puzzles, y.puzzles, (p, q) => better(p, q, "best")),
            chapters: mergeBy(x.chapters, y.chapters, (p, q) => better(p, q, "attempts")),
            tries: mergeBy(x.tries, y.tries, Math.max),
            wrong: Math.max(x.wrong || 0, y.wrong || 0),
            hints: Math.max(x.hints || 0, y.hints || 0)
        }))
    };
}

function progressSummary(p) {
    const solved = levels.filter(lvl => p.levels[lvl.id]).length;
    const unlocked = ACHIEVEMENTS.filter(item => p.achievements[item.id]).length;
    return `${solved}/${levels.length} livelli · ${totalStars(p, levels)} ★ · ${unlocked} obiettivi · ${Object.keys(p.daily).length} sfide del giorno`;
}

function openBackup() {
    closeMenu();
    document.getElementById("backup-summary").textContent = progressSummary(progress);
    document.getElementById("backup-code").value = backupCode(progress);
    document.getElementById("backup-input").value = "";
    document.getElementById("backup-message").textContent = "";
    document.getElementById("backup-overlay").hidden = false;
}

function closeBackup() {
    document.getElementById("backup-overlay").hidden = true;
}

async function copyBackupCode() {
    const copied = await copyText(backupCode(progress));
    showToast(copied ? "💾 Codice di backup copiato: incollalo sull'altro dispositivo." : "Seleziona il codice e copialo a mano.");
}

function downloadBackup() {
    const blob = new Blob([JSON.stringify(backupData(progress), null, 1)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pipedreams-backup-${todayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Il file scelto finisce nella casella del codice, poi si sceglie se unire o sostituire
function loadBackupFile(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > BACKUP_MAX_LENGTH) {
        document.getElementById("backup-message").textContent = "Il file è troppo grande per essere un backup.";
        return;
    }
    file.text().then(text => {
        document.getElementById("backup-input").value = text;
        const result = readBackup(text);
        document.getElementById("backup-message").textContent = result.error ||
            `Backup${result.date ? ` del ${result.date.split("-").reverse().join("/")}` : ""}: ${progressSummary(result.progress)}. Scegli UNISCI o SOSTITUISCI.`;
    });
    input.value = "";
}

function restoreBackup(mode) {
    const result = readBackup(document.getElementById("backup-input").value);
    if (result.error) {
        document.getElementById("backup-message").textContent = result.error;
        return;
    }
    if (mode === "replace" && !confirm(`Sostituire i progressi attuali (${progressSummary(progress)}) con quelli del backup (${progressSummary(result.progress)})?`)) return;
    progress = mode === "replace" ? result.progress : mergeProgress(progress, result.progress);
    persistProgress();
    closeBackup();
    loadLevel(startLevelIndex());
    showToast(`💾 Progressi ${mode === "replace" ? "ripristinati" : "uniti"}: ${progressSummary(progress)}`);
}
