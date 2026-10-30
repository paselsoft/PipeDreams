const levels = [
    {
        id: 1,
        title: "Il Filtro Base",
        mission: "Usa <code>grep</code> per isolare solo i pacchetti validi eliminando i file corrotti (<code>ERR</code>).",
        stdin: ["file1", "ERR:corrotto", "file2", "ERR:corrotto"],
        target: ["file1", "file2"],
        hint: "Inserisci un blocco 'grep -v ERR' per scartare i file con errori.",
        allowedCommands: [
            { type: null, name: "[ Vuoto ]", desc: "Nessuna operazione" },
            { type: "grep_clean", name: "grep -v 'ERR'", desc: "Scarta gli errori" }
        ]
    },
    {
        id: 2,
        title: "Ordinamento e Duplicati",
        mission: "Pulisci il flusso rimuovendo i doppioni con <code>uniq</code> e ordinando con <code>sort</code>.",
        stdin: ["zebra", "mela", "mela", "cane"],
        target: ["cane", "mela", "zebra"],
        hint: "Prima ordina con 'sort' e poi rimuovi i doppioni con 'uniq'.",
        allowedCommands: [
            { type: null, name: "[ Vuoto ]", desc: "Nessuna operazione" },
            { type: "sort", name: "sort", desc: "Riordina alfabeticamente" },
            { type: "uniq", name: "uniq", desc: "Elimina duplicati adiacenti" }
        ]
    },
    {
        id: 3,
        title: "Gestione Stderr",
        mission: "Scarta i pacchetti di errore critici usando <code>2>/dev/null</code>, converti in maiuscolo e ordina.",
        stdin: ["alfa", "CRASH", "beta", "alfa"],
        target: ["ALFA", "BETA"],
        hint: "1) Cestina il CRASH, 2) Converti in maiuscolo, 3) Ordina, 4) Uniq.",
        allowedCommands: [
            { type: null, name: "[ Vuoto ]", desc: "Nessuna operazione" },
            { type: "stderr", name: "2>/dev/null", desc: "Cestina i 'CRASH'" },
            { type: "sed_upper", name: "sed 's/.*/\\U&/'", desc: "Maiuscolo" },
            { type: "sort", name: "sort", desc: "Riordina" },
            { type: "uniq", name: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 4,
        title: "Taglio Rapido",
        mission: "Ordina, rimuovi duplicati e mantieni solo i primi 2 elementi usando <code>head</code>.",
        stdin: ["gamma", "alfa", "alfa", "beta"],
        target: ["ALFA", "BETA"],
        hint: "Usa 'sort', 'uniq', 'sed' per il maiuscolo e 'head -n 2'.",
        allowedCommands: [
            { type: null, name: "[ Vuoto ]", desc: "Nessuna operazione" },
            { type: "sort", name: "sort", desc: "Riordina" },
            { type: "uniq", name: "uniq", desc: "Rimuovi duplicati" },
            { type: "sed_upper", name: "sed 's/.*/\\U&/'", desc: "Maiuscolo" },
            { type: "head", name: "head -n 2", desc: "Prendi i primi 2" }
        ]
    },
    {
        id: 5,
        title: "Depurazione Avanzata",
        mission: "Elimina i log di sistema (<code>WARN</code>), metti in maiuscolo, ordina e pulisci.",
        stdin: ["server2", "WARN:low", "server1", "server2", "WARN:low"],
        target: ["SERVER1", "SERVER2"],
        hint: "Pulisci con 'grep -v WARN', poi maiuscolo, sort e uniq.",
        allowedCommands: [
            { type: null, name: "[ Vuoto ]", desc: "Nessuna operazione" },
            { type: "grep_warn", name: "grep -v 'WARN'", desc: "Scarta i 'WARN'" },
            { type: "sed_upper", name: "sed 's/.*/\\U&/'", desc: "Maiuscolo" },
            { type: "sort", name: "sort", desc: "Riordina" },
            { type: "uniq", name: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 6,
        title: "Boss Final",
        mission: "Scarta i <code>FATAL</code>, ordina, rimuovi i doppioni e converti in maiuscolo.",
        stdin: ["nodeB", "FATAL", "nodeA", "nodeA"],
        target: ["NODEA", "NODEB"],
        hint: "Usa i 4 slot per: 1) 2>/dev/null, 2) sort, 3) uniq, 4) sed",
        allowedCommands: [
            { type: null, name: "[ Vuoto ]", desc: "Nessuna operazione" },
            { type: "fatal_null", name: "2>/dev/null", desc: "Cestina i 'FATAL'" },
            { type: "sort", name: "sort", desc: "Riordina" },
            { type: "uniq", name: "uniq", desc: "Rimuovi duplicati" },
            { type: "sed_upper", name: "sed 's/.*/\\U&/'", desc: "Maiuscolo" }
        ]
    }
];

const SLOT_COUNT = 4;

let currentLevelIndex = 0;
let gridState = new Array(SLOT_COUNT).fill(0);
// Blocca input ed esecuzioni durante il passaggio al livello successivo
let isTransitioning = false;
let transitionTimer = null;

function loadLevel(index) {
    currentLevelIndex = index;
    gridState = new Array(SLOT_COUNT).fill(0);
    clearTimeout(transitionTimer);
    isTransitioning = false;
    document.getElementById("btn-run").disabled = false;

    const lvl = levels[index];
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

function cycleCell(index) {
    if (isTransitioning) return;
    const lvl = levels[currentLevelIndex];
    const maxCmds = lvl.allowedCommands.length;
    gridState[index] = (gridState[index] + 1) % maxCmds;
    updateCellUI(index);
    updateSlotCounter();
}

function updateCellUI(index) {
    const lvl = levels[currentLevelIndex];
    const cellElem = document.getElementById(`c${index}`);
    const cmd = lvl.allowedCommands[gridState[index]];

    cellElem.querySelector('.cmd-name').innerText = cmd.name;
    cellElem.querySelector('.cmd-desc').innerText = cmd.desc;

    if (gridState[index] === 0) {
        cellElem.classList.remove("active");
    } else {
        cellElem.classList.add("active");
    }
}

function updateSlotCounter() {
    const used = gridState.filter(cmdIndex => cmdIndex !== 0).length;
    document.getElementById("score-display").innerText = `Slot: ${used}/${SLOT_COUNT}`;
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

    let currentStream = [...lvl.stdin];
    logToConsole(`> Avvio esecuzione...`, "log-stdin");

    for (let i = 0; i < gridState.length; i++) {
        let cmdIndex = gridState[i];
        let cmd = lvl.allowedCommands[cmdIndex];

        if (cmd.type === null) {
            logToConsole(`[Slot ${i+1}] Pipe (|) -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "grep_clean") {
            currentStream = currentStream.filter(item => !item.includes("ERR"));
            logToConsole(`[Slot ${i+1}] grep -v 'ERR' -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "grep_warn") {
            currentStream = currentStream.filter(item => !item.includes("WARN"));
            logToConsole(`[Slot ${i+1}] grep -v 'WARN' -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "stderr" || cmd.type === "fatal_null") {
            let targetErr = cmd.type === "stderr" ? "CRASH" : "FATAL";
            currentStream = currentStream.filter(item => item !== targetErr);
            logToConsole(`[Slot ${i+1}] 2>/dev/null -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "sort") {
            currentStream.sort();
            logToConsole(`[Slot ${i+1}] sort -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "uniq") {
            let filtered = [];
            for (let j = 0; j < currentStream.length; j++) {
                if (j === 0 || currentStream[j] !== currentStream[j-1]) {
                    filtered.push(currentStream[j]);
                }
            }
            currentStream = filtered;
            logToConsole(`[Slot ${i+1}] uniq -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "sed_upper") {
            currentStream = currentStream.map(item => item.toUpperCase());
            logToConsole(`[Slot ${i+1}] sed -> [${currentStream.join(", ")}]`, "log-step");
        } else if (cmd.type === "head") {
            currentStream = currentStream.slice(0, 2);
            logToConsole(`[Slot ${i+1}] head -n 2 -> [${currentStream.join(", ")}]`, "log-step");
        }
    }

    let isMatch = JSON.stringify(currentStream) === JSON.stringify(lvl.target);

    logToConsole(`> Output: [${currentStream.join(", ")}]`);

    if (isMatch) {
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

function logToConsole(text, className = "") {
    let consoleBox = document.getElementById("console");
    consoleBox.innerHTML += `<div class="${className}">${text}</div>`;
}

loadLevel(0);
