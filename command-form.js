// Moduli condivisi da editor dei livelli e laboratorio: input con prefisso "2> " per lo stderr,
// argomenti dei comandi e campi del modulo generati dai params del registro.

// Nome mostrato nel menu a tendina dei comandi
const COMMAND_NAMES = {
    grep: "grep", sort: "sort", uniq: "uniq", upper: "sed (maiuscolo)", head: "head", tail: "tail",
    comm: "comm (confronta con un file)", join: "join (unisci con un file)", nl: "nl (numera)", tee: "tee",
    squeeze: "tr -s (comprimi)", fold: "fold (a capo)", xargs: "xargs",
    wc: "wc -l", wcw: "wc -w (parole)", wcc: "wc -c (byte)",
    md5sum: "md5sum (impronta)", sha256sum: "sha256sum (impronta)", od: "od -c (caratteri)",
    zcat: "zcat (file .gz)", bzcat: "bzcat (file .bz2)", xzcat: "xzcat (file .xz)", cut: "cut -d -f (campo)", cutc: "cut -c (caratteri)", tac: "tac", rev: "rev", tr: "tr", sed: "sed -E (regex)", awk: "awk (campo)", paste: "paste -s",
    devnull: "2>/dev/null", merge: "2>&1"
};

function defaultArgs(cmd) {
    const args = {};
    for (const param of COMMANDS[cmd].params) {
        args[param.key] = param.type === "flag" ? false : param.type === "lines" ? [] : param.default ?? "";
    }
    return args;
}

// Argomenti completi di uno step dei livelli o del manuale, per modificarlo in un modulo
const argsFromStep = step => ({ ...defaultArgs(step.cmd), ...(step.args || {}) });

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
        if (param.type === "flag" ? value : value !== "" && value !== undefined && !(param.type === "lines" && !value.length)) args[param.key] = value;
    }
    if (command.cmd === "tr" && args.delete) return { delete: args.delete };
    if (command.cmd === "tr") delete args.delete;
    return args;
}

// Errore negli argomenti di un comando { cmd, args }, o null se è eseguibile
function argsError(command) {
    for (const param of COMMANDS[command.cmd].params) {
        const value = command.args[param.key];
        if (typeof value === "string" && value.includes("'")) return `${param.label}: l'apice ' non è supportato`;
        if (param.optional && value === "") continue;
        if (param.type === "number" && !(Number.isInteger(value) && value >= 1)) return `${param.label}: serve un intero ≥ 1`;
        if (param.type === "char" && [...value].length !== 1) return `${param.label}: serve un solo carattere`;
        if (param.type === "text" && value === "") return `${param.label}: obbligatorio`;
        if (param.type === "choice" && !param.options.includes(value)) return `${param.label}: scegli tra ${param.options.join(", ")}`;
        if (param.type === "file" && !/^[A-Za-z0-9_][A-Za-z0-9._-]{0,39}$/.test(value || "")) return `${param.label}: un nome semplice, es. elenco.txt`;
        if (param.type === "lines" && !(Array.isArray(value) && value.length >= 1 && value.length <= 60 && value.every(line => typeof line === "string" && line.length <= 120 && !line.includes("'")))) {
            return `${param.label}: da 1 a 60 righe, senza apici '`;
        }
    }
    if (command.cmd === "tr" && !command.args.delete && (!command.args.from || !command.args.to)) {
        return "tr: compila 'da' e 'a', oppure solo '-d'";
    }
    const validate = COMMANDS[command.cmd].validate;
    const invalid = validate && validate(cleanArgs(command));
    if (invalid) return invalid;
    return null;
}

// Menu a tendina del tipo di comando: cambiandolo, gli argomenti tornano ai valori predefiniti
function commandSelect(command, onTypeChange) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Comando");
    for (const cmd of Object.keys(COMMANDS)) {
        select.add(new Option(COMMAND_NAMES[cmd] || cmd, cmd, false, cmd === command.cmd));
    }
    select.onchange = () => {
        command.cmd = select.value;
        command.args = defaultArgs(select.value);
        onTypeChange();
    };
    return select;
}

// Un campo per ogni parametro del comando; onInput viene chiamato a ogni modifica
function paramFields(command, onInput) {
    return COMMANDS[command.cmd].params.map(param => {
        const wrapper = document.createElement("label");
        wrapper.className = "ed-param";
        if (param.type === "choice") {
            const select = document.createElement("select");
            for (const option of param.options) select.add(new Option(`-${option}`, option, false, option === command.args[param.key]));
            select.onchange = () => { command.args[param.key] = select.value; onInput(); };
            wrapper.append(param.label, select);
            return wrapper;
        }
        if (param.type === "lines") {
            // Il contenuto del file: una riga per riga
            const area = document.createElement("textarea");
            area.rows = 3;
            area.spellcheck = false;
            area.value = (command.args[param.key] || []).join("\n");
            area.oninput = () => {
                const lines = area.value.split("\n");
                if (lines[lines.length - 1] === "") lines.pop();
                command.args[param.key] = lines;
                onInput();
            };
            wrapper.classList.add("ed-param-lines");
            wrapper.append(param.label, area);
            return wrapper;
        }
        const input = document.createElement("input");
        if (param.type === "flag") {
            input.type = "checkbox";
            input.checked = Boolean(command.args[param.key]);
            input.onchange = () => { command.args[param.key] = input.checked; onInput(); };
            wrapper.append(input, param.label);
        } else {
            input.type = param.type === "number" ? "number" : "text";
            if (param.type === "number") input.min = 1;
            input.value = param.type === "set" ? encodeSet(command.args[param.key] || "") : command.args[param.key];
            input.oninput = () => {
                const raw = input.value;
                command.args[param.key] = param.type === "number" ? Number(raw)
                    : param.type === "set" ? decodeSet(raw) : raw;
                onInput();
            };
            wrapper.append(param.label, input);
        }
        return wrapper;
    });
}
