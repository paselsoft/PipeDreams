let currentLevelIndex = 0;
let gridState = new Array(SLOT_COUNT).fill(0);
// Blocca input ed esecuzioni durante il passaggio al livello successivo
let isTransitioning = false;
let transitionTimer = null;
// Risultato del solver per il livello corrente (par = numero minimo di comandi)
let currentSolution = null;

function loadLevel(index) {
    currentLevelIndex = index;
    gridState = new Array(SLOT_COUNT).fill(0);
    clearTimeout(transitionTimer);
    isTransitioning = false;
    document.getElementById("btn-run").disabled = false;

    const lvl = levels[index];
    currentSolution = solveLevel(lvl);
    document.getElementById("level-title").innerText = `LIVELLO ${index + 1}/${levels.length}: ${lvl.title}`;
    document.getElementById("mission-desc").innerHTML = `<strong>OBIETTIVO:</strong> ${lvl.mission}`;
    document.getElementById("txt-stdin").innerText = `[${lvl.stdin.join(", ")}]`;
    document.getElementById("txt-target").innerText = `[${lvl.target.join(", ")}]`;

    for (let i = 0; i < SLOT_COUNT; i++) {
        updateCellUI(i);
    }
    updateSlotCounter();
    document.getElementById("console").innerHTML = `> Caricato livello ${index + 1}: ${lvl.title}.`;
}

function currentSteps() {
    const options = slotOptions(levels[currentLevelIndex]);
    return gridState.map(idx => options[idx]);
}

function cycleCell(index) {
    if (isTransitioning) return;
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

function showHint() {
    const lvl = levels[currentLevelIndex];
    let consoleBox = document.getElementById("console");
    consoleBox.innerHTML = `<span class="log-hint">> [SUGGERIMENTO] ${lvl.hint}</span>`;
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

function runPipeline() {
    if (isTransitioning) return;

    let lvl = levels[currentLevelIndex];
    let consoleBox = document.getElementById("console");
    consoleBox.innerHTML = "";
    logToConsole(`> Avvio esecuzione...`, "log-stdin");

    const steps = currentSteps();
    const { output, trace } = executePipeline(lvl.stdin, steps);
    steps.forEach((step, i) => {
        const label = step.cmd === null ? "Pipe (|)" : stepLabel(step);
        logToConsole(`[Slot ${i+1}] ${label} -> [${trace[i].join(", ")}]`, "log-step");
    });

    logToConsole(`> Output: [${output.join(", ")}]`);

    if (streamsEqual(output, lvl.target)) {
        logToConsole(`> ${rating()}`, "log-success");
        if (currentLevelIndex < levels.length - 1) {
            isTransitioning = true;
            document.getElementById("btn-run").disabled = true;
            logToConsole(`> [SUCCESSO] Prossimo livello tra 2s...`, "log-success");
            transitionTimer = setTimeout(() => { loadLevel(currentLevelIndex + 1); }, 2000);
        } else {
            logToConsole(`> [COMPLETATO] Hai finito la campagna!`, "log-success");
        }
    } else {
        logToConsole(`> [FALLIMENTO] Riprova o usa AIUTO.`, "log-error");
    }
    consoleBox.scrollTop = consoleBox.scrollHeight;
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
    let consoleBox = document.getElementById("console");
    consoleBox.innerHTML += `<div class="${className}">${text}</div>`;
}

// Verifica di tutti i livelli all'avvio: il report compare nella console del browser
const levelReport = validateLevels(levels);
console.table(levelReport);
levelReport.filter(r => r.par === null).forEach(r => console.error(`Livello ${r.livello} irrisolvibile!`));

loadLevel(0);
