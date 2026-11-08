// Tasti della modalità terminale, come in bash: ↑ e ↓ richiamano le righe già eseguite,
// Tab completa il nome del comando (o del file, o della pagina di man).

const HISTORY_KEY = "pipedreams.history.v1";
const HISTORY_LIMIT = 50;

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
        return Array.isArray(saved) ? saved.filter(line => typeof line === "string").slice(-HISTORY_LIMIT) : [];
    } catch (e) {
        return [];
    }
}

const terminalHistory = { lines: loadHistory(), index: null, draft: "" };

// Ogni riga eseguita entra nella cronologia (senza ripetere quella appena prima)
function rememberCommand(text) {
    const line = text.trim();
    terminalHistory.index = null;
    if (!line || terminalHistory.lines[terminalHistory.lines.length - 1] === line) return;
    terminalHistory.lines.push(line);
    terminalHistory.lines = terminalHistory.lines.slice(-HISTORY_LIMIT);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(terminalHistory.lines)); } catch (e) { /* solo per questa sessione */ }
}

// direction -1 = più vecchia (↑), +1 = più recente (↓). Restituisce la riga da mostrare o null
function historyStep(direction, current) {
    const { lines } = terminalHistory;
    if (!lines.length) return null;
    if (terminalHistory.index === null) {
        if (direction > 0) return null;
        terminalHistory.draft = current;
        terminalHistory.index = lines.length;
    }
    const next = terminalHistory.index + direction;
    if (next < 0) return lines[0];
    if (next >= lines.length) {
        terminalHistory.index = null;
        return terminalHistory.draft;
    }
    terminalHistory.index = next;
    return lines[next];
}

// Nomi che il terminale capisce: i comandi del gioco e quelli di aiuto
const SHELL_WORDS = () => [...new Set([...Object.keys(PARSERS), "sed", "comm", "join", "man", "apropos", "whatis"])].sort();
const REDIRECT_WORDS = ["2>/dev/null", "2>&1"];

// Candidati per l'ultima parola di text, in base a dove si trova
function completionCandidates(text, files) {
    const segment = text.split("|").pop();
    const words = segment.replace(/^\s+/, "").split(/\s+/);
    const partial = words[words.length - 1];
    const before = words.slice(0, -1).filter(word => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(word));
    let pool;
    if (partial.startsWith("2")) pool = REDIRECT_WORDS;
    else if (!before.length) pool = text.includes("|") ? SHELL_WORDS().filter(word => !["man", "apropos", "whatis"].includes(word)) : SHELL_WORDS();
    else if (before[0] === "man" || before[0] === "whatis") pool = Object.values(MAN_PAGES).flatMap(page => page.names).filter(name => /^[a-z]/.test(name));
    else if (before[0] === "comm" || before[0] === "join") pool = Object.keys(files);
    else pool = [];
    return { partial, matches: pool.filter(word => word.startsWith(partial)) };
}

const commonPrefix = words => words.reduce((prefix, word) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === word[i]) i++;
    return prefix.slice(0, i);
});

// Completa text: restituisce { text, list } (list = alternative da mostrare) oppure null
function completeTerminal(text, files) {
    if (!text.trim() || /\s$/.test(text)) return null;
    const { partial, matches } = completionCandidates(text, files);
    if (!partial || !matches.length) return null;
    if (matches.length === 1) {
        if (matches[0] === partial) return null;
        return { text: text.slice(0, text.length - partial.length) + matches[0] + " ", list: [] };
    }
    const prefix = commonPrefix(matches);
    return { text: text.slice(0, text.length - partial.length) + prefix, list: prefix === partial ? matches : [] };
}

function setTerminalHint(text) {
    document.getElementById("terminal-hint").textContent = text;
}

document.getElementById("terminal-input").addEventListener("keydown", event => {
    const input = event.target;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const line = historyStep(event.key === "ArrowUp" ? -1 : 1, input.value);
        if (line === null) return;
        event.preventDefault();
        input.value = line;
        input.setSelectionRange(line.length, line.length);
        setTerminalHint("");
        refreshTerminal();
        return;
    }
    // Tab completa solo con il cursore in fondo e una parola da completare: altrimenti
    // resta il tasto che sposta il focus (chi naviga con la tastiera non resta bloccato)
    if (event.key === "Tab" && !event.shiftKey && input.selectionStart === input.value.length) {
        const done = completeTerminal(input.value, levelFiles(currentLevel()));
        if (!done) return;
        event.preventDefault();
        input.value = done.text;
        setTerminalHint(done.list.length ? done.list.join("   ") : "");
        refreshTerminal();
    }
});
document.getElementById("terminal-input").addEventListener("input", () => {
    terminalHistory.index = null;
    setTerminalHint("");
});
