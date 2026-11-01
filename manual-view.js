// Pannello del manuale: elenco dei comandi (prima quelli del livello corrente) e schede con
// esempi calcolati dal motore del gioco. Tutto il testo è inserito con textContent.

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// Schede che spiegano almeno un comando disponibile nel livello
function manualEntriesForLevel(lvl) {
    const available = new Set(lvl.allowedCommands.map(step => step.cmd));
    return MANUAL.filter(entry => entry.cmds.some(cmd => available.has(cmd)));
}

function manualEntryButton(entry) {
    const button = el("button", "manual-link");
    button.append(el("code", "", entry.name), el("span", "", entry.summary));
    button.onclick = () => openManual(entry.id);
    return button;
}

function openManual(entryId) {
    const entry = MANUAL.find(item => item.id === entryId);
    if (entry) renderManualEntry(entry);
    else renderManualList();
    document.getElementById("manual-overlay").hidden = false;
}

// Scheda a cui riporta "← Indietro" (null = elenco)
let manualBackTarget = null;

function manualBack() {
    if (manualBackTarget === LAB_BACK_TO_LEVEL) closeManual();
    else openManual(manualBackTarget);
}

function closeManual() {
    document.getElementById("manual-overlay").hidden = true;
}

function setManualContent(title, nodes, showBack, backTarget = null) {
    manualBackTarget = backTarget;
    document.getElementById("manual-title").textContent = title;
    document.getElementById("manual-back").hidden = !showBack;
    const body = document.getElementById("manual-body");
    body.innerHTML = "";
    body.append(...nodes);
    document.querySelector(".manual-panel").scrollTop = 0;
}

function renderManualList() {
    const lvl = currentLevel();
    const forLevel = manualEntriesForLevel(lvl);
    const nodes = [];
    const labLink = el("button", "manual-link lab-link");
    labLink.append(el("code", "", "🧪 Laboratorio"), el("span", "", "Prova i comandi su dati tuoi e guarda il risultato passo per passo."));
    labLink.onclick = () => openLab();
    nodes.push(labLink);
    if (forLevel.length) {
        nodes.push(el("h3", "manual-section", "Comandi di questo livello"));
        forLevel.forEach(entry => nodes.push(manualEntryButton(entry)));
    }
    nodes.push(el("h3", "manual-section", forLevel.length ? "Tutti gli altri" : "Tutti i comandi"));
    MANUAL.filter(entry => !forLevel.includes(entry)).forEach(entry => nodes.push(manualEntryButton(entry)));
    setManualContent("📖 MANUALE", nodes, false);
}

function renderExample(example, entry) {
    const box = el("div", "manual-example");
    box.appendChild(el("div", "manual-example-title", example.title));

    const result = executePipeline(example.input, example.steps);
    box.appendChild(el("code", "manual-shell", buildShellLine(example.input, example.steps, " |\n  ")));

    const rows = [
        ["input", normalizeInput(example.input)],
        ["output", result.output.map(text => ({ text, fd: 1 }))]
    ];
    for (const [label, lines] of rows) {
        const row = el("div", "manual-row");
        const chips = el("span", "chips");
        renderChips(chips, lines);
        row.append(el("span", "manual-row-label", label), chips);
        box.appendChild(row);
    }
    if (result.stderr.length) {
        box.appendChild(el("div", "stream-terminal", `⚠ Finito sul terminale (stderr): ${result.stderr.join(", ")}`));
    }
    if (example.note) box.appendChild(el("p", "manual-note", example.note));
    const tryIt = el("button", "manual-try", "🧪 Prova nel laboratorio");
    tryIt.onclick = () => openLab(example, entry.id);
    box.appendChild(tryIt);
    return box;
}

function renderManualEntry(entry) {
    noteManualRead(entry.id);
    const nodes = [];
    nodes.push(el("code", "manual-syntax", entry.syntax));
    nodes.push(el("p", "manual-description", entry.description));

    if (entry.options && entry.options.length) {
        nodes.push(el("h3", "manual-section", "Opzioni"));
        const list = el("ul", "manual-options");
        for (const option of entry.options) {
            const item = el("li");
            item.append(el("code", "", option.flag), document.createTextNode(` ${option.text}`));
            list.appendChild(item);
        }
        nodes.push(list);
    }

    nodes.push(el("h3", "manual-section", "Esempi"));
    entry.examples.forEach(example => nodes.push(renderExample(example, entry)));

    if (entry.traps && entry.traps.length) {
        nodes.push(el("h3", "manual-section", "Trappole comuni"));
        const list = el("ul", "manual-traps");
        entry.traps.forEach(trap => list.appendChild(el("li", "", trap)));
        nodes.push(list);
    }
    setManualContent(entry.name, nodes, true);
}

// Indice in fondo alla pagina: ogni voce apre la scheda corrispondente
function renderManualIndex() {
    const index = document.getElementById("manual-index");
    index.innerHTML = "";
    MANUAL.forEach(entry => index.appendChild(manualEntryButton(entry)));
}

renderManualIndex();
