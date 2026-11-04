// Livelli condivisibili: il livello viaggia nell'indirizzo, dopo #livello=, codificato in base64url.
// Un link può arrivare da chiunque, quindi il livello si convalida campo per campo e l'obiettivo
// (che contiene HTML) ammette solo <code>, <strong> e <em>.

const SHARE_PREFIX = "#livello=";

// Qualsiasi dato JSON in base64url (usato anche dal codice di backup dei progressi)
function encodeData(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeData(text) {
    const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "===".slice((base64.length + 3) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
}

// Indirizzo per giocare il livello: solo i campi di un livello "componi"
function shareUrl(level, base) {
    const shared = {
        title: level.title, mission: level.mission, nudge: level.nudge, hint: level.hint,
        stdin: level.stdin, target: level.target, allowedCommands: level.allowedCommands
    };
    if (level.slots) shared.slots = level.slots;
    if (level.targetStderr) shared.targetStderr = level.targetStderr;
    if (level.source) shared.source = level.source;
    return base + SHARE_PREFIX + encodeData(shared);
}

// Testo HTML dell'obiettivo: tutto viene mostrato come testo, tranne i tag semplici ammessi
function safeMissionHtml(text) {
    const escaped = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return escaped.replace(/&lt;(\/?)(code|strong|em)&gt;/g, "<$1$2>");
}

const isShortText = (value, max) => typeof value === "string" && value.length <= max;

// Restituisce un messaggio d'errore, oppure null se il livello è giocabile
function sharedLevelError(level) {
    if (!level || typeof level !== "object" || Array.isArray(level)) return "il link non contiene un livello";
    if (!isShortText(level.title, 60) || !level.title.trim()) return "titolo mancante o troppo lungo";
    if (!isShortText(level.mission, 600)) return "obiettivo mancante o troppo lungo";
    if (level.nudge !== undefined && !isShortText(level.nudge, 600)) return "spinta troppo lunga";
    if (level.hint !== undefined && !isShortText(level.hint, 600)) return "suggerimento troppo lungo";
    const line = item => isShortText(item, 120) || (item && typeof item === "object" && isShortText(item.err, 120) && Object.keys(item).length === 1);
    if (!Array.isArray(level.stdin) || level.stdin.length < 1 || level.stdin.length > 60 || !level.stdin.every(line)) return "input non valido";
    if (!Array.isArray(level.target) || level.target.length > 60 || !level.target.every(item => isShortText(item, 200))) return "output atteso non valido";
    if (level.source !== undefined && !isShortText(level.source, 80)) return "origine dell'input troppo lunga";
    if (level.targetStderr !== undefined && !(Array.isArray(level.targetStderr) && level.targetStderr.length <= 60 && level.targetStderr.every(item => isShortText(item, 200)))) return "stderr atteso non valido";
    if (level.slots !== undefined && !(Number.isInteger(level.slots) && level.slots >= 1 && level.slots <= 8)) return "numero di slot non valido";
    if (!Array.isArray(level.allowedCommands) || level.allowedCommands.length < 1 || level.allowedCommands.length > 12) return "elenco dei comandi non valido";
    for (const step of level.allowedCommands) {
        if (!step || !COMMANDS[step.cmd] || !isShortText(step.desc, 60)) return "comando sconosciuto o senza descrizione";
        if (step.args !== undefined && (typeof step.args !== "object" || Array.isArray(step.args))) return `argomenti non validi per ${step.cmd}`;
        const error = argsError({ cmd: step.cmd, args: argsFromStep(step) });
        if (error) return `${step.cmd}: ${error}`;
    }
    if (!analyzeLevel(level).solvable) return "il livello non ha soluzione";
    return null;
}

// Livello del link nell'indirizzo: { level }, { error } oppure null se non c'è un link
function sharedLevelFromHash(hash) {
    if (!hash.startsWith(SHARE_PREFIX)) return null;
    let data;
    try {
        data = decodeData(hash.slice(SHARE_PREFIX.length));
    } catch (e) {
        return { error: "Il link del livello è danneggiato." };
    }
    const error = sharedLevelError(data);
    if (error) return { error: `Il link del livello non è valido: ${error}.` };
    const level = {
        id: "condiviso", act: 0, shared: true, title: data.title, mission: data.mission, nudge: data.nudge, hint: data.hint || "",
        stdin: data.stdin, target: data.target, allowedCommands: data.allowedCommands
    };
    if (data.slots) level.slots = data.slots;
    if (data.targetStderr && data.targetStderr.length) level.targetStderr = data.targetStderr;
    if (data.source) level.source = data.source;
    return { level };
}
