// Editor dei livelli: compone un livello, lo verifica con il solver, lo fa provare nel gioco
// (index.html?test) e genera il codice da incollare in levels.js.

const DRAFT_KEY = "pipedreams.editor.draft";

// Bozza corrente. solution contiene, per ogni slot, l'indice del comando scelto (-1 = vuoto).
let draft = null;

const nextLevelId = () => Math.max(0, ...levels.map(lvl => lvl.id)) + 1;

function blankDraft() {
    return {
        sourceId: null,
        title: "Nuovo Livello",
        act: Math.max(...levels.map(lvl => lvl.act)),
        slots: SLOT_COUNT,
        mission: "Descrivi l'obiettivo. Puoi usare <code>codice</code>.",
        nudge: "",
        hint: "",
        stdinText: "",
        commands: [{ cmd: "sort", args: defaultArgs("sort"), desc: "Riordina" }],
        solution: new Array(SLOT_COUNT).fill(-1)
    };
}

function commandError(command) {
    const error = argsError(command);
    if (error) return error;
    if (!command.desc.trim()) return "manca la descrizione";
    return null;
}

// Come nei livelli scritti a mano, args compare solo se il comando ha argomenti
function toStep(command) {
    const args = cleanArgs(command);
    const desc = command.desc.trim();
    return Object.keys(args).length ? { cmd: command.cmd, args, desc } : { cmd: command.cmd, desc };
}

// Costruisce il livello dalla bozza; errors elenca ciò che impedisce di usarlo
function buildLevel() {
    const errors = [];
    draft.commands.forEach((command, i) => {
        const error = commandError(command);
        if (error) errors.push(`Comando ${i + 1}: ${error}`);
    });
    const stdin = parseStdin(draft.stdinText);
    if (stdin.length === 0) errors.push("L'input del programma è vuoto.");
    if (!draft.title.trim()) errors.push("Manca il titolo.");

    const allowedCommands = draft.commands.map(toStep);
    const solutionSteps = draft.solution.map(i => i === -1 ? EMPTY_STEP : allowedCommands[i]);
    const usedCount = draft.solution.filter(i => i !== -1).length;
    if (usedCount === 0) errors.push("Componi la soluzione prevista.");

    const result = executePipeline(stdin, solutionSteps);
    if (result.stderr.length) {
        errors.push(`La soluzione prevista lascia errori sul terminale: ${result.stderr.join(", ")}`);
    }

    const level = {
        id: draft.sourceId ?? nextLevelId(),
        act: draft.act,
        title: draft.title.trim(),
        mission: draft.mission.trim(),
        stdin,
        target: result.output,
        nudge: draft.nudge.trim(),
        hint: draft.hint.trim(),
        allowedCommands
    };
    if (draft.slots !== SLOT_COUNT) level.slots = draft.slots;
    return { level, errors, solutionSteps, usedCount };
}

// --- Codice per levels.js, nello stesso stile dei livelli esistenti ---

function levelToCode(level) {
    const q = JSON.stringify;
    const formatArgs = args => `{ ${Object.entries(args).map(([key, value]) => `${key}: ${q(value)}`).join(", ")} }`;
    const formatStep = step => `{ cmd: ${q(step.cmd)}${step.args ? `, args: ${formatArgs(step.args)}` : ""}, desc: ${q(step.desc)} }`;
    const formatLine = line => typeof line === "string" ? q(line) : `{ err: ${q(line.err)} }`;
    return [
        "    {",
        `        id: ${level.id},`,
        `        act: ${level.act},`,
        `        title: ${q(level.title)},`,
        ...(level.slots ? [`        slots: ${level.slots},`] : []),
        `        mission: ${q(level.mission)},`,
        `        stdin: [${level.stdin.map(formatLine).join(", ")}],`,
        `        target: [${level.target.map(q).join(", ")}],`,
        `        nudge: ${q(level.nudge)},`,
        `        hint: ${q(level.hint)},`,
        "        allowedCommands: [",
        level.allowedCommands.map(step => `            ${formatStep(step)}`).join(",\n"),
        "        ]",
        "    }"
    ].join("\n");
}

// --- Rendering ---

function renderAll() {
    document.getElementById("ed-title").value = draft.title;
    document.getElementById("ed-act").value = draft.act;
    document.getElementById("ed-slots").value = draft.slots;
    document.getElementById("ed-mission").value = draft.mission;
    document.getElementById("ed-nudge").value = draft.nudge;
    document.getElementById("ed-hint").value = draft.hint;
    document.getElementById("ed-stdin").value = draft.stdinText;
    document.getElementById("ed-load").value = draft.sourceId ?? "";
    renderCommands();
    refresh();
}

function renderCommands() {
    const container = document.getElementById("ed-commands");
    container.innerHTML = "";
    draft.commands.forEach((command, index) => {
        const row = document.createElement("div");
        row.className = "ed-cmd";

        const select = commandSelect(command, () => {
            renderCommands();
            refresh();
        });

        const label = document.createElement("span");
        label.className = "ed-label";
        const error = document.createElement("span");
        error.className = "ed-error";
        // Aggiorna etichetta ed errore della riga senza ricostruirla (mantiene il focus)
        const updateRow = () => {
            const message = commandError(command);
            error.textContent = message || "";
            row.classList.toggle("invalid", Boolean(message));
            label.textContent = message ? "…" : stepLabel(toStep(command));
        };

        row.append(label, select);
        paramFields(command, () => {
            updateRow();
            refresh();
        }).forEach(field => row.appendChild(field));

        const desc = document.createElement("input");
        desc.type = "text";
        desc.className = "ed-desc";
        desc.placeholder = "descrizione mostrata nella cella";
        desc.value = command.desc;
        desc.oninput = () => { command.desc = desc.value; updateRow(); refresh(); };

        const remove = document.createElement("button");
        remove.className = "ed-remove";
        remove.textContent = "✕";
        remove.title = "Rimuovi comando";
        remove.onclick = () => removeCommand(index);

        row.append(desc, remove, error);
        updateRow();
        container.appendChild(row);
    });
}

function renderSolution(allowedCommands) {
    const container = document.getElementById("ed-solution");
    container.innerHTML = "";
    draft.solution.forEach((choice, slot) => {
        const select = document.createElement("select");
        select.setAttribute("aria-label", `Cella ${slot + 1} della soluzione`);
        select.add(new Option(`${slot + 1}: [ Vuoto ]`, -1));
        allowedCommands.forEach((step, i) => {
            const valid = !commandError(draft.commands[i]);
            const option = new Option(`${slot + 1}: ${valid ? stepLabel(step) : "(comando non valido)"}`, i);
            option.disabled = !valid;
            select.add(option);
        });
        select.value = choice;
        select.onchange = () => {
            draft.solution[slot] = Number(select.value);
            refresh();
        };
        container.appendChild(select);
    });
}

function message(kind, text, items = []) {
    const box = document.createElement("div");
    box.className = `ed-msg ${kind}`;
    box.textContent = text;
    if (items.length) {
        const list = document.createElement("ul");
        for (const item of items) {
            const li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
        }
        box.appendChild(list);
    }
    return box;
}

function renderAnalysis(level, errors, usedCount) {
    const container = document.getElementById("ed-analysis");
    container.innerHTML = "";
    if (errors.length) {
        container.appendChild(message("error", "Da correggere prima di provare il livello:", errors));
        return false;
    }

    const result = solveLevel(level);
    const intended = `${usedCount} ${usedCount === 1 ? "comando" : "comandi"}`;
    if (result.par === 0) {
        container.appendChild(message("error", "L'input coincide già con l'output atteso: il livello si risolve senza comandi."));
        return false;
    }
    if (result.par < usedCount) {
        container.appendChild(message("warn",
            `Scorciatoia: la tua soluzione usa ${intended}, ma ne bastano ${result.par}. Il par sarà ${result.par}.`,
            result.optimal));
    } else if (result.optimalCount > 1) {
        container.appendChild(message("warn",
            `${result.optimalCount} soluzioni ottimali da ${result.par} comandi (ne mostro fino a ${MAX_EXAMPLES}):`,
            result.optimal));
    } else {
        container.appendChild(message("ok", `Soluzione unica con ${intended}: par ${result.par}. ✓`));
    }

    const labels = level.allowedCommands.map(stepLabel);
    const duplicates = labels.filter((label, i) => labels.indexOf(label) !== i);
    if (duplicates.length) {
        container.appendChild(message("warn", `Comandi duplicati nella lista: ${[...new Set(duplicates)].join(", ")}`));
    }
    return true;
}

// Aggiorna tutto ciò che dipende dalla bozza (tranne la lista comandi, per non perdere il focus)
function refresh() {
    document.getElementById("ed-mission-preview").innerHTML = `<strong>OBIETTIVO:</strong> ${draft.mission}`;
    renderChips(document.getElementById("ed-stdin-preview"), normalizeInput(parseStdin(draft.stdinText)));
    document.getElementById("ed-id").textContent =
        draft.sourceId ? `modifica del livello id ${draft.sourceId}` : `nuovo livello, id ${nextLevelId()}`;

    const { level, errors, solutionSteps, usedCount } = buildLevel();
    renderSolution(level.allowedCommands);
    renderChips(document.getElementById("ed-target"), level.target.map(text => ({ text, fd: 1 })));
    document.getElementById("ed-shell").textContent = buildShellLine(level.stdin, solutionSteps, " |\n  ");

    const playable = renderAnalysis(level, errors, usedCount);
    document.getElementById("ed-play").disabled = !playable;
    document.getElementById("ed-code").textContent = playable ? levelToCode(level) : "// Correggi gli errori indicati nell'analisi.";
    document.getElementById("ed-share").disabled = !playable;
    document.getElementById("ed-share-url").textContent = playable ? currentShareUrl(level) : "Correggi gli errori indicati nell'analisi.";
    saveDraft();
}

// --- Azioni ---

function addCommand() {
    draft.commands.push({ cmd: "grep", args: defaultArgs("grep"), desc: "" });
    renderCommands();
    refresh();
}

function removeCommand(index) {
    draft.commands.splice(index, 1);
    // Gli slot che usavano il comando tornano vuoti, gli altri indici scalano
    draft.solution = draft.solution.map(i => i === index ? -1 : i > index ? i - 1 : i);
    renderCommands();
    refresh();
}

function setSlots(count) {
    const slots = Math.min(8, Math.max(1, Math.round(count) || 1));
    draft.slots = slots;
    draft.solution = Array.from({ length: slots }, (_, i) => draft.solution[i] ?? -1);
    refresh();
}

// Carica un livello esistente; la soluzione prevista è la prima ottimale trovata dal solver
function loadFromLevel(id) {
    const lvl = levels.find(level => level.id === id);
    if (!lvl) return;
    const slots = levelSlots(lvl);
    const labels = lvl.allowedCommands.map(stepLabel);
    const best = solveLevel(lvl).optimal[0];
    const solution = best ? best.split(" | ").map(label => labels.indexOf(label)) : [];
    draft = {
        sourceId: lvl.id,
        title: lvl.title,
        act: lvl.act,
        slots,
        mission: lvl.mission,
        nudge: lvl.nudge || "",
        hint: lvl.hint,
        stdinText: stdinToText(lvl.stdin),
        commands: lvl.allowedCommands.map(step => {
            return { cmd: step.cmd, args: argsFromStep(step), desc: step.desc };
        }),
        solution: Array.from({ length: slots }, (_, i) => solution[i] ?? -1)
    };
    renderAll();
}

function newLevel() {
    if (!confirm("Iniziare un nuovo livello? La bozza attuale verrà sostituita.")) return;
    draft = blankDraft();
    renderAll();
}

function playTest() {
    const { level, errors } = buildLevel();
    if (errors.length) return;
    if (!saveTestLevel(level)) {
        alert("Impossibile salvare il livello di prova: localStorage non è disponibile.");
        return;
    }
    location.href = "index.html?test";
}

// Il link punta al gioco nella stessa cartella dell'editor
const currentShareUrl = level => shareUrl(level, new URL("index.html", location.href).href);

async function copyShareLink() {
    const { level, errors } = buildLevel();
    if (errors.length) return;
    const button = document.getElementById("ed-share");
    try {
        await navigator.clipboard.writeText(currentShareUrl(level));
        button.textContent = "COPIATO ✓";
    } catch (e) {
        button.textContent = "SELEZIONA E COPIA";
    }
    setTimeout(() => { button.textContent = "COPIA LINK"; }, 1500);
}

async function copyCode() {
    const text = document.getElementById("ed-code").textContent;
    const button = document.getElementById("ed-copy");
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = "COPIATO ✓";
    } catch (e) {
        button.textContent = "SELEZIONA E COPIA";
    }
    setTimeout(() => { button.textContent = "COPIA"; }, 1500);
}

function saveDraft() {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
        // senza storage la bozza resta solo in memoria
    }
}

function loadDraft() {
    try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
        if (saved && Array.isArray(saved.commands) && saved.commands.every(c => COMMANDS[c.cmd]) && Array.isArray(saved.solution)) {
            return { nudge: "", ...saved };
        }
    } catch (e) {
        // bozza corrotta: si riparte da una vuota
    }
    return null;
}

// --- Avvio ---

function setupForm() {
    const load = document.getElementById("ed-load");
    load.add(new Option("— bozza corrente / nuovo livello —", ""));
    // L'editor compone solo livelli normali: quiz, debug e celle bloccate si scrivono in levels.js
    levels.forEach((lvl, i) => {
        if (!lvl.type && !lvl.locked) load.add(new Option(`Livello ${i + 1}: ${lvl.title}`, lvl.id));
    });
    load.onchange = () => {
        if (load.value === "") return;
        if (confirm("Caricare questo livello? La bozza attuale verrà sostituita.")) {
            loadFromLevel(Number(load.value));
        } else {
            load.value = draft.sourceId ?? "";
        }
    };

    const bindText = (id, key) => {
        document.getElementById(id).oninput = event => { draft[key] = event.target.value; refresh(); };
    };
    bindText("ed-title", "title");
    bindText("ed-mission", "mission");
    bindText("ed-nudge", "nudge");
    bindText("ed-hint", "hint");
    bindText("ed-stdin", "stdinText");
    document.getElementById("ed-act").oninput = event => { draft.act = Math.max(1, Number(event.target.value) || 1); refresh(); };
    document.getElementById("ed-slots").onchange = event => { setSlots(Number(event.target.value)); event.target.value = draft.slots; };
}

setupForm();
draft = loadDraft() || blankDraft();
renderAll();
