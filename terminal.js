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
        const { flags, operands } = shortFlags("grep", words, ["v", "o", "i", "w", "c"]);
        if (operands.length !== 1) fail("grep: serve esattamente un testo da cercare, es. grep -v 'ERR'");
        const args = { pattern: operands[0] };
        if (flags.has("v")) args.invert = true;
        if (flags.has("o")) args.only = true;
        if (flags.has("i")) args.ignoreCase = true;
        if (flags.has("w")) args.word = true;
        if (flags.has("c")) args.count = true;
        return args;
    },
    sort: words => {
        const args = {};
        for (let i = 0; i < words.length;) {
            const word = words[i];
            if (/^-t/.test(word)) {
                const { value, used } = optionValue(words, i, "t");
                if (value === undefined || [...value].length !== 1) fail("sort: il separatore -t deve essere un solo carattere");
                args.separator = value;
                i += used;
            } else if (/^-k/.test(word)) {
                const { value, used } = optionValue(words, i, "k");
                const match = (value ?? "").match(/^([0-9]+),([0-9]+)$/);
                if (!match || match[1] !== match[2] || Number(match[1]) < 1) {
                    fail(`sort: nel gioco la chiave è un solo campo, es. -k2,2 (non '${value ?? ""}': -k2 da solo arriva fino a fine riga)`);
                }
                args.key = Number(match[1]);
                i += used;
            } else if (/^-[rnhu]+$/.test(word)) {
                if (word.includes("n")) args.numeric = true;
                if (word.includes("h")) args.human = true;
                if (word.includes("r")) args.reverse = true;
                if (word.includes("u")) args.unique = true;
                i++;
            } else if (word.startsWith("-")) {
                fail(`sort: opzione non valida '${word}' (nel gioco: -r -n -h -u -t -k)`);
            } else {
                fail(`sort: nel gioco sort legge solo dalla pipe (argomento in più: '${word}')`);
            }
        }
        return args;
    },
    uniq: words => {
        const { flags, operands } = shortFlags("uniq", words, ["c", "d", "u"]);
        if (operands.length) fail(`uniq: argomento in più: '${operands[0]}'`);
        const args = {};
        if (flags.has("c")) args.count = true;
        if (flags.has("d")) args.repeated = true;
        if (flags.has("u")) args.unique = true;
        return args;
    },
    nl: words => {
        const args = {};
        for (let i = 0; i < words.length;) {
            const word = words[i];
            if (word === "-ba" || (word === "-b" && words[i + 1] === "a")) {
                args.all = true;
                i += word === "-ba" ? 1 : 2;
            } else if (word === "-bt" || (word === "-b" && words[i + 1] === "t")) {
                i += word === "-bt" ? 1 : 2;
            } else if (/^-w/.test(word)) {
                const { value, used } = optionValue(words, i, "w");
                args.width = positiveInt("nl", value);
                i += used;
            } else if (/^-s/.test(word)) {
                const { value, used } = optionValue(words, i, "s");
                if (value === undefined || value === "") fail("nl: dopo -s serve un separatore, es. nl -s'. '");
                args.separator = value;
                i += used;
            } else {
                fail(`nl: opzione non valida '${word}' (nel gioco: -ba, -wN, -s'X')`);
            }
        }
        return args;
    },
    tee: words => {
        if (words.length !== 1 || words[0].startsWith("-")) fail("tee: nel gioco tee scrive su un solo file, es. tee copia.txt o tee /dev/stderr");
        return { file: words[0] };
    },
    tac: words => {
        if (words.length) fail("tac: nel gioco tac legge solo dalla pipe, senza opzioni");
        return {};
    },
    rev: words => {
        if (words.length) fail("rev: nel gioco rev legge solo dalla pipe, senza opzioni");
        return {};
    },
    head: words => ({ n: parseCount("head", words) }),
    tail: words => ({ n: parseCount("tail", words) }),
    wc: words => {
        if (words.length !== 1 || words[0] !== "-l") fail("wc: nel gioco wc conta righe (-l), parole (-w) o byte (-c), una cosa alla volta");
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
                if (/^[0-9]+$/.test(value ?? "") && Number(value) >= 1) args.field = Number(value);
                else if (cutFieldSet(value ?? "")) args.fields = value;
                else fail(`cut: campi non validi: '${value ?? ""}' (es. -f2, -f1,3, -f2-)`);
                i += used;
            } else if (word === "--complement") {
                args.complement = true;
                i++;
            } else {
                fail(`cut: argomento non valido: '${word}' (si usa cut -d'X' -fN)`);
            }
        }
        if (args.delim === undefined || (args.field === undefined && args.fields === undefined)) fail("cut: servono sia -d che -f, es. cut -d':' -f2");
        const result = { delim: args.delim };
        if (args.field !== undefined) result.field = args.field;
        if (args.fields !== undefined) result.fields = args.fields;
        if (args.complement) result.complement = true;
        return result;
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
    fold: words => {
        const args = {};
        for (let i = 0; i < words.length;) {
            const word = words[i];
            if (/^-s*w/.test(word) || /^-s+$/.test(word)) {
                if (word.includes("s")) args.spaces = true;
                if (word.includes("w")) {
                    const { value, used } = optionValue(words, i, "w");
                    if (!/^[0-9]+$/.test(value ?? "") || Number(value) < 1) fail(`fold: larghezza non valida: '${value ?? ""}'`);
                    args.width = Number(value);
                    i += used;
                } else {
                    i++;
                }
            } else if (/^-[0-9]+$/.test(word)) {
                args.width = Number(word.slice(1));
                i++;
            } else {
                fail(`fold: argomento non valido '${word}' (nel gioco: fold -w N, fold -s -w N)`);
            }
        }
        if (!args.width) fail("fold: nel gioco serve la larghezza, es. fold -w 20 (senza -w GNU usa 80)");
        return args;
    },
    xargs: words => {
        // «xargs echo» è lo stesso di «xargs»: echo è il comando predefinito
        if (words[words.length - 1] === "echo") words = words.slice(0, -1);
        if (words.length === 0) return {};
        const { value, used } = /^-n/.test(words[0]) ? optionValue(words, 0, "n") : { value: undefined, used: 0 };
        if (used === 0 || used !== words.length) {
            fail("xargs: nel gioco xargs lancia sempre echo: xargs oppure xargs -n N (senza un comando dopo)");
        }
        if (!/^[0-9]+$/.test(value ?? "") || Number(value) < 1) fail(`xargs: valore non valido per -n: '${value ?? ""}'`);
        return { n: Number(value) };
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
    // Sostituzione vuota (s/x//): come nell'editor, l'argomento si omette
    const args = { pattern, ...(replacement !== "" ? { replacement } : {}), ...(flags === "g" ? { global: true } : {}) };
    const error = COMMANDS.sed.validate(args);
    if (error) fail(`sed: ${error}`);
    return { cmd: "sed", args };
}

// cut -cN-M o cut -c N: i caratteri dal N-esimo al M-esimo
function parseCutChars(words) {
    const index = words.findIndex(word => /^-c/.test(word));
    const { value, used } = optionValue(words, index, "c");
    if (words.length !== used) fail("cut: nel gioco -c si usa da solo, es. cut -c1-3");
    const match = (value ?? "").match(/^([0-9]+)(?:-([0-9]+))?$/);
    if (!match || Number(match[1]) < 1) fail(`cut: intervallo di caratteri non valido: '${value ?? ""}' (es. cut -c1-3)`);
    const args = { from: Number(match[1]), to: Number(match[2] ?? match[1]) };
    const error = COMMANDS.cutc.validate(args);
    if (error) fail(`cut: ${error}`);
    return { cmd: "cutc", args };
}

// comm -12 - file e join [-t'X'] - file: lo stdin è il primo file, il secondo è un file del livello
function parseTwoFiles(name, words, files) {
    const args = {};
    const operands = [];
    for (let i = 0; i < words.length;) {
        const word = words[i];
        if (name === "comm" && /^-[123]+$/.test(word)) {
            // -12, -21 o -1 -2: le colonne da nascondere, in qualsiasi ordine
            args.mode = [...new Set((args.mode || "") + word.slice(1))].sort().join("");
            i++;
        } else if (name === "join" && /^-t/.test(word)) {
            const { value, used } = optionValue(words, i, "t");
            if (value === undefined || [...value].length !== 1) fail("join: il separatore -t deve essere un solo carattere");
            args.separator = value;
            i += used;
        } else if (word.startsWith("-") && word !== "-") {
            fail(`${name}: opzione non valida '${word}'`);
        } else {
            operands.push(word);
            i++;
        }
    }
    if (name === "comm" && !["12", "13", "23"].includes(args.mode)) fail("comm: nel gioco si mostra una colonna sola: -12 (in comune), -23 (solo nello stdin) o -13 (solo nel file)");
    if (operands.length !== 2 || operands[0] !== "-") fail(`${name}: si usa '${name} ${name === "comm" ? "-12 " : ""}- file': il primo file è lo stdin (-), il secondo un file del livello`);
    const file = operands[1];
    if (!files[file]) {
        const known = Object.keys(files);
        fail(`${name}: ${file}: file non trovato${known.length ? ` (in questo livello: ${known.join(", ")})` : ""}`);
    }
    return { ...args, file, lines: files[file] };
}

function parseCommand(words, files = {}) {
    // Le assegnazioni di variabili (es. LC_ALL=C) davanti al comando si ignorano
    while (words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])) words = words.slice(1);
    if (!words.length) fail("bash: errore di sintassi vicino al token inatteso '|'");
    const [name, ...rest] = words;
    if (name === "sed") return parseSed(rest);
    if (name === "cut" && rest.some(word => /^-c/.test(word))) return parseCutChars(rest);
    // Atto X: impronte, od -c e i file compressi del livello
    if (name === "md5sum" || name === "sha256sum") {
        if (rest.length && !(rest.length === 1 && rest[0] === "-")) fail(`${name}: nel gioco ${name} legge dalla pipe (argomento in più: '${rest[0]}')`);
        return { cmd: name, args: {} };
    }
    if (name === "od") {
        if (rest.length !== 1 || rest[0] !== "-c") fail("od: nel gioco si usa od -c (mostra ogni carattere, anche quelli invisibili)");
        return { cmd: "od", args: {} };
    }
    if (name === "zcat" || name === "bzcat" || name === "xzcat") {
        if (rest.length !== 1 || rest[0].startsWith("-")) fail(`${name}: si usa '${name} file', con un file compresso del livello`);
        if (!files[rest[0]]) {
            const known = Object.keys(files);
            fail(`${name}: ${rest[0]}: file non trovato${known.length ? ` (in questo livello: ${known.join(", ")})` : ""}`);
        }
        return { cmd: name, args: { file: rest[0], lines: files[rest[0]] } };
    }
    // wc -w e wc -c sono comandi a parte nel gioco (wc -l resta wc)
    if (name === "wc" && rest.length === 1 && (rest[0] === "-w" || rest[0] === "-c")) return { cmd: rest[0] === "-w" ? "wcw" : "wcc", args: {} };
    if (name === "tr" && rest[0] === "-s") {
        if (rest.length !== 2) fail("tr: nel gioco -s si usa con un solo insieme, es. tr -s ' '");
        const args = { set: rest[1].replace(/\\n/g, "\n") };
        const error = COMMANDS.squeeze.validate(args);
        if (error) fail(`tr: ${error}`);
        return { cmd: "squeeze", args };
    }
    if (name === "comm" || name === "join") {
        const args = parseTwoFiles(name, rest, files);
        const error = COMMANDS[name].validate(args);
        if (error) fail(`${name}: ${error}`);
        return { cmd: name, args };
    }
    if (!PARSERS[name]) fail(`bash: ${name}: comando non trovato`);
    const args = PARSERS[name](rest);
    const validate = COMMANDS[name].validate;
    const error = validate && validate(args);
    if (error) fail(`${name}: ${error}`);
    return { cmd: name, args };
}

// Pipeline scritta dopo il prompt "$ programma": può iniziare con i reindirizzamenti del
// programma (2>&1 | ...) o con una pipe ("| grep ..."). Restituisce { steps } oppure { error }.
function parsePipeline(text, files = {}) {
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
            const command = parseCommand(rest, files);
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
