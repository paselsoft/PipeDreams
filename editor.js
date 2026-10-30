// Editor dei livelli: compone un livello, lo verifica con il solver, lo fa provare nel gioco
// (index.html?test) e genera il codice da incollare in levels.js.

const DRAFT_KEY = "pipedreams.editor.draft";

// Nome mostrato nel menu a tendina dei comandi
const COMMAND_NAMES = {
    grep: "grep", sort: "sort", uniq: "uniq", upper: "sed (maiuscolo)", head: "head", tail: "tail",
    wc: "wc -l", cut: "cut", tr: "tr", sed: "sed -E (regex)", awk: "awk (campo)", paste: "paste -s",
    devnull: "2>/dev/null", merge: "2>&1"
};

// Bozza corrente. solution contiene, per ogni slot, l'indice del comando scelto (-1 = vuoto).
let draft = null;

const nextLevelId = () => Math.max(0, ...levels.map(lvl => lvl.id)) + 1;

function defaultArgs(cmd) {
    const args = {};
    for (const param of COMMANDS[cmd].params) {
        args[param.key] = param.type === "flag" ? false : param.default ?? "";
    }
    return args;
}

function blankDraft() {
    return {
        sourceId: null,
        title: "Nuovo Livello",
        act: Math.max(...levels.map(lvl => lvl.act)),
        slots: SLOT_COUNT,
        mission: "Descrivi l'obiettivo. Puoi usare <code>codice</code>.",
        hint: "",
        stdinText: "",
        commands: [{ cmd: "sort", args: defaultArgs("sort"), desc: "Riordina" }],
        solution: new Array(SLOT_COUNT).fill(-1)
    };
}

// --- Conversioni tra il testo dell'editor e il formato dei livelli ---

function parseStdin(text) {
    const lines = text.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    return lines.map(line => line.startsWith("2> ") ? { err: line.slice(3) } : line);
}

const stdinToText = stdin => stdin.map(line => typeof line === "string" ? line : `2> ${line.err}`).join("\n");

// Negli insiemi di tr l'utente scrive \n per l'a capo
const decodeSet = text => text.replace(/\\n/g, "\n");
const encodeSet = text => text.replace(/\n/g, "\\n");

// Argomenti effettivi del comando: solo le opzioni attive, e per tr una sola delle due forme
function cleanArgs(command) {
    const args = {};
    for (const param of COMMANDS[command.cmd].params) {
        const value = command.args[param.key];
        if (param.type === "flag" ? value : value !== "" && value !== undefined) args[param.key] = value;
    }
    if (command.cmd === "tr" && args.delete) return { delete: args.delete };
    if (command.cmd === "tr") delete args.delete;
    return args;
}

function commandError(command) {
    for (const param of COMMANDS[command.cmd].params) {
        const value = command.args[param.key];
        if (typeof value === "string" && value.includes("'")) return `${param.label}: l'apice ' non è supportato`;
        if (param.optional && value === "") continue;
        if (param.type === "number" && !(Number.isInteger(value) && value >= 1)) return `${param.label}: serve un intero ≥ 1`;
        if (param.type === "char" && [...value].length !== 1) return `${param.label}: serve un solo carattere`;
        if (param.type === "text" && value === "") return `${param.label}: obbligatorio`;
    }
    if (command.cmd === "tr" && !command.args.delete && (!command.args.from || !command.args.to)) {
        return "tr: compila 'da' e 'a', oppure solo '-d'";
    }
    const validate = COMMANDS[command.cmd].validate;
    const invalid = validate && validate(cleanArgs(command));
    if (invalid) return invalid;
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

        const select = document.createElement("select");
        for (const cmd of Object.keys(COMMANDS)) {
            select.add(new Option(COMMAND_NAMES[cmd] || cmd, cmd, false, cmd === command.cmd));
        }
        select.onchange = () => {
            command.cmd = select.value;
            command.args = defaultArgs(select.value);
            renderCommands();
            refresh();
        };

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
        for (const param of COMMANDS[command.cmd].params) {
            const wrapper = document.createElement("label");
            wrapper.className = "ed-param";
            const input = document.createElement("input");
            if (param.type === "flag") {
                input.type = "checkbox";
                input.checked = Boolean(command.args[param.key]);
                input.onchange = () => { command.args[param.key] = input.checked; updateRow(); refresh(); };
                wrapper.append(input, param.label);
            } else {
                input.type = param.type === "number" ? "number" : "text";
                if (param.type === "number") input.min = 1;
                input.value = param.type === "set" ? encodeSet(command.args[param.key] || "") : command.args[param.key];
                input.oninput = () => {
                    const raw = input.value;
                    command.args[param.key] = param.type === "number" ? Number(raw)
                        : param.type === "set" ? decodeSet(raw) : raw;
                    updateRow();
                    refresh();
                };
                wrapper.append(param.label, input);
            }
            row.appendChild(wrapper);
        }

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
        hint: lvl.hint,
        stdinText: stdinToText(lvl.stdin),
        commands: lvl.allowedCommands.map(step => {
            const args = { ...defaultArgs(step.cmd), ...(step.args || {}) };
            return { cmd: step.cmd, args, desc: step.desc };
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
            return saved;
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
    levels.forEach((lvl, i) => load.add(new Option(`Livello ${i + 1}: ${lvl.title}`, lvl.id)));
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
    bindText("ed-hint", "hint");
    bindText("ed-stdin", "stdinText");
    document.getElementById("ed-act").oninput = event => { draft.act = Math.max(1, Number(event.target.value) || 1); refresh(); };
    document.getElementById("ed-slots").onchange = event => { setSlots(Number(event.target.value)); event.target.value = draft.slots; };
}

setupForm();
draft = loadDraft() || blankDraft();
renderAll();
