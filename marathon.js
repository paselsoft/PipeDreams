// Maratona: livelli generati uno dopo l'altro contro il tempo. Ogni livello risolto aggiunge
// secondi, cambiare livello ne toglie; la difficoltà sale con i livelli risolti.

const MARATHON_START_MS = 180000;
const MARATHON_BONUS_MS = { facile: 20000, media: 30000, difficile: 45000 };
const MARATHON_SKIP_MS = 20000;

// Partita in corso: { seed, round, solved, deadline, timer, over }
let marathon = null;

// I primi 3 livelli risolti sono facili, poi 3 medi, poi difficili
const marathonDifficulty = solved => solved < 3 ? "facile" : solved < 6 ? "media" : "difficile";

const formatClock = ms => {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

function startMarathon() {
    stopMarathon();
    closeMenu();
    closeActIntro();
    marathon = { seed: Date.now().toString(36), round: 0, solved: 0, deadline: Date.now() + MARATHON_START_MS, over: false };
    progress.marathon.played = (progress.marathon.played || 0) + 1;
    persistProgress();
    document.getElementById("marathon-bar").hidden = false;
    marathon.timer = setInterval(tickMarathon, 250);
    nextMarathonLevel();
    tickMarathon();
}

function nextMarathonLevel() {
    if (!marathon || marathon.over) return;
    const difficulty = marathonDifficulty(marathon.solved);
    const lvl = generateMarathonLevel(marathon.seed, marathon.round, difficulty);
    marathon.round++;
    dailyLevel = lvl;
    showLevel(lvl, `🏃 MARATONA · LIVELLO ${marathon.solved + 1} (${difficulty}): ${lvl.title}`);
    logToConsole(`> Maratona: livello ${marathon.solved + 1}, ${difficulty}. Ogni livello risolto vale +${MARATHON_BONUS_MS[difficulty] / 1000} s.`);
}

function tickMarathon() {
    if (!marathon || marathon.over) return;
    const remaining = marathon.deadline - Date.now();
    document.getElementById("marathon-status").textContent =
        `🏃 Risolti: ${marathon.solved} · ⏱ ${formatClock(remaining)} · Record: ${progress.marathon.best || 0}`;
    document.getElementById("marathon-bar").classList.toggle("hurry", remaining < 20000);
    if (remaining <= 0) endMarathon();
}

// Chiamata da showResult quando un livello della maratona è risolto
function marathonSolved(lvl) {
    const bonus = MARATHON_BONUS_MS[lvl.marathon.difficulty];
    marathon.solved++;
    marathon.deadline += bonus;
    playWin();
    logToConsole(`> [RISOLTO] +${bonus / 1000} s · Prossimo livello...`, "log-success");
    showToast(`⏱ +${bonus / 1000} s`);
    tickMarathon();
    transitionTimer = setTimeout(nextMarathonLevel, 700);
}

function skipMarathonLevel() {
    if (!marathon || marathon.over) return;
    marathon.deadline -= MARATHON_SKIP_MS;
    showToast(`⏭ Livello cambiato: −${MARATHON_SKIP_MS / 1000} s`);
    nextMarathonLevel();
    tickMarathon();
}

function endMarathon() {
    marathon.over = true;
    clearInterval(marathon.timer);
    clearTimeout(transitionTimer);
    runId++;
    stopAnimation();
    setBusy(true);
    const solved = marathon.solved;
    const record = solved > (progress.marathon.best || 0);
    if (record) progress.marathon.best = solved;
    persistProgress();
    if (solved >= 5) unlockAchievement("maratoneta");
    document.getElementById("marathon-status").textContent = `🏃 Tempo scaduto · Risolti: ${solved} · Record: ${progress.marathon.best}`;
    showStoryScreen("MARATONA FINITA", `${solved} ${solved === 1 ? "livello risolto" : "livelli risolti"}`,
        `Tempo scaduto!${record && solved > 0 ? " Nuovo record personale!" : ""} Record: ${progress.marathon.best}. ` +
        "Ogni livello risolto aggiunge secondi: i difficili valgono di più.", "🏃 RIPROVA", startMarathon);
}

// Uscita dalla maratona (anche quando si carica un livello della campagna o la sfida)
function stopMarathon() {
    if (!marathon) return;
    clearInterval(marathon.timer);
    marathon = null;
    document.getElementById("marathon-bar").hidden = true;
}

function exitMarathon() {
    stopMarathon();
    loadLevel(startLevelIndex());
}
