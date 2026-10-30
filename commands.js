// Registro dei comandi Unix simulati.
// Comandi normali: run(stdout: string[], args) => string[]. Leggono solo stdout; lo stderr
// del comando precedente non attraversa la pipe e va dove indica la sua destinazione.
// Reindirizzamenti (redirect: true): route indica dove mandare lo stderr del comando a cui
// sono attaccati (l'ultimo comando prima di loro, o il programma sorgente). Come in bash,
// se un comando ha più reindirizzamenti vince l'ultimo.
// label(args) restituisce la sintassi mostrata al giocatore.
// params descrive gli argomenti per l'editor dei livelli: text, char (un solo carattere),
// number (intero >= 1), flag (opzione sì/no), set (insieme di caratteri di tr, accetta \n);
// optional: true permette il valore vuoto.
// validate(args), se presente, restituisce un messaggio d'errore per argomenti non supportati.

// I comandi numerici trattano come 0 le righe che non iniziano con un numero, come GNU sort -n
const leadingNumber = line => parseFloat(line) || 0;
const byteOrder = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

// Espande gli intervalli di tr: "a-z" diventa "abc...z"
function expandSet(set) {
    let chars = "";
    for (let i = 0; i < set.length; i++) {
        if (set[i + 1] === "-" && i + 2 < set.length) {
            for (let c = set.charCodeAt(i); c <= set.charCodeAt(i + 2); c++) chars += String.fromCharCode(c);
            i += 2;
        } else {
            chars += set[i];
        }
    }
    return chars;
}

// Mostra i caratteri speciali come li scriveresti nella shell
const shellQuote = set => `'${set.replace(/\n/g, "\\n")}'`;

// sed -E usa le regex estese POSIX (ERE). Il sottoinsieme ammesso si comporta come in JavaScript:
// niente alternative "|" (POSIX sceglie la corrispondenza più lunga, JS la prima), niente
// classi "[[:digit:]]", né escape come \d o \w che ERE non conosce.
function sedPatternError(pattern) {
    if (pattern.includes("|")) return "l'alternativa | non è supportata";
    if (pattern.includes("[:")) return "le classi [[:...:]] non sono supportate: usa [0-9], [a-z]...";
    if (/\\[A-Za-z0-9]/.test(pattern)) return "escape come \\d o \\w non esistono in sed: usa [0-9]";
    if (pattern.includes("(?")) return "costrutto (?...) non supportato";
    try {
        new RegExp(pattern);
    } catch (e) {
        return "espressione regolare non valida";
    }
    return null;
}

// Il delimitatore di s/// è "/", oppure "#" se pattern o sostituzione contengono "/"
const sedDelimiter = a => (a.pattern + (a.replacement || "")).includes("/") ? "#" : "/";

// Sostituzione in stile sed: & è l'intera corrispondenza, \1..\9 i gruppi, \& e \\ letterali, \n a capo
function sedReplacement(template, match, groups) {
    let out = "";
    for (let i = 0; i < template.length; i++) {
        const c = template[i];
        if (c === "&") {
            out += match;
        } else if (c === "\\" && i + 1 < template.length) {
            const next = template[++i];
            if (/[1-9]/.test(next)) out += groups[Number(next) - 1] ?? "";
            else if (next === "n") out += "\n";
            else out += next;
        } else {
            out += c;
        }
    }
    return out;
}

// s///: come GNU, una corrispondenza vuota subito dopo la precedente non viene sostituita
// (JavaScript la sostituirebbe: con s/x*/-/g, "x" darebbe "--" invece di "-")
function sedSubstitute(line, regex, replacement, global) {
    let out = "";
    let pos = 0;
    let prevEnd = -1;
    while (pos <= line.length) {
        regex.lastIndex = pos;
        const m = regex.exec(line);
        if (!m) break;
        const start = m.index;
        const end = start + m[0].length;
        if (start === end && start === prevEnd) {
            if (start >= line.length) break;
            out += line.slice(pos, start + 1);
            pos = start + 1;
            continue;
        }
        out += line.slice(pos, start) + sedReplacement(replacement, m[0], m.slice(1));
        prevEnd = end;
        if (start === end) {
            if (start >= line.length) {
                pos = start;
                break;
            }
            out += line[start];
            pos = start + 1;
        } else {
            pos = end;
        }
        if (!global) break;
    }
    return out + line.slice(pos);
}

// awk divide sui gruppi di spazi e tabulazioni (ignorando quelli iniziali), oppure esattamente su -F
function awkFields(line, separator) {
    if (separator) return line.split(separator);
    const trimmed = line.replace(/^[ \t]+|[ \t]+$/g, "");
    return trimmed === "" ? [] : trimmed.split(/[ \t]+/);
}

const COMMANDS = {
    grep: {
        params: [{ key: "pattern", type: "text", label: "testo" }, { key: "invert", type: "flag", label: "-v" }],
        label: a => `grep${a.invert ? " -v" : ""} '${a.pattern}'`,
        run: (s, a) => s.filter(line => line.includes(a.pattern) !== Boolean(a.invert))
    },
    sort: {
        params: [{ key: "reverse", type: "flag", label: "-r" }, { key: "numeric", type: "flag", label: "-n" }],
        label: a => `sort${a.reverse || a.numeric ? " -" : ""}${a.reverse ? "r" : ""}${a.numeric ? "n" : ""}`,
        run: (s, a) => {
            // A parità di valore numerico GNU sort confronta l'intera riga
            const compare = a.numeric
                ? (x, y) => leadingNumber(x) - leadingNumber(y) || byteOrder(x, y)
                : byteOrder;
            const sorted = [...s].sort(compare);
            return a.reverse ? sorted.reverse() : sorted;
        }
    },
    uniq: {
        params: [{ key: "count", type: "flag", label: "-c" }],
        label: a => `uniq${a.count ? " -c" : ""}`,
        run: (s, a) => {
            const groups = [];
            for (const line of s) {
                const last = groups[groups.length - 1];
                if (last && last.line === line) last.count++;
                else groups.push({ line, count: 1 });
            }
            // uniq -c antepone il conteggio allineato a destra su 7 caratteri, come GNU
            return groups.map(g => a.count ? `${String(g.count).padStart(7)} ${g.line}` : g.line);
        }
    },
    upper: {
        params: [],
        label: () => "sed 's/.*/\\U&/'",
        run: s => s.map(line => line.toUpperCase())
    },
    head: {
        params: [{ key: "n", type: "number", label: "-n", default: 2 }],
        label: a => `head -n ${a.n}`,
        run: (s, a) => s.slice(0, a.n)
    },
    tail: {
        params: [{ key: "n", type: "number", label: "-n", default: 2 }],
        label: a => `tail -n ${a.n}`,
        run: (s, a) => s.slice(-a.n)
    },
    wc: {
        params: [],
        label: () => "wc -l",
        run: s => [String(s.length)]
    },
    cut: {
        params: [{ key: "delim", type: "char", label: "-d", default: ":" }, { key: "field", type: "number", label: "-f", default: 1 }],
        label: a => `cut -d'${a.delim}' -f${a.field}`,
        // Le righe senza delimitatore passano intere, come fa cut senza -s
        run: (s, a) => s.map(line => line.includes(a.delim) ? (line.split(a.delim)[a.field - 1] ?? "") : line)
    },
    tr: {
        params: [{ key: "from", type: "set", label: "da" }, { key: "to", type: "set", label: "a" }, { key: "delete", type: "set", label: "-d" }],
        label: a => a.delete ? `tr -d ${shellQuote(a.delete)}` : `tr ${shellQuote(a.from)} ${shellQuote(a.to)}`,
        // Il gioco applica tr riga per riga: trasformare o cancellare gli a capo unirebbe le righe
        validate: a => (a.delete || a.from || "").includes("\n") ? "tr non può agire sugli a capo: per unire le righe usa paste -sd" : null,
        run: (s, a) => {
            if (s.length === 0) return [];
            const text = s.map(line => {
                if (a.delete) {
                    const del = expandSet(a.delete);
                    return [...line].filter(c => !del.includes(c)).join("");
                }
                const from = expandSet(a.from);
                const to = expandSet(a.to);
                return [...line].map(c => {
                    const i = from.indexOf(c);
                    return i === -1 ? c : to[Math.min(i, to.length - 1)];
                }).join("");
            });
            // Se tr introduce degli a capo, il flusso si spezza in più righe
            return text.join("\n").split("\n");
        }
    },
    sed: {
        params: [
            { key: "pattern", type: "text", label: "regex" },
            { key: "replacement", type: "text", label: "sostituzione", optional: true },
            { key: "global", type: "flag", label: "g" }
        ],
        label: a => {
            const d = sedDelimiter(a);
            return `sed -E 's${d}${a.pattern}${d}${(a.replacement || "")}${d}${a.global ? "g" : ""}'`;
        },
        validate: a => {
            if ((a.pattern + (a.replacement || "")).includes("/") && (a.pattern + (a.replacement || "")).includes("#")) {
                return "non usare insieme / e #";
            }
            if (/\\$/.test((a.replacement || ""))) return "la sostituzione non può finire con \\";
            return sedPatternError(a.pattern);
        },
        run: (s, a) => {
            if (s.length === 0) return [];
            const regex = new RegExp(a.pattern, "g");
            const text = s.map(line => sedSubstitute(line, regex, (a.replacement || ""), a.global));
            // Un \n nella sostituzione spezza la riga, come fa sed
            return text.join("\n").split("\n");
        }
    },
    awk: {
        params: [
            { key: "field", type: "number", label: "$", default: 1 },
            { key: "separator", type: "char", label: "-F", optional: true }
        ],
        label: a => `awk${a.separator ? ` -F'${a.separator}'` : ""} '{print $${a.field}}'`,
        run: (s, a) => s.map(line => awkFields(line, a.separator)[a.field - 1] ?? "")
    },
    paste: {
        params: [{ key: "delim", type: "char", label: "-d", default: "," }],
        label: a => `paste -sd'${a.delim}'`,
        // Unisce tutte le righe in una sola; anche senza input produce una riga (vuota)
        run: (s, a) => [s.join(a.delim)]
    },
    devnull: {
        params: [],
        label: () => "2>/dev/null",
        redirect: true,
        route: "null"
    },
    merge: {
        params: [],
        label: () => "2>&1",
        redirect: true,
        route: "pipe"
    }
};

// Opzione "slot vuoto": lascia passare il flusso invariato
const EMPTY_STEP = { cmd: null, desc: "Nessuna operazione" };

function stepLabel(step) {
    return step.cmd === null ? "[ Vuoto ]" : COMMANDS[step.cmd].label(step.args || {});
}

// Nei livelli una riga di stderr si scrive { err: "testo" }, una di stdout come semplice stringa
function normalizeInput(stdin) {
    return stdin.map(line => typeof line === "string" ? { text: line, fd: 1 } : { text: line.err, fd: 2 });
}

const textsOf = (lines, fd) => lines.filter(line => line.fd === fd).map(line => line.text);

// Stato della pipeline:
// - lines: output del comando corrente (stdout e stderr nell'ordine di scrittura)
// - errRoute: destinazione del suo stderr ("terminal", "null" o "pipe")
// - terminal: stderr dei comandi precedenti già finito sul terminale
function initialState(stdin) {
    return { lines: normalizeInput(stdin), errRoute: "terminal", terminal: [] };
}

// Applica la destinazione dello stderr: cosa entra nella pipe e cosa arriva al terminale
function resolveOutput(state) {
    const piped = state.lines.filter(line => line.fd === 1 || state.errRoute === "pipe");
    return {
        stdout: piped.map(line => line.text),
        toTerminal: state.errRoute === "terminal" ? textsOf(state.lines, 2) : []
    };
}

function applyStep(state, step) {
    if (step.cmd === null) return state;
    const command = COMMANDS[step.cmd];
    if (command.redirect) {
        return { ...state, errRoute: command.route };
    }
    const { stdout, toTerminal } = resolveOutput(state);
    return {
        lines: command.run(stdout, step.args || {}).map(text => ({ text, fd: 1 })),
        errRoute: "terminal",
        terminal: [...state.terminal, ...toTerminal]
    };
}

// A fine pipeline lo stderr dell'ultimo comando segue anch'esso la sua destinazione
function finishState(state) {
    const { stdout, toTerminal } = resolveOutput(state);
    return { output: stdout, stderr: [...state.terminal, ...toTerminal] };
}

// Righe come appaiono dopo uno step: lo stderr cestinato sparisce, quello unito diventa stdout
function visibleLines(state) {
    return state.lines
        .filter(line => line.fd === 1 || state.errRoute !== "null")
        .map(line => ({ text: line.text, fd: line.fd === 2 && state.errRoute === "pipe" ? 1 : line.fd }));
}

// Esegue gli step e restituisce stdout finale, stderr arrivato al terminale e lo stato dopo ogni step
function executePipeline(stdin, steps) {
    let state = initialState(stdin);
    const trace = [];
    for (const step of steps) {
        state = applyStep(state, step);
        trace.push({ lines: visibleLines(state), terminal: [...state.terminal] });
    }
    return { ...finishState(state), trace };
}

function streamsEqual(a, b) {
    return a.length === b.length && a.every((line, i) => line === b[i]);
}

// Livello risolto: stdout identico al target e sul terminale solo lo stderr previsto (di norma nessuno)
function isSolved(lvl, result) {
    return streamsEqual(result.output, lvl.target) && streamsEqual(result.stderr, lvl.targetStderr || []);
}
