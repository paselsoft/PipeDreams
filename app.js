// Durata di ogni passo dell'animazione della pipeline
const STEP_DELAY = 600;

let currentLevelIndex = 0;
let gridState = new Array(SLOT_COUNT).fill(0);
// Blocca input ed esecuzioni durante l'animazione e il passaggio al livello successivo
let isBusy = false;
let transitionTimer = null;
// Incrementato a ogni caricamento: un'animazione in corso si interrompe se il livello cambia
let runId = 0;
// Risultato del solver per il livello corrente (par = numero minimo di comandi)
let currentSolution = null;

function loadLevel(index) {
    currentLevelIndex = index;
    gridState = new Array(SLOT_COUNT).fill(0);
    clearTimeout(transitionTimer);
    runId++;
    setBusy(false);

    const lvl = levels[index];
    currentSolution = solveLevel(lvl);
    document.getElementById("level-title").innerText = `LIVELLO ${index + 1}/${levels.length}: ${lvl.title}`;
    document.getElementById("mission-desc").innerHTML = `<strong>OBIETTIVO:</strong> ${lvl.mission}`;
    renderChips(document.getElementById("txt-stdin"), normalizeInput(lvl.stdin));
    renderChips(document.getElementById("txt-target"), lvl.target.map(text => ({ text, fd: 1 })));

    for (let i = 0; i < SLOT_COUNT; i++) {
        updateCellUI(i);
    }
    updateSlotCounter();
    renderStream("Input del programma", normalizeInput(lvl.stdin), []);
    document.getElementById("console").innerHTML = "";
    logToConsole(`> Caricato livello ${index + 1}: ${lvl.title}.`);
}

function setBusy(busy) {
    isBusy = busy;
    document.getElementById("btn-run").disabled = busy;
}

function currentSteps() {
    const options = slotOptions(levels[currentLevelIndex]);
    return gridState.map(idx => options[idx]);
}

function cycleCell(index) {
    if (isBusy) return;
    const maxCmds = slotOptions(levels[currentLevelIndex]).length;
    gridState[index] = (gridState[index] + 1) % maxCmds;
    updateCellUI(index);
    updateSlotCounter();
}

function updateCellUI(index) {
    const cellElem = document.getElementById(`c${index}`);
    const step = slotOptions(levels[currentLevelIndex])[gridState[index]];

    cellElem.querySelector('.cmd-name').innerText = stepLabel(step);
    cellElem.querySelector('.cmd-desc').innerText = step.desc;

    if (gridState[index] === 0) {
        cellElem.classList.remove("active");
    } else {
        cellElem.classList.add("active");
    }
}

function usedSlots() {
    return gridState.filter(cmdIndex => cmdIndex !== 0).length;
}

function updateSlotCounter() {
    const par = currentSolution && currentSolution.par !== null ? ` · Par: ${currentSolution.par}` : "";
    document.getElementById("score-display").innerText = `Slot: ${usedSlots()}/${SLOT_COUNT}${par}`;
}

// Disegna una lista di righe come chip; `states` opzionale assegna classi extra (ok/bad/missing)
function renderChips(container, lines, states = []) {
    container.innerHTML = "";
    if (lines.length === 0) {
        const chip = document.createElement("span");
        chip.className = "chip empty";
        chip.textContent = "(vuoto)";
        container.appendChild(chip);
        return;
    }
    lines.forEach((line, i) => {
        const chip = document.createElement("span");
        chip.className = ["chip", line.fd === 2 ? "err" : "", states[i] || ""].join(" ").trim();
        chip.textContent = line.text;
        container.appendChild(chip);
    });
}

function renderStream(title, lines, terminal) {
    document.getElementById("stream-title").innerText = title;
    renderChips(document.getElementById("stream-lines"), lines);
    document.getElementById("stream-terminal").innerText =
        terminal.length ? `⚠ Finito sul terminale (stderr): ${terminal.join(", ")}` : "";
}

// Confronto finale riga per riga con il target
function renderDiff(output, target, terminal) {
    document.getElementById("stream-title").innerText = "Output finale (verde = corretto, rosso = sbagliato, tratteggio = mancante)";
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

function showHint() {
    const lvl = levels[currentLevelIndex];
    let consoleBox = document.getElementById("console");
    consoleBox.innerHTML = "";
    logToConsole(`> [SUGGERIMENTO] ${lvl.hint}`, "log-hint");
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function describeLines(lines) {
    const out = lines.filter(line => line.fd === 1).map(line => line.text);
    const err = lines.filter(line => line.fd === 2).map(line => line.text);
    return `[${out.join(", ")}]` + (err.length ? ` · stderr: [${err.join(", ")}]` : "");
}

async function runPipeline() {
    if (isBusy) return;
    setBusy(true);
    const myRun = runId;

    const lvl = levels[currentLevelIndex];
    document.getElementById("console").innerHTML = "";
    logToConsole(`> Avvio esecuzione...`, "log-stdin");

    const steps = currentSteps();
    const result = executePipeline(lvl.stdin, steps);
    renderStream("Input del programma", normalizeInput(lvl.stdin), []);

    for (let i = 0; i < steps.length; i++) {
        const cell = document.getElementById(`c${i}`);
        cell.classList.add("running");
        await sleep(STEP_DELAY);
        cell.classList.remove("running");
        if (myRun !== runId) return;

        const step = steps[i];
        const { lines, terminal } = result.trace[i];
        const label = step.cmd === null ? "Pipe (|)" : stepLabel(step);
        renderStream(`Dopo slot ${i + 1}: ${label}`, lines, terminal);
        logToConsole(`[Slot ${i+1}] ${label} -> ${describeLines(lines)}`, "log-step");
    }

    await sleep(STEP_DELAY / 2);
    if (myRun !== runId) return;
    showResult(lvl, result);
}

function showResult(lvl, result) {
    renderDiff(result.output, lvl.target, result.stderr);
    logToConsole(`> Output: [${result.output.join(", ")}]`);
    if (result.stderr.length) {
        logToConsole(`> stderr sul terminale: [${result.stderr.join(", ")}]`, "log-error");
    }

    if (isSolved(lvl, result)) {
        logToConsole(`> ${rating()}`, "log-success");
        if (currentLevelIndex < levels.length - 1) {
            logToConsole(`> [SUCCESSO] Prossimo livello tra 2s...`, "log-success");
            transitionTimer = setTimeout(() => { loadLevel(currentLevelIndex + 1); }, 2000);
        } else {
            logToConsole(`> [COMPLETATO] Hai finito la campagna!`, "log-success");
            setBusy(false);
        }
    } else {
        if (streamsEqual(result.output, lvl.target)) {
            logToConsole(`> [FALLIMENTO] Lo stdout è giusto, ma degli errori sono finiti sul terminale.`, "log-error");
        } else {
            logToConsole(`> [FALLIMENTO] Riprova o usa AIUTO.`, "log-error");
        }
        setBusy(false);
    }
}

// Confronta i comandi usati con il par calcolato dal solver
function rating() {
    const used = usedSlots();
    const par = currentSolution.par;
    const count = `${used} ${used === 1 ? "comando" : "comandi"}`;
    if (used <= par) return `★★★ Soluzione ottimale (${count}, par ${par})`;
    if (used === par + 1) return `★★☆ ${count} (par ${par})`;
    return `★☆☆ ${count} (par ${par})`;
}

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
levelReport.filter(r => r.par === null).forEach(r => console.error(`Livello ${r.livello} irrisolvibile!`));

loadLevel(0);
