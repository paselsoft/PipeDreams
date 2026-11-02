// Modalità terminale: interprete che traduce una pipeline scritta come in bash nei passi del
// registro dei comandi. Supporta il sottoinsieme del gioco; per il resto risponde con errori
// in stile bash. Non usa la pagina: tools/check-terminal.js lo verifica da Node.

class ShellError extends Error {}
const fail = message => { throw new ShellError(message); };

// Divide il testo in segmenti separati da | e ogni segmento in parole, rispettando le
// virgolette come la shell: '...' è letterale, "..." accetta \" e \\, fuori dalle virgolette
// la barra rovesciata protegge il carattere successivo. Le virgolette dentro una parola si uniscono.
function tokenize(text) {
    const segments = [[]];
    let word = null;
    const endWord = () => {
        if (word !== null) segments[segments.length - 1].push(word);
        word = null;
    };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === "'") {
            const end = text.indexOf("'", i + 1);
            if (end === -1) fail("bash: manca l'apice di chiusura '");
            word = (word ?? "") + text.slice(i + 1, end);
            i = end;
        } else if (c === '"') {
            let j = i + 1;
            let value = "";
            while (j < text.length && text[j] !== '"') {
                if (text[j] === "\\" && ['"', "\\", "$", "`"].includes(text[j + 1])) j++;
                value += text[j++];
            }
            if (j >= text.length) fail('bash: mancano le virgolette di chiusura "');
            word = (word ?? "") + value;
            i = j;
        } else if (c === "\\" && i + 1 < text.length) {
            word = (word ?? "") + text[++i];
        } else if (c === "|") {
            endWord();
            segments.push([]);
        } else if (c === " " || c === "\t") {
            endWord();
        } else {
            word = (word ?? "") + c;
        }
    }
    endWord();
    return segments;
}

// Separa i reindirizzamenti dello stderr dalle altre parole del segmento
function extractRedirects(words) {
    const rest = [];
    const redirects = [];
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (word === "2>" || word === "2>&") word += words[++i] ?? "";
        if (word === "2>/dev/null") redirects.push({ cmd: "devnull" });
        else if (word === "2>&1") redirects.push({ cmd: "merge" });
        else if (/^[0-9]*[<>]/.test(word)) fail(`bash: nel gioco sono supportati solo i reindirizzamenti 2>/dev/null e 2>&1 (non '${word}')`);
        else rest.push(word);
    }
    return { rest, redirects };
}

// Opzioni corte unite o separate: "-rn" → ["r", "n"]
function shortFlags(name, words, allowed) {
    const flags = new Set();
    const operands = [];
    for (const word of words) {
        if (/^-[A-Za-z]+$/.test(word)) {
            for (const flag of word.slice(1)) {
                if (!allowed.includes(flag)) fail(`${name}: opzione non valida -- '${flag}' (nel gioco: ${allowed.map(f => "-" + f).join(" ") || "nessuna"})`);
                flags.add(flag);
            }
        } else {
            operands.push(word);
        }
    }
    return { flags, operands };
}

function positiveInt(name, value) {
    if (!/^[0-9]+$/.test(value ?? "") || Number(value) < 1) fail(`${name}: numero di righe non valido: '${value ?? ""}'`);
    return Number(value);
}

// head/tail: -n N, -nN, -N (predefinito 10, come in GNU)
function parseCount(name, words) {
    if (words.length === 0) return 10;
    const [first, second] = words;
    if (words.length === 2 && first === "-n") return positiveInt(name, second);
    if (words.length === 1 && /^-n[0-9]+$/.test(first)) return positiveInt(name, first.slice(2));
    if (words.length === 1 && /^-[0-9]+$/.test(first)) return positiveInt(name, first.slice(1));
    fail(`${name}: nel gioco si usa solo '${name} -n N'`);
}

// Opzione con valore: "-d X", "-dX" o unita ad altre lettere ("-sdX")
function optionValue(words, index, letter) {
    const word = words[index];
    const position = word.indexOf(letter);
    const attached = word.slice(position + 1);
    return attached !== "" ? { value: attached, used: 1 } : { value: words[index + 1], used: 2 };
}

const PARSERS = {
    grep: words => {
        const { flags, operands } = shortFlags("grep", words, ["v"]);
        if (operands.length !== 1) fail("grep: serve esattamente un testo da cercare, es. grep -v 'ERR'");
        return flags.has("v") ? { pattern: operands[0], invert: true } : { pattern: operands[0] };
    },
    sort: words => {
        const { flags, operands } = shortFlags("sort", words, ["r", "n"]);
        if (operands.length) fail(`sort: nel gioco sort legge solo dalla pipe (argomento in più: '${operands[0]}')`);
        const args = {};
        if (flags.has("n")) args.numeric = true;
        if (flags.has("r")) args.reverse = true;
        return args;
    },
    uniq: words => {
        const { flags, operands } = shortFlags("uniq", words, ["c"]);
        if (operands.length) fail(`uniq: argomento in più: '${operands[0]}'`);
        return flags.has("c") ? { count: true } : {};
    },
    head: words => ({ n: parseCount("head", words) }),
    tail: words => ({ n: parseCount("tail", words) }),
    wc: words => {
        if (words.length !== 1 || words[0] !== "-l") fail("wc: nel gioco wc conta solo le righe: usa wc -l");
        return {};
    },
    cut: words => {
        const args = {};
        for (let i = 0; i < words.length;) {
            const word = words[i];
            if (/^-d/.test(word)) {
                const { value, used } = optionValue(words, i, "d");
                if (value === undefined || [...value].length !== 1) fail("cut: il delimitatore deve essere un solo carattere");
                args.delim = value;
                i += used;
            } else if (/^-f/.test(word)) {
                const { value, used } = optionValue(words, i, "f");
                if (!/^[0-9]+$/.test(value ?? "") || Number(value) < 1) fail(`cut: campo non valido: '${value ?? ""}' (nel gioco un solo campo, es. -f2)`);
                args.field = Number(value);
                i += used;
            } else {
                fail(`cut: argomento non valido: '${word}' (si usa cut -d'X' -fN)`);
            }
        }
        if (args.delim === undefined || args.field === undefined) fail("cut: servono sia -d che -f, es. cut -d':' -f2");
        return { delim: args.delim, field: args.field };
    },
    tr: words => {
        // In tr la sequenza \n indica l'a capo, anche tra apici
        const set = text => text.replace(/\\n/g, "\n");
        if (words[0] === "-d") {
            if (words.length !== 2) fail("tr: con -d serve un solo insieme di caratteri, es. tr -d '0-9'");
            return { delete: set(words[1]) };
        }
        if (words.length !== 2 || words[0].startsWith("-")) fail("tr: servono due insiemi di caratteri, es. tr 'a-z' 'A-Z'");
        return { from: set(words[0]), to: set(words[1]) };
    },
    awk: words => {
        let separator;
        const rest = [];
        for (let i = 0; i < words.length; i++) {
            if (words[i].startsWith("-F")) {
                separator = words[i].length > 2 ? words[i].slice(2) : words[++i];
                if (separator === undefined || [...separator].length !== 1) fail("awk: nel gioco il separatore -F è un solo carattere");
            } else {
                rest.push(words[i]);
            }
        }
        const match = rest.length === 1 && rest[0].match(/^\{\s*print\s+\$([0-9]+)\s*;?\s*\}$/);
        if (!match || Number(match[1]) < 1) fail("awk: nel gioco awk stampa un solo campo: awk '{print $N}'");
        return separator === undefined ? { field: Number(match[1]) } : { field: Number(match[1]), separator };
    },
    paste: words => {
        let serial = false;
        let delim;
        for (let i = 0; i < words.length;) {
            const word = words[i];
            if (!/^-[sd]+/.test(word)) fail(`paste: argomento non valido: '${word}' (si usa paste -sd'X')`);
            if (word.includes("s")) serial = true;
            if (word.includes("d")) {
                const { value, used } = optionValue(words, i, "d");
                delim = value;
                i += used;
            } else {
                i += 1;
            }
        }
        if (!serial) fail("paste: nel gioco paste unisce sempre le righe con -s, es. paste -sd','");
        if (delim === undefined || [...delim].length !== 1) fail("paste: serve un delimitatore di un carattere, es. paste -sd','");
        return { delim };
    }
};

// sed: lo script del maiuscolo, oppure sed -E 's/RE/SOST/[g]' con qualunque delimitatore
function parseSed(words) {
    const extended = words[0] === "-E" || words[0] === "-r";
    const scripts = extended ? words.slice(1) : words;
    if (scripts.length !== 1) fail("sed: serve un solo script, es. sed -E 's/x/y/g'");
    const script = scripts[0];
    if (!extended) {
        if (script === "s/.*/\\U&/") return { cmd: "upper", args: {} };
        fail("sed: nel gioco le sostituzioni usano le regex estese: sed -E 's/RE/SOST/'");
    }
    const delimiter = script[1];
    if (script[0] !== "s" || !delimiter) fail(`sed: comando sconosciuto: '${script}' (nel gioco solo s///)`);
    const parts = script.slice(2).split(delimiter);
    if (parts.length !== 3) fail(`sed: script incompleto: '${script}'`);
    const [pattern, replacement, flags] = parts;
    if (flags !== "" && flags !== "g") fail(`sed: opzione sconosciuta per s: '${flags}' (nel gioco solo g)`);
    const args = flags === "g" ? { pattern, replacement, global: true } : { pattern, replacement };
    const error = COMMANDS.sed.validate(args);
    if (error) fail(`sed: ${error}`);
    return { cmd: "sed", args };
}

function parseCommand(words) {
    // Le assegnazioni di variabili (es. LC_ALL=C) davanti al comando si ignorano
    while (words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])) words = words.slice(1);
    if (!words.length) fail("bash: errore di sintassi vicino al token inatteso '|'");
    const [name, ...rest] = words;
    if (name === "sed") return parseSed(rest);
    if (!PARSERS[name]) fail(`bash: ${name}: comando non trovato`);
    const args = PARSERS[name](rest);
    const validate = COMMANDS[name].validate;
    const error = validate && validate(args);
    if (error) fail(`${name}: ${error}`);
    return { cmd: name, args };
}

// Pipeline scritta dopo il prompt "$ programma": può iniziare con i reindirizzamenti del
// programma (2>&1 | ...) o con una pipe ("| grep ..."). Restituisce { steps } oppure { error }.
function parsePipeline(text) {
    try {
        const segments = tokenize(text.trim());
        const steps = [];
        segments.forEach((words, index) => {
            const { rest, redirects } = extractRedirects(words);
            if (index === 0 && rest.length === 0) {
                // Primo segmento: solo reindirizzamenti del programma, oppure vuoto se si inizia con "|"
                if (redirects.length === 0 && segments.length > 1 && text.trim().startsWith("|")) return;
                steps.push(...redirects);
                return;
            }
            const command = parseCommand(rest);
            steps.push({ cmd: command.cmd, args: command.args }, ...redirects);
        });
        if (steps.length === 0) fail("bash: scrivi almeno un comando, es. sort | uniq");
        return { steps: steps.map(step => Object.keys(step.args || {}).length ? step : { cmd: step.cmd }) };
    } catch (error) {
        if (error instanceof ShellError) return { error: error.message };
        throw error;
    }
}

// Testo di una pipeline come lo scriverebbe il giocatore: i reindirizzamenti restano attaccati
function pipelineText(steps) {
    const segments = [];
    for (const step of steps) {
        if (step.cmd === null) continue;
        if (COMMANDS[step.cmd].redirect && segments.length) segments[segments.length - 1] += ` ${stepLabel(step)}`;
        else if (COMMANDS[step.cmd].redirect) segments.push(stepLabel(step));
        else segments.push(stepLabel(step));
    }
    return segments.join(" | ");
}
