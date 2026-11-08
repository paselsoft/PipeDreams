// Tutorial guidato: al primo avvio accompagna nel livello 1, un passo alla volta.
// Un riquadro in basso spiega cosa guardare e l'elemento giusto si illumina; i passi con
// waitFor avanzano da soli quando il giocatore fa la cosa richiesta.

let tutorial = null; // { step } durante il tutorial

const TUTORIAL_STEPS = [
    {
        target: "#txt-stdin",
        text: () => "Questo è l'input: le righe che il programma scrive nella pipe. Alcune sono file buoni, altre file corrotti (ERR)."
    },
    {
        target: "#txt-target",
        text: () => "Questo è lo stdout atteso: quello che deve uscire alla fine. Il tuo compito è trasformare l'input in questo."
    },
    {
        target: "#c0",
        waitFor: "cell",
        text: () => `Le celle sono i comandi della pipeline. Tocca la cella 1 (o premi Invio) finché compare «${stepLabel(tutorialWanted())}» (${tutorialWanted().desc}).`
    },
    {
        target: "#btn-run",
        waitFor: "win",
        text: () => "Perfetto! Ora premi ESEGUI e guarda i dati passare dalla cella fino in fondo."
    },
    {
        target: ".action-buttons",
        text: () => "Fatto: primo livello risolto! Quando sei bloccato, AIUTO dà un indizio (il primo è gratis), 📖 MANUALE spiega ogni comando con esempi e ⚗️ LABORATORIO ti lascia provare liberamente. Buon divertimento!"
    }
];

// Il primo comando della soluzione ottimale del livello 1
const tutorialWanted = () => solveLevel(levels[0]).optimalSteps[0][0];

const shouldOfferTutorial = () => !TEST_MODE && !settings.tutorialDone && Object.keys(progress.levels).length === 0 &&
    !dailyLevel && currentLevelIndex === 0;

// Chiamata all'avvio e alla chiusura dell'introduzione dell'atto
// Si decide dopo il resto del gestore: chi chiude l'introduzione per aprire Maratona o
// allenamento non deve ritrovarsi nel tutorial
function maybeStartTutorial() {
    setTimeout(() => {
        if (tutorial || !shouldOfferTutorial() || marathon || training) return;
        if (!document.getElementById("act-overlay").hidden) return; // parte dopo l'introduzione
        startTutorial();
    }, 0);
}

function startTutorial() {
    if (currentLevelIndex !== 0 || dailyLevel) loadLevel(0);
    tutorial = { step: 0 };
    document.body.classList.add("coaching");
    document.getElementById("coach").hidden = false;
    showTutorialStep();
}

function showTutorialStep() {
    const step = TUTORIAL_STEPS[tutorial.step];
    document.querySelectorAll(".coach-target").forEach(element => element.classList.remove("coach-target"));
    const target = document.querySelector(step.target);
    if (target) {
        target.classList.add("coach-target");
        target.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    const last = tutorial.step === TUTORIAL_STEPS.length - 1;
    document.getElementById("coach-count").textContent = `Tutorial ${tutorial.step + 1}/${TUTORIAL_STEPS.length}`;
    document.getElementById("coach-text").textContent = step.text();
    const next = document.getElementById("coach-next");
    next.hidden = Boolean(step.waitFor);
    next.textContent = last ? "INIZIA A GIOCARE ▶" : "AVANTI ▶";
    document.getElementById("coach-skip").hidden = last;
}

function nextTutorialStep() {
    if (!tutorial) return;
    if (tutorial.step === TUTORIAL_STEPS.length - 1) {
        endTutorial();
        return;
    }
    tutorial.step++;
    showTutorialStep();
}

// Eventi del gioco: "cell" (una cella è cambiata), "fail" (esecuzione sbagliata), "win", "level"
function tutorialEvent(type, lvl) {
    if (!tutorial) return;
    const step = TUTORIAL_STEPS[tutorial.step];
    if (type === "level" && lvl !== levels[0] && levels.indexOf(lvl) !== 1) {
        endTutorial(); // il giocatore è andato altrove: il tutorial non insiste
        return;
    }
    if (type === "cell" && step.waitFor === "cell") {
        const options = slotOptions(levels[0]);
        if (gridState[0] === options.indexOf(tutorialWanted())) nextTutorialStep();
    }
    if (type === "fail" && step.waitFor === "win") {
        document.getElementById("coach-text").textContent = "Non ancora: lo stdout non coincide. Controlla la cella e riprova.";
    }
    if (type === "win" && step.waitFor === "win") nextTutorialStep();
}

function endTutorial() {
    tutorial = null;
    document.body.classList.remove("coaching");
    document.querySelectorAll(".coach-target").forEach(element => element.classList.remove("coach-target"));
    document.getElementById("coach").hidden = true;
    settings.tutorialDone = true;
    saveSettings(settings);
}

// Dal menu: rivedere il tutorial in qualsiasi momento
function restartTutorial() {
    closeMenu();
    loadLevel(0);
    startTutorial();
}
