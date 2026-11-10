// Durata di ogni passo dell'animazione della pipeline, per velocità
const SPEEDS = {
    lenta: { label: "Lenta", delay: 1000 },
    normale: { label: "Normale", delay: 600 },
    veloce: { label: "Veloce", delay: 250 },
    istantanea: { label: "Istantanea", delay: 0 }
};

let currentLevelIndex = 0;
let gridState = [];
// Blocca input ed esecuzioni durante l'animazione e il passaggio al livello successivo
let isBusy = false;
let transitionTimer = null;
// Incrementato a ogni caricamento: un'animazione in corso si interrompe se il livello cambia
let runId = 0;
// Animazione in corso: ESEGUI diventa SALTA, che completa subito i passi rimanenti
let isAnimating = false;
let skipRequested = false;
let wakeUp = null;
// Risultato del solver per il livello corrente (par = numero minimo di comandi)
let currentSolution = null;
// Livello della sfida del giorno, se attiva (altrimenti si gioca levels[currentLevelIndex])
let dailyLevel = null;
let progress = loadProgress();
// index.html?test: gioca il livello di prova dell'editor senza toccare i progressi salvati
// index.html#livello=...: un livello condiviso con un link, giocato senza toccare i progressi
const sharedLink = sharedLevelFromHash(location.hash);
const TEST_MODE = new URLSearchParams(location.search).has("test") || Boolean(sharedLink && sharedLink.level);
let settings = loadSettings();
// Senza una scelta salvata, chi ha chiesto al sistema di ridurre il movimento parte senza animazione
if (!SPEEDS[settings.speed]) {
    settings.speed = matchMedia("(prefers-reduced-motion: reduce)").matches ? "istantanea" : "normale";
}
// Suoni attivi e CRT spento finché il giocatore non sceglie diversamente
if (typeof settings.sound !== "boolean") settings.sound = true;
if (typeof settings.crt !== "boolean") settings.crt = false;

const currentLevel = () => dailyLevel || levels[currentLevelIndex];

function loadLevel(index) {
    stopMarathon();
    stopTraining();
    stopGallery();
    stopMystery();
    dailyLevel = null;
    currentLevelIndex = index;
    progress.lastLevel = index;
    persistProgress();
    const lvl = levels[index];
    showLevel(lvl, `LIVELLO ${index + 1}/${levels.length}: ${lvl.title}`);
    logToConsole(`> Caricato livello ${index + 1}: ${lvl.title}.`);
    const record = progress.levels[lvl.id];
    if (record) {
        logToConsole(`> Record personale: ${starString(record.stars)} (${isSpecialLevel(lvl) ? attemptCount(record.best) : commandCount(record.best)})`, "log-hint");
    }
}

function loadDaily() {
    stopMarathon();
    stopTraining();
    stopGallery();
    stopMystery();
    const key = dateKey();
    dailyLevel = generateDaily(key);
    showLevel(dailyLevel, `📅 SFIDA DEL ${formatDate(key)} (${dailyLevel.daily.difficulty}): ${dailyLevel.title}`);
    logToConsole(`> Sfida del giorno: ${dailyLevel.title}. Ogni giorno una nuova, uguale per tutti.`);
    const record = progress.daily[key];
    if (record) {
        logToConsole(`> Già risolta oggi: ${starString(record.stars)} (${commandCount(record.used)}). Puoi rigiocarla.`, "log-hint");
    }
}

const formatDate = key => key.split("-").reverse().join("/");

// Parte comune a livelli della campagna e sfida del giorno
// Quiz e debug si valutano sui tentativi, non sul numero di comandi
const isSpecialLevel = lvl => lvl.type === "quiz" || lvl.type === "debug";

// Testo sopra la griglia, per tipo di livello
function gridHint(lvl) {
    if (lvl.type === "quiz") return "La pipeline di Tommaso: cosa stampa?";
    if (lvl.type === "debug") return `Puoi cambiare al massimo ${lvl.maxChanges || 1} ${(lvl.maxChanges || 1) === 1 ? "cella" : "celle"}:`;
    if (lvl.locked) return "Tocca le celle libere (🔒 = bloccata):";
    return "Tocca le celle per cambiare comando:";
}

function showLevel(lvl, titleText) {
    gridState = lvl.start ? [...lvl.start] : new Array(levelSlots(lvl)).fill(0);
    for (const [slot, choice] of Object.entries(lvl.locked || {})) gridState[slot] = choice;
    document.body.dataset.levelType = lvl.type || (lvl.locked ? "locked" : "compose");
    document.getElementById("grid-hint").textContent = gridHint(lvl);
    clearTimeout(transitionTimer);
    runId++;
    stopAnimation();
    setBusy(false);
    hideSolutionCard();
    hideNextButton();
    hideTutorButton();
    closeAdvisor();

    currentSolution = analyzeLevel(lvl);
    startLevelSession();
    document.getElementById("level-title").innerText = titleText;
    // L'obiettivo dei livelli condivisi o di prova ammette solo tag semplici: può arrivare da chiunque
    const mission = TEST_MODE || lvl.community ? safeMissionHtml(lvl.mission) : lvl.mission;
    document.getElementById("mission-desc").innerHTML = `<strong>OBIETTIVO:</strong> ${mission}`;
    renderManRefs(lvl);
    renderChips(document.getElementById("txt-stdin"), normalizeInput(lvl.stdin));
    // Nel quiz lo stdout è proprio la domanda
    // Nel quiz lo stdout è la domanda; negli enigmi dei casi è l'indizio da scoprire
    renderChips(document.getElementById("txt-target"), lvl.type === "quiz" ? [{ text: "?", fd: 1 }]
        : lvl.hiddenTarget ? [{ text: `🔒 nascosto: è l'indizio (${lvl.target.length} ${lvl.target.length === 1 ? "riga" : "righe"})`, fd: 1 }]
        : lvl.target.map(text => ({ text, fd: 1 })));
    // Stderr atteso sul terminale (es. con tee /dev/stderr) e file del livello per comm e join
    const expectedErr = lvl.type === "quiz" ? [] : lvl.targetStderr || [];
    document.getElementById("row-target-stderr").hidden = !expectedErr.length;
    renderChips(document.getElementById("txt-target-stderr"), lvl.hiddenTarget && expectedErr.length
        ? [{ text: `🔒 nascosto: fa parte dell'indizio (${expectedErr.length} ${expectedErr.length === 1 ? "riga" : "righe"})`, fd: 2 }]
        : expectedErr.map(text => ({ text, fd: 2 })));
    const files = document.getElementById("level-files");
    files.innerHTML = "";
    for (const [name, lines] of Object.entries(levelFiles(lvl))) {
        const row = document.createElement("div");
        const label = document.createElement("strong");
        // I file compressi si leggono con zcat, bzcat o xzcat: qui si vede il contenuto decompresso
        label.textContent = /\.(gz|bz2|xz)$/.test(name) ? `file ${name} (compresso, qui decompresso):` : `file ${name}:`;
        const chips = document.createElement("span");
        chips.className = "chips";
        renderChips(chips, lines.map(text => ({ text, fd: 1 })));
        row.append(label, " ", chips);
        files.appendChild(row);
    }
    // Da dove arriva l'input (es. l'output di apt list --upgradable)
    document.getElementById("stdin-source").textContent = lvl.source ? ` (output di ${lvl.source})` : "";
    document.querySelector(".terminal-prompt").textContent = `$ ${lvl.source || "programma"}`;
    renderQuiz(lvl);

    buildGrid();
    updateShellLine();
    updateSlotCounter();
    renderStream("Input del programma", normalizeInput(lvl.stdin), []);
    renderStory(lvl);
    document.getElementById("console").innerHTML = "";
    document.getElementById("terminal-input").value = "";
    applyInputMode();
    updateHintButton();
    tutorialEvent("level", lvl);
}

// Crea una cella per ogni slot del livello
function buildGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    gridState.forEach((_, i) => {
        // Pulsanti: si usano anche da tastiera (Invio o Spazio = comando successivo, ↑ = precedente)
        const cell = document.createElement("button");
        cell.type = "button";
        const lvl = currentLevel();
        cell.className = "cell"
            + (lvl.locked && lvl.locked[i] !== undefined ? " locked" : "")
            + (lvl.type === "quiz" ? " static" : "");
        cell.id = `c${i}`;
        cell.onclick = () => cycleCell(i);
        cell.onkeydown = event => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                cycleCell(i, event.key === "ArrowUp" ? -1 : 1);
            }
        };
        if (lvl.type === "quiz") cell.tabIndex = -1;
        const name = document.createElement("span");
        name.className = "cmd-name";
        const desc = document.createElement("span");
        desc.className = "cmd-desc";
        cell.append(name, desc);
        grid.appendChild(cell);
        updateCellUI(i);
    });
}

function setBusy(busy) {
    isBusy = busy;
    setRunButton(busy ? "disabled" : "run");
}

// "run": ESEGUI attivo, "skip": SALTA durante l'animazione, "disabled": in attesa del livello successivo
function setRunButton(mode) {
    const button = document.getElementById("btn-run");
    button.disabled = mode === "disabled";
    button.textContent = mode === "skip" ? "SALTA ( ⏭ )" : "ESEGUI ( ▶ )";
}

function setSpeed(speed) {
    if (!SPEEDS[speed]) return;
    settings.speed = speed;
    saveSettings(settings);
    renderSpeedControl();
}

function toggleSetting(key) {
    // Consigli e avanti automatico sono accesi finché non si spengono (valore assente = acceso)
    if (key === "advisor") settings.advisor = settings.advisor === false;
    else if (key === "autoNext") settings.autoNext = autoNextOn() ? false : undefined;
    else settings[key] = !settings[key];
    if (key === "advisor" && settings.advisor === false) closeAdvisor();
    // Avanti automatico spento durante l'attesa: il passaggio si ferma e compare il pulsante
    if (key === "autoNext" && !autoNextOn() && pendingNext) {
        clearTimeout(transitionTimer);
        showNextButton();
    }
    saveSettings(settings);
    renderFxControl();
    applyCrt();
    applyColorMode();
    if (key === "sound" && settings.sound) playClick();
}

function renderFxControl() {
    const sound = document.getElementById("btn-sound");
    sound.textContent = settings.sound ? "🔊 Suoni" : "🔇 Suoni";
    sound.setAttribute("aria-pressed", String(settings.sound));
    sound.classList.toggle("active", settings.sound);
    const crt = document.getElementById("btn-crt");
    crt.setAttribute("aria-pressed", String(settings.crt));
    crt.classList.toggle("active", settings.crt);
    const advisor = document.getElementById("btn-advisor");
    advisor.setAttribute("aria-pressed", String(settings.advisor !== false));
    advisor.classList.toggle("active", settings.advisor !== false);
    const autoNext = document.getElementById("btn-autonext");
    autoNext.setAttribute("aria-pressed", String(autoNextOn()));
    autoNext.classList.toggle("active", autoNextOn());
    const cvd = document.getElementById("btn-cvd");
    cvd.setAttribute("aria-pressed", String(Boolean(settings.cvd)));
    cvd.classList.toggle("active", Boolean(settings.cvd));
}

// Colori per daltonici: blu e arancione al posto di verde e rosso
function applyColorMode() {
    document.body.classList.toggle("cvd", Boolean(settings.cvd));
}

function renderSpeedControl() {
    document.querySelectorAll("#speed-control button").forEach(button => {
        const active = button.dataset.speed === settings.speed;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

// Attende un passo dell'animazione; SALTA o un cambio di livello la interrompono subito
function waitStep(ms) {
    if (skipRequested || ms === 0) return Promise.resolve();
    return new Promise(resolve => {
        const timer = setTimeout(resolve, ms);
        wakeUp = () => {
            clearTimeout(timer);
            resolve();
        };
    });
}

function skipAnimation() {
    skipRequested = true;
    if (wakeUp) wakeUp();
}

function stopAnimation() {
    skipAnimation();
    isAnimating = false;
    wakeUp = null;
}

function currentSteps() {
    if (terminalActive()) return parsePipeline(terminalText(), levelFiles(currentLevel())).steps || [];
    const options = slotOptions(currentLevel());
    return gridState.map(idx => options[idx]);
}

// Pagine man da leggere per il livello (campo man: ["sort", "fold"]): pulsanti sotto l'obiettivo
function renderManRefs(lvl) {
    const box = document.getElementById("level-man");
    box.innerHTML = "";
    const names = Array.isArray(lvl.man) ? lvl.man.filter(name => typeof name === "string") : [];
    box.hidden = !names.length;
    if (!names.length) return;
    box.append("📄 Da leggere: ");
    names.forEach(name => {
        const button = document.createElement("button");
        button.className = "man-ref";
        button.textContent = `man ${name}`;
        button.onclick = () => {
            const entry = manEntryFor(name);
            if (entry) openManPage(entry.id);
        };
        box.append(button, " ");
    });
}

// --- Modalità terminale: si sblocca per i livelli "componi" di un atto completato ---
const terminalText = () => document.getElementById("terminal-input").value;
const actCompleted = act => levels.filter(lvl => lvl.act === act).every(lvl => progress.levels[lvl.id]);
// Negli enigmi dei casi il terminale è sempre disponibile: il caso si apre solo dopo l'Atto III
const terminalAvailable = lvl => !TEST_MODE && !lvl.type && !lvl.locked && (Boolean(lvl.mystery) || (lvl.act > 0 && actCompleted(lvl.act)));
const terminalActive = () => settings.inputMode === "terminal" && terminalAvailable(currentLevel());

function setInputMode(mode) {
    const lvl = currentLevel();
    if (mode === "terminal" && !terminalAvailable(lvl)) {
        logToConsole(`> ⌨️ La modalità terminale si sblocca risolvendo tutti i livelli dell'Atto ${ROMAN[lvl.act] || lvl.act}.`, "log-hint");
        return;
    }
    settings.inputMode = mode;
    saveSettings(settings);
    applyInputMode();
    if (mode === "terminal") document.getElementById("terminal-input").focus();
}

function applyInputMode() {
    const lvl = currentLevel();
    const offer = !TEST_MODE && (lvl.act > 0 || Boolean(lvl.mystery)) && !lvl.type && !lvl.locked;
    const terminal = terminalActive();
    document.getElementById("mode-toggle").hidden = !offer;
    document.body.dataset.input = terminal ? "terminal" : "cells";
    document.querySelectorAll("#mode-toggle button").forEach(button => {
        const active = (button.dataset.mode === "terminal") === terminal;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
    const lockedButton = document.querySelector('#mode-toggle [data-mode="terminal"]');
    lockedButton.textContent = terminalAvailable(lvl) ? "⌨️ Terminale" : "⌨️ Terminale 🔒";
    renderTerminalSuggestions(lvl);
    refreshTerminal();
}

// I comandi del livello come suggerimenti: toccandone uno si aggiunge alla pipeline
function renderTerminalSuggestions(lvl) {
    const box = document.getElementById("terminal-suggest");
    box.innerHTML = "";
    for (const step of lvl.allowedCommands) {
        const chip = document.createElement("button");
        chip.className = "terminal-chip";
        chip.textContent = stepLabel(step);
        chip.onclick = () => {
            const input = document.getElementById("terminal-input");
            const current = input.value.trim();
            const label = stepLabel(step);
            input.value = !current ? label : COMMANDS[step.cmd].redirect ? `${current} ${label}` : `${current} | ${label}`;
            refreshTerminal();
            input.focus();
        };
        box.appendChild(chip);
    }
}

// Errore di sintassi mostrato mentre si scrive, come farebbe bash all'invio
function refreshTerminal() {
    if (!terminalActive()) {
        updateShellLine();
        updateSlotCounter();
        return;
    }
    const text = terminalText();
    // «man sort» non è una pipeline: con Invio apre la pagina del manuale
    const result = !text.trim() || parseHelpCommand(text) ? { steps: [] } : parsePipeline(text, levelFiles(currentLevel()));
    document.getElementById("terminal-error").textContent = result.error || "";
    updateShellLine();
    updateSlotCounter();
}

function cycleCell(index, direction = 1) {
    if (isBusy) return;
    const lvl = currentLevel();
    if (lvl.type === "quiz") return;
    if (lvl.locked && lvl.locked[index] !== undefined) {
        logToConsole("> Questa cella è bloccata: lavora con le altre.", "log-hint");
        return;
    }
    if (lvl.type === "debug") {
        const max = lvl.maxChanges || 1;
        const otherChanges = gridState.filter((choice, i) => i !== index && choice !== lvl.start[i]).length;
        if (otherChanges >= max) {
            logToConsole(`> Puoi cambiare al massimo ${max} ${max === 1 ? "cella" : "celle"}: riporta l'altra com'era prima.`, "log-hint");
            return;
        }
    }
    const maxCmds = slotOptions(lvl).length;
    gridState[index] = (gridState[index] + direction + maxCmds) % maxCmds;
    playClick();
    updateCellUI(index);
    updateSlotCounter();
    updateShellLine();
    tutorialEvent("cell");
}

function updateCellUI(index) {
    const cellElem = document.getElementById(`c${index}`);
    const step = slotOptions(currentLevel())[gridState[index]];

    cellElem.querySelector('.cmd-name').innerText = stepLabel(step);
    cellElem.querySelector('.cmd-desc').innerText = step.desc;
    const lvlForLabel = currentLevel();
    const locked = lvlForLabel.locked && lvlForLabel.locked[index] !== undefined;
    cellElem.setAttribute("aria-label", `Cella ${index + 1}: ${step.cmd === null ? "vuota" : `${stepLabel(step)}, ${step.desc}`}` +
        (locked ? ", bloccata" : lvlForLabel.type === "quiz" ? "" : ". Invio per il comando successivo, freccia su per il precedente"));

    if (gridState[index] === 0) {
        cellElem.classList.remove("active");
    } else {
        cellElem.classList.add("active");
    }
    const lvl = currentLevel();
    cellElem.classList.toggle("changed", lvl.type === "debug" && gridState[index] !== lvl.start[index]);
}

// Riga di shell sotto le celle. Nei livelli con il comando di origine (source) si può scegliere:
// «riproducibile» (printf con l'input del livello: stesso output del gioco) oppure «sul sistema
// vero» (il comando vero seguito dalla pipeline). La scelta resta nelle preferenze.
const showRealLine = lvl => Boolean(lvl.source) && settings.shellView === "real";

function updateShellLine() {
    const lvl = currentLevel();
    const real = showRealLine(lvl);
    document.getElementById("shell-view").hidden = !lvl.source;
    document.querySelectorAll("#shell-view button").forEach(button => {
        button.setAttribute("aria-pressed", String((button.dataset.view === "real") === real));
    });
    document.getElementById("shell-line").textContent = real
        ? realShellLine(lvl.source, currentSteps(), " |\n  ")
        : buildShellLine(lvl.stdin, currentSteps(), " |\n  ");
    const files = Object.keys(levelFiles(lvl));
    document.getElementById("shell-note").textContent = real
        ? `Il comando vero, come lo scriveresti al lavoro: sul tuo sistema l'output sarà diverso (i tuoi processi, i tuoi dischi, i tuoi log).${files.length ? ` Prima crea ${files.join(" e ")} con le righe del livello.` : ""}`
        : "Provala in bash su Linux (GNU coreutils): dà lo stesso output del gioco.";
}

function setShellView(view) {
    settings.shellView = view === "real" ? "real" : "riproducibile";
    saveSettings(settings);
    updateShellLine();
}

// Copia negli appunti; restituisce true se è riuscito
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // API negata o non disponibile (es. alcuni browser con file://): metodo classico
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let copied = false;
        try { copied = document.execCommand("copy"); } catch (err) { copied = false; }
        area.remove();
        return copied;
    }
}

async function copyShellLine() {
    const copied = await copyText(document.getElementById("shell-line").textContent);
    const button = document.getElementById("btn-copy");
    button.textContent = copied ? "COPIATA ✓" : "SELEZIONA E COPIA";
    if (copied) {
        bumpStat("copies");
        unlockAchievement("terminale");
    }
    setTimeout(() => { button.textContent = "COPIA"; }, 1500);
}

// Comandi scelti dal giocatore: le celle bloccate non contano
function usedSlots() {
    if (terminalActive()) return currentSteps().length;
    const locked = currentLevel().locked || {};
    return gridState.filter((cmdIndex, i) => cmdIndex !== 0 && locked[i] === undefined).length;
}

function updateSlotCounter() {
    const lvl = currentLevel();
    const display = document.getElementById("score-display");
    if (lvl.type === "quiz") {
        display.innerText = "Scegli l'output";
    } else if (terminalActive()) {
        const par = currentSolution && currentSolution.par !== null ? ` · Par: ${currentSolution.par}` : "";
        display.innerText = `⌨️ Comandi: ${usedSlots()}${par}`;
    } else if (lvl.type === "debug") {
        const changes = gridState.filter((choice, i) => choice !== lvl.start[i]).length;
        display.innerText = `Modifiche: ${changes}/${lvl.maxChanges || 1}`;
    } else {
        const free = gridState.length - Object.keys(lvl.locked || {}).length;
        const par = currentSolution && currentSolution.par !== null ? ` · Par: ${currentSolution.par}` : "";
        display.innerText = `Slot: ${usedSlots()}/${free}${par}`;
    }
}

// Risposte del quiz in ordine fisso per livello (la giusta non è sempre la prima)
function renderQuiz(lvl) {
    const box = document.getElementById("quiz-box");
    box.hidden = lvl.type !== "quiz";
    box.innerHTML = "";
    if (lvl.type !== "quiz") return;
    const answers = quizAnswers(lvl);
    const shift = Number(lvl.id) % answers.length;
    const ordered = answers.map((_, i) => answers[(i + shift) % answers.length]);
    ordered.forEach((answer, i) => {
        const button = document.createElement("button");
        button.className = "quiz-answer";
        const letter = document.createElement("span");
        letter.className = "quiz-letter";
        letter.textContent = `${"ABC"[i]})`;
        const chips = document.createElement("span");
        chips.className = "chips";
        renderChips(chips, answer.output.map(text => ({ text, fd: 1 })));
        button.append(letter, chips);
        button.dataset.correct = String(answer.correct);
        button.onclick = () => chooseAnswer(answer, button);
        box.appendChild(button);
    });
}

function chooseAnswer(answer, button) {
    if (isBusy) return;
    levelSession.attempts++;
    bumpStat("runs");
    document.getElementById("console").innerHTML = "";
    if (answer.correct) {
        button.classList.add("right");
        logToConsole("> ✓ Risposta giusta!", "log-success");
        setBusy(true);
        completeLevel(currentLevel());
    } else {
        button.classList.add("wrong");
        button.disabled = true;
        bumpStat("failures");
        playFail();
        logToConsole("> ✗ Risposta sbagliata.", "log-error");
        logToConsole(`> ${answer.why}`, "log-hint");
        logToConsole(`> La pipeline di quell'output: ${answer.steps.map(stepLabel).join(" | ")}`, "log-step");
    }
}

function renderStream(title, lines, terminal) {
    document.getElementById("stream-title").innerText = title;
    renderChips(document.getElementById("stream-lines"), lines);
    document.getElementById("stream-terminal").innerText =
        terminal.length ? `⚠ Finito sul terminale (stderr): ${terminal.join(", ")}` : "";
}

// Confronto finale riga per riga con il target
function renderDiff(output, target, terminal) {
    document.getElementById("stream-title").innerText = "Output finale (✓ corretto, ✗ sbagliato, tratteggio = mancante)";
    const lines = output.map(text => ({ text, fd: 1 }));
    const states = output.map((text, i) => text === target[i] ? "ok" : "bad");
    for (let i = output.length; i < target.length; i++) {
        lines.push({ text: "?", fd: 1 });
        states.push("missing");
    }
    renderChips(document.getElementById("stream-lines"), lines, states);
    document.getElementById("stream-terminal").innerText =
        terminal.length ? `⚠ Finito sul terminale (stderr): ${terminal.join(", ")}` : "";
}

// --- Aiuti progressivi: 1) spinta (gratis), 2) piano (massimo ★★), 3) una cella (massimo ★) ---
const HINT_STEPS = [
    { label: "SPINTA", cap: 3 },
    { label: "PIANO", cap: 2 },
    { label: "UNA CELLA", cap: 1 }
];

// Massimo di stelle ancora ottenibili dopo gli aiuti chiesti
// Aiuti chiesti durante il livello; dopo aver visto la soluzione ottimale, riprovando, al massimo ★★
const hintStarCap = () => Math.min(levelSession.hintTier ? HINT_STEPS[levelSession.hintTier - 1].cap : 3, levelSession.sawSolution ? 2 : 3);

function updateHintButton() {
    const tier = Math.min(levelSession.hintTier + 1, HINT_STEPS.length);
    document.getElementById("btn-hint").textContent = `? AIUTO ${tier}/${HINT_STEPS.length}`;
}

function showHint() {
    const lvl = currentLevel();
    if (levelSession.hintTier < HINT_STEPS.length) levelSession.hintTier++;
    levelSession.hintUsed = true;
    bumpStat("hints");
    const consoleBox = document.getElementById("console");
    consoleBox.innerHTML = "";
    const tier = levelSession.hintTier;
    if (tier >= 1) logToConsole(`> [AIUTO 1 · SPINTA] ${lvl.nudge || lvl.hint}`, "log-hint");
    if (tier >= 2) logToConsole(`> [AIUTO 2 · PIANO] ${lvl.hint}`, "log-hint");
    if (tier >= 3) logToConsole(`> [AIUTO 3 · UNA CELLA] ${revealHint(lvl)}`, "log-hint");
    if (tier < HINT_STEPS.length) {
        const next = HINT_STEPS[tier];
        logToConsole(next.cap < 3
            ? `> Il prossimo aiuto (${next.label.toLowerCase()}) limita le stelle a ${starString(next.cap)}.`
            : `> Premi ancora AIUTO per il prossimo aiuto.`, "log-step");
    }
    updateHintButton();
    // Gli aiuti lunghi superano l'altezza della console: si legge dall'inizio
    consoleBox.scrollTop = 0;
}

// Terzo aiuto: rivela un pezzo della soluzione calcolata dal solver, a seconda del tipo di livello
function revealHint(lvl) {
    if (lvl.type === "quiz") {
        const wrong = [...document.querySelectorAll(".quiz-answer")].find(button => !button.disabled && button.dataset.correct === "false");
        if (wrong) {
            wrong.disabled = true;
            wrong.classList.add("wrong");
            return "Ho eliminato una risposta sbagliata.";
        }
        return "Restano solo risposte possibili: scegli quella giusta.";
    }
    if (lvl.type === "debug") {
        const fix = debugFixes(lvl)[0];
        return `La cella da cambiare è la numero ${fix.cell + 1}.`;
    }
    const solution = referenceSolution(lvl).filter(step => step.cmd !== null);
    if (terminalActive()) {
        const typed = currentSteps();
        const k = solution.findIndex((step, i) => !typed[i] || stepLabel(typed[i]) !== stepLabel(step));
        return k === -1 ? "La tua pipeline coincide già con la soluzione: premi Invio."
            : `Il comando numero ${k + 1} della soluzione è: ${stepLabel(solution[k])}`;
    }
    const options = slotOptions(lvl);
    // Griglia della soluzione: per le celle bloccate quella del solver, altrimenti i comandi dalla prima cella
    const solutionGrid = lvl.locked ? solveLocked(lvl).grids[0]
        : Array.from({ length: gridState.length }, (_, i) => solution[i] ? options.indexOf(solution[i]) : 0);
    if (!lvl.locked) {
        // I comandi del giocatore si compattano verso sinistra, così il confronto è cella per cella
        const placed = gridState.filter(choice => choice !== 0);
        gridState = Array.from({ length: gridState.length }, (_, i) => placed[i] ?? 0);
    }
    const cell = gridState.findIndex((choice, i) => choice !== solutionGrid[i]);
    if (cell === -1) return "Le celle coincidono già con la soluzione: premi ESEGUI.";
    gridState[cell] = solutionGrid[cell];
    buildGrid();
    document.getElementById(`c${cell}`).classList.add("revealed");
    updateShellLine();
    updateSlotCounter();
    return `Cella ${cell + 1}: ${stepLabel(options[solutionGrid[cell]])}.`;
}

function describeLines(lines) {
    const out = lines.filter(line => line.fd === 1).map(line => line.text);
    const err = lines.filter(line => line.fd === 2).map(line => line.text);
    return `[${out.join(", ")}]` + (err.length ? ` · stderr: [${err.join(", ")}]` : "");
}

// Comandi di aiuto nel terminale (man, man -k, apropos, whatis, --help): non eseguono la
// pipeline e non contano come tentativo. Restituisce true se la riga era uno di questi.
function runHelpCommand() {
    const help = parseHelpCommand(terminalText());
    if (!help) return false;
    document.getElementById("console").innerHTML = "";
    logToConsole(`$ ${terminalText().trim()}`, "log-stdin");
    if (help.error) {
        logToConsole(help.error, "log-error");
        return true;
    }
    if (help.lines) {
        help.lines.forEach(line => logToConsole(line, "log-step log-pre"));
    } else {
        logToConsole(`Pagina man di ${MAN_PAGES[help.entry.id].names[0]} aperta.`, "log-step");
    }
    document.getElementById("terminal-input").value = "";
    refreshTerminal();
    if (help.entry) openManPage(help.entry.id);
    return true;
}

async function runPipeline() {
    if (isAnimating) {
        skipAnimation();
        return;
    }
    if (isBusy) return;
    if (terminalActive() && runHelpCommand()) return;
    if (terminalActive()) {
        const parsed = parsePipeline(terminalText(), levelFiles(currentLevel()));
        if (parsed.error) {
            levelSession.attempts++;
            bumpStat("runs");
            bumpStat("failures");
            playFail();
            document.getElementById("console").innerHTML = "";
            logToConsole(`$ programma ${terminalText().trim()}`, "log-stdin");
            logToConsole(parsed.error, "log-error");
            return;
        }
    }
    levelSession.attempts++;
    bumpStat("runs");
    setBusy(true);
    isAnimating = true;
    skipRequested = false;
    setRunButton("skip");
    const myRun = runId;
    const delay = SPEEDS[settings.speed].delay;

    const lvl = currentLevel();
    document.getElementById("console").innerHTML = "";
    logToConsole(terminalActive() ? `$ programma ${terminalText().trim()}` : `> Avvio esecuzione...`, "log-stdin");

    const steps = currentSteps();
    const result = executePipeline(lvl.stdin, steps);
    renderStream("Input del programma", normalizeInput(lvl.stdin), []);

    // Ogni slot si illumina mentre i dati lo attraversano e si trasformano
    for (let i = 0; i < steps.length; i++) {
        // In modalità terminale non ci sono celle da illuminare
        const cell = document.getElementById(`c${i}`) || document.createElement("div");
        const step = steps[i];
        const { lines, terminal } = result.trace[i];
        const label = step.cmd === null ? "Pipe (|)" : stepLabel(step);
        cell.classList.add("running");
        if (step.cmd !== null && !skipRequested) playStep(i);
        animateStream(`Dopo slot ${i + 1}: ${label}`, lines, terminal, delay);
        logToConsole(`[Slot ${i+1}] ${label} -> ${describeLines(lines)}`, "log-step");
        await waitStep(delay);
        cell.classList.remove("running");
        if (myRun !== runId) return;
    }

    await waitStep(delay / 2);
    if (myRun !== runId) return;
    isAnimating = false;
    wakeUp = null;
    setRunButton("disabled");
    showResult(lvl, result);
}

function showResult(lvl, result) {
    renderDiff(result.output, lvl.target, result.stderr);
    logToConsole(`> Output: [${result.output.join(", ")}]`);
    if (result.stderr.length) {
        logToConsole(`> stderr sul terminale: [${result.stderr.join(", ")}]`, "log-error");
    }

    if (isSolved(lvl, result) && lvl.daily) {
        finishDaily(lvl, usedSlots());
    } else if (isSolved(lvl, result) && lvl.marathon) {
        marathonSolved(lvl);
    } else if (isSolved(lvl, result) && lvl.training) {
        trainingSolved(lvl);
    } else if (isSolved(lvl, result) && lvl.community) {
        communitySolved(lvl);
    } else if (isSolved(lvl, result) && lvl.mystery) {
        mysterySolved(lvl);
    } else if (isSolved(lvl, result)) {
        completeLevel(lvl);
    } else {
        bumpStat("failures");
        playFail();
        tutorialEvent("fail");
        adviseAfterFailure(lvl, result);
        // Negli enigmi lo stdout atteso è nascosto: almeno il numero di righe aiuta a orientarsi
        if (lvl.hiddenTarget && result.output.length !== lvl.target.length) {
            logToConsole(`> L'indizio ha ${lvl.target.length} ${lvl.target.length === 1 ? "riga" : "righe"}, la tua uscita ${result.output.length}.`, "log-hint");
        }
        if (streamsEqual(result.output, lvl.target)) {
            logToConsole(`> [FALLIMENTO] Lo stdout è giusto, ma degli errori sono finiti sul terminale.`, "log-error");
        } else {
            logToConsole(`> [FALLIMENTO] Riprova o usa AIUTO.`, "log-error");
            logToConsole(`> Per esaminare la pipeline: ⚗️ LABORATORIO, sopra i pulsanti.`, "log-hint");
        }
        setBusy(false);
    }
}

// --- Avanti automatico: dopo una vittoria si passa da soli al livello successivo, oppure si
// resta sul livello risolto con il pulsante «PROSSIMO LIVELLO» (interruttore sotto Effetti) ---
const autoNextOn = () => settings.autoNext !== false;
let pendingNext = null;

function goToNext() {
    const next = pendingNext;
    clearTimeout(transitionTimer);
    hideNextButton();
    if (next) next();
}

// Tutor: dopo una vittoria il pulsante «🎓 TUTOR» spiega la pipeline appena usata
let lastTutor = null;

function offerTutor(lvl) {
    if (lvl.marathon) return;
    const steps = lvl.type === "quiz" ? gridSteps(lvl, lvl.start) : currentSteps();
    lastTutor = { lvl, steps };
    document.getElementById("btn-tutor").hidden = false;
}

function hideTutorButton() {
    lastTutor = null;
    document.getElementById("btn-tutor").hidden = true;
}

// Il passaggio automatico al livello successivo si ferma (es. aprendo il Tutor)
function holdAutoNext() {
    if (!pendingNext || !document.getElementById("btn-next").hidden) return;
    clearTimeout(transitionTimer);
    showNextButton();
}

function hideNextButton() {
    pendingNext = null;
    document.getElementById("btn-next").hidden = true;
}

function showNextButton() {
    document.getElementById("btn-next").hidden = false;
    logToConsole("> [SUCCESSO] Quando vuoi, passa al prossimo livello con PROSSIMO LIVELLO ▶.", "log-success");
    setBusy(false);
}

// Dopo una vittoria: next carica il livello successivo, wait è l'attesa con l'avanti automatico
function scheduleNext(next, wait) {
    pendingNext = next;
    if (!autoNextOn()) {
        showNextButton();
        return;
    }
    logToConsole(`> [SUCCESSO] Prossimo livello tra ${wait / 1000}s...`, "log-success");
    transitionTimer = setTimeout(goToNext, wait);
}

// Livello della campagna risolto: stelle, record, obiettivi e passaggio al successivo
function completeLevel(lvl) {
    tutorialEvent("win");
    offerTutor(lvl);
    const wasCompleted = actCompleted(lvl.act);
    if (terminalActive()) {
        progress.terminal[lvl.id] = true;
        unlockAchievement("terminalista");
    }
    const special = isSpecialLevel(lvl);
    const score = special ? levelSession.attempts : usedSlots();
    const stars = Math.min(hintStarCap(), special ? starsByAttempts(score) : computeStars(score, currentSolution.par));
    const isRecord = recordResult(progress, lvl.id, stars, score);
    persistProgress();
    checkWinAchievements(currentLevelIndex, currentSolution.par);
    logToConsole(`> ${special ? attemptsRating(stars, score) : rating(stars, score)}${isRecord ? " · Nuovo record!" : ""}`, "log-success");
    if (hintStarCap() < 3) logToConsole(`> Con gli aiuti usati il massimo era ${starString(hintStarCap())}.`, "log-step");
    if (lvl.explain) logToConsole(`> 💡 ${lvl.explain}`, "log-hint");
    if (!wasCompleted && actCompleted(lvl.act) && !TEST_MODE) {
        showToast(`⌨️ Modalità terminale sbloccata per l'Atto ${ROMAN[lvl.act] || lvl.act}!`);
    }
    playWin();
    celebrate(stars);
    const isLast = currentLevelIndex === levels.length - 1;
    const nextIndex = currentLevelIndex + 1;
    // Soluzione più lunga del par: il gioco si ferma sul confronto con quella ottimale
    const review = reviewSolution(lvl, currentSteps(), isLast ? {} : { next: () => loadLevel(nextIndex) });
    if (review.stop && !isLast) {
        logToConsole(`> [SUCCESSO] Quando vuoi, passa al prossimo livello.`, "log-success");
        setBusy(false);
    } else if (!isLast) {
        scheduleNext(() => loadLevel(nextIndex), review.pause ? 3500 : 2000);
    } else {
        logToConsole(`> [COMPLETATO] Hai finito la campagna! Stelle totali: ${totalStars(progress, levels)}/${levels.length * 3}`, "log-success");
        setBusy(false);
        if (!TEST_MODE) showStoryScreen("EPILOGO", "Il guru delle pipeline", EPILOGUE, "CHIUDI", null, "Giulia", "contento");
    }
}

// Confronta i comandi usati con il par calcolato dal solver
function computeStars(used, par) {
    if (used <= par) return 3;
    if (used === par + 1) return 2;
    return 1;
}

function starsByAttempts(attempts) {
    return attempts <= 1 ? 3 : attempts === 2 ? 2 : 1;
}

function attemptCount(n) {
    return `${n} ${n === 1 ? "tentativo" : "tentativi"}`;
}

function attemptsRating(stars, attempts) {
    return `${starString(stars)} ${stars === 3 ? "Al primo tentativo" : `Risolto in ${attemptCount(attempts)}`}`;
}

function commandCount(n) {
    return `${n} ${n === 1 ? "comando" : "comandi"}`;
}

function rating(stars, used) {
    const par = currentSolution.par;
    const count = commandCount(used);
    // "Ottimale" dipende dal par, non dalle stelle: gli aiuti possono limitarle anche a una soluzione ottimale
    if (used <= par) return `${starString(stars)} Soluzione ottimale (${count}, par ${par})`;
    return `${starString(stars)} ${count} (par ${par})`;
}

// Sfida del giorno vinta: salva il risultato migliore e mostra il riepilogo da condividere
function finishDaily(lvl, used) {
    offerTutor(lvl);
    const par = currentSolution.par;
    const stars = Math.min(hintStarCap(), computeStars(used, par));
    const seconds = Math.round((Date.now() - levelSession.start) / 1000);
    const key = lvl.daily.key;
    const previous = progress.daily[key];
    if (!previous || stars > previous.stars || (stars === previous.stars && used < previous.used)) {
        progress.daily[key] = { stars, used, attempts: levelSession.attempts, seconds };
    }
    persistProgress();
    playWin();
    celebrate(stars);
    const streak = dailyStreak(progress.daily, key);
    checkSessionAchievements(par);
    unlockAchievement("abitudinario");
    if (streak >= 3) unlockAchievement("serie");

    logToConsole(`> ${rating(stars, used)}`, "log-success");
    logToConsole(`> [SFIDA COMPLETATA] Torna domani per una nuova sfida.`, "log-success");
    reviewSolution(lvl, currentSteps());
    setBusy(false);

    const attempts = levelSession.attempts;
    const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    const url = location.protocol.startsWith("http") ? location.origin + location.pathname : "https://paselsoft.github.io/PipeDreams/";
    const share = [
        `Pipe Dreams · Sfida del ${formatDate(key)} (${lvl.daily.difficulty})`,
        `${starString(stars)} ${commandCount(used)}, par ${par}`,
        `🎯 ${attempts} ${attempts === 1 ? "tentativo" : "tentativi"} · ⏱ ${time}` + (streak > 1 ? ` · 🔥 ${streak} giorni di fila` : ""),
        `${url}?sfida`
    ].join("\n");
    showStoryScreen("SFIDA DEL GIORNO", "Risolta! 🎉", share, "📋 COPIA RISULTATO", async () => {
        if (await copyText(share)) showToast("📋 Risultato copiato: incollalo dove vuoi!");
    });
}

// Messaggio del personaggio sopra l'obiettivo e, la prima volta, l'introduzione dell'atto
function renderStory(lvl) {
    const message = TEST_MODE ? null : (lvl.story || STORY[lvl.id]);
    document.getElementById("story-box").hidden = !message;
    if (message) {
        document.getElementById("story-from").textContent = `📨 ${message.from}:`;
        document.getElementById("story-text").textContent = message.text;
        setAvatar(document.getElementById("story-avatar"), message.from, moodForText(message.text));
    }
    if (!TEST_MODE && !lvl.daily && ACTS[lvl.act] && !progress.seenActs.includes(lvl.act)) {
        progress.seenActs.push(lvl.act);
        persistProgress();
        showActIntro(lvl.act);
    }
}

function showActIntro(act) {
    showStoryScreen(`ATTO ${ROMAN[act] || act}`, ACTS[act].title, ACTS[act].intro, "INIZIA ( ▶ )");
}

// onButton, se presente, viene eseguito alla chiusura con il pulsante principale;
// speaker e mood mostrano l'avatar di chi parla (nessuno per le introduzioni degli atti)
function showStoryScreen(label, title, text, buttonText, onButton, speaker = null, mood = "normale") {
    setAvatar(document.getElementById("act-avatar"), speaker, mood, "big");
    document.getElementById("act-label").textContent = label;
    document.getElementById("act-title").textContent = title;
    document.getElementById("act-text").textContent = text;
    const button = document.getElementById("act-button");
    button.textContent = buttonText;
    button.onclick = () => {
        closeActIntro();
        if (onButton) onButton();
    };
    document.getElementById("act-overlay").hidden = false;
}

function closeActIntro() {
    document.getElementById("act-overlay").hidden = true;
    maybeStartTutorial();
}

function persistProgress() {
    if (!TEST_MODE) saveProgress(progress);
}

function openMenu() {
    renderMenu();
    document.getElementById("level-menu").hidden = false;
}

function closeMenu() {
    document.getElementById("level-menu").hidden = true;
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function renderDailyButton() {
    const button = document.getElementById("menu-daily");
    const key = dateKey();
    const done = progress.daily[key];
    const streak = dailyStreak(progress.daily, key);
    button.textContent = `📅 Sfida del giorno` + (done ? ` ✓ ${starString(done.stars)}` : "") + (streak > 1 ? ` · 🔥 ${streak}` : "");
}

function renderMenu() {
    renderDailyButton();
    document.getElementById("menu-marathon").textContent = `🏃 Maratona` + (progress.marathon.best ? ` · record ${progress.marathon.best}` : "");
    document.getElementById("menu-total").innerText =
        `Stelle totali: ${totalStars(progress, levels)}/${levels.length * 3}`;
    const list = document.getElementById("menu-list");
    list.innerHTML = "";
    levels.forEach((lvl, i) => {
        if (i === 0 || lvl.act !== levels[i - 1].act) {
            // Il titolo dell'atto riapre la sua introduzione
            const heading = document.createElement(ACTS[lvl.act] ? "button" : "div");
            heading.className = "menu-act";
            heading.textContent = `ATTO ${ROMAN[lvl.act] || lvl.act}` + (ACTS[lvl.act] ? ` · ${ACTS[lvl.act].title}` : "");
            if (ACTS[lvl.act]) heading.onclick = () => showActIntro(lvl.act);
            list.appendChild(heading);
        }
        const unlocked = isUnlocked(progress, levels, i);
        const item = document.createElement("button");
        item.className = "menu-level" + (!dailyLevel && i === currentLevelIndex ? " current" : "");
        item.disabled = !unlocked;

        const name = document.createElement("span");
        name.textContent = `${i + 1}. ${lvl.title}`;
        const stars = document.createElement("span");
        stars.className = "stars";
        stars.textContent = unlocked ? (progress.levels[lvl.id] ? starString(levelStars(progress, lvl.id)) : "nuovo") : "🔒";
        if (progress.terminal[lvl.id]) stars.textContent += " ⌨️";
        item.append(name, stars);

        item.onclick = () => {
            closeMenu();
            loadLevel(i);
        };
        // Sui livelli risolti, il Tutor con la soluzione di riferimento
        if (unlocked && progress.levels[lvl.id]) {
            const row = document.createElement("div");
            row.className = "menu-row";
            const lesson = document.createElement("button");
            lesson.className = "menu-tutor";
            lesson.textContent = "🎓";
            lesson.title = `Tutor: il livello ${i + 1} spiegato passo passo`;
            lesson.setAttribute("aria-label", `Tutor del livello ${i + 1}, ${lvl.title}`);
            lesson.onclick = () => {
                closeMenu();
                openTutor(lvl, tutorStepsFor(lvl));
            };
            row.append(item, lesson);
            list.appendChild(row);
        } else {
            list.appendChild(item);
        }
    });
}

function resetProgress() {
    if (!confirm("Vuoi davvero azzerare tutti i progressi, le stelle e gli obiettivi?")) return;
    progress = emptyProgress();
    persistProgress();
    closeMenu();
    loadLevel(0);
}

// Riprende dall'ultimo livello giocato, se ancora sbloccato
function startLevelIndex() {
    const last = progress.lastLevel;
    return last >= 0 && last < levels.length && isUnlocked(progress, levels, last) ? last : 0;
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMenu();
        closeManual();
        closeActIntro();
        closeAchievements();
    }
});

function logToConsole(text, className = "") {
    const consoleBox = document.getElementById("console");
    const line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

// Verifica di tutti i livelli all'avvio: il report compare nella console del browser
const levelReport = validateLevels(levels);
console.table(levelReport);
levelReport.filter(r => r.avvisi.includes("IRRISOLVIBILE")).forEach(r => console.error(`Livello ${r.livello}: ${r.avvisi}`));

if (TEST_MODE) {
    const testLevel = sharedLink && sharedLink.level ? sharedLink.level : loadTestLevel();
    document.getElementById("test-banner").hidden = false;
    document.getElementById("btn-menu").hidden = true;
    progress = emptyProgress();
    if (sharedLink && sharedLink.level) {
        document.getElementById("test-banner-text").innerText = "🔗 LIVELLO CONDIVISO: giocalo quante volte vuoi, i tuoi progressi non cambiano.";
        const link = document.getElementById("test-banner-link");
        link.href = location.pathname;
        link.textContent = "Gioca la campagna →";
    }
    if (testLevel) {
        levels.splice(0, levels.length, testLevel);
    } else {
        document.getElementById("test-banner-text").innerText = "Nessun livello di prova valido: torna all'editor e premi PROVA NEL GIOCO.";
    }
}

// Gioco installabile e offline (solo da http/https, non aprendo il file dal disco)
// Ogni pubblicazione cambia sw.js: il browser installa la nuova versione e il gioco lo segnala
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    let hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadController) document.getElementById("update-banner").hidden = false;
        hadController = true;
    });
    navigator.serviceWorker.register("sw.js").then(registration => {
        // Un'app installata può restare aperta per giorni: si controlla quando torna in primo piano
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") registration.update().catch(() => {});
        });
    }).catch(() => {});
}

// Dopo un aggiornamento, un avviso porta alle novità (non al primo avvio di un giocatore nuovo)
function noteVersion() {
    if (TEST_MODE || settings.lastVersion === APP_VERSION) return;
    const returning = settings.lastVersion || Object.keys(progress.levels).length > 0;
    settings.lastVersion = APP_VERSION;
    saveSettings(settings);
    if (returning) showToast(`🆕 Pipe Dreams v${APP_VERSION}: tocca la versione in fondo alla pagina per le novità.`);
}

document.querySelectorAll("#speed-control button").forEach(button => {
    button.onclick = () => setSpeed(button.dataset.speed);
});
document.getElementById("terminal-input").addEventListener("input", refreshTerminal);
document.getElementById("terminal-input").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        rememberCommand(terminalText());
        runPipeline();
    }
});
document.querySelectorAll("#mode-toggle button").forEach(button => {
    button.onclick = () => setInputMode(button.dataset.mode);
});
renderSpeedControl();
renderFxControl();
applyCrt();
applyColorMode();

// index.html?sfida apre direttamente la sfida del giorno (è il link del risultato condiviso)
if (!TEST_MODE && new URLSearchParams(location.search).has("sfida")) loadDaily();
else loadLevel(TEST_MODE ? 0 : startLevelIndex());
if (!TEST_MODE && new URLSearchParams(location.search).has("maratona")) startMarathon();
// index.html?allenamento=sort apre direttamente l'allenamento su un comando
// (dopo il caricamento di tutti gli script: l'elenco degli argomenti usa manual-view.js)
if (!TEST_MODE && new URLSearchParams(location.search).has("allenamento")) {
    document.addEventListener("DOMContentLoaded", () => {
        const topic = new URLSearchParams(location.search).get("allenamento");
        if (trainingTopic(topic)) startTraining(topic);
        else openTrainingMenu();
    });
}
if (sharedLink && sharedLink.error) showToast(`🔗 ${sharedLink.error}`);
noteVersion();
// Chi ha già dei progressi conosce il gioco: niente tutorial automatico
if (!TEST_MODE && !settings.tutorialDone && Object.keys(progress.levels).length) {
    settings.tutorialDone = true;
    saveSettings(settings);
}
document.addEventListener("DOMContentLoaded", maybeStartTutorial);
