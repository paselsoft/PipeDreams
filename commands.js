// Registro dei comandi Unix simulati.
// Comandi normali: run(stdout: string[], args) => string[]. Leggono solo stdout; lo stderr
// in sospeso del comando precedente non attraversa la pipe e finisce sul terminale.
// Reindirizzamenti (redirect: true): apply(lines, args) => lines, agiscono sui flussi del
// comando a cui sono attaccati, cioè l'ultimo comando prima di loro (o il programma sorgente).
// label(args) restituisce la sintassi mostrata al giocatore.

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

const COMMANDS = {
    grep: {
        label: a => `grep${a.invert ? " -v" : ""} '${a.pattern}'`,
        run: (s, a) => s.filter(line => line.includes(a.pattern) !== Boolean(a.invert))
    },
    sort: {
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
        label: () => "sed 's/.*/\\U&/'",
        run: s => s.map(line => line.toUpperCase())
    },
    head: {
        label: a => `head -n ${a.n}`,
        run: (s, a) => s.slice(0, a.n)
    },
    tail: {
        label: a => `tail -n ${a.n}`,
        run: (s, a) => s.slice(-a.n)
    },
    wc: {
        label: () => "wc -l",
        run: s => [String(s.length)]
    },
    cut: {
        label: a => `cut -d'${a.delim}' -f${a.field}`,
        // Le righe senza delimitatore passano intere, come fa cut senza -s
        run: (s, a) => s.map(line => line.includes(a.delim) ? (line.split(a.delim)[a.field - 1] ?? "") : line)
    },
    tr: {
        label: a => a.delete ? `tr -d ${shellQuote(a.delete)}` : `tr ${shellQuote(a.from)} ${shellQuote(a.to)}`,
        run: (s, a) => {
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
    devnull: {
        label: () => "2>/dev/null",
        redirect: true,
        apply: lines => lines.filter(line => line.fd !== 2)
    },
    merge: {
        label: () => "2>&1",
        redirect: true,
        apply: lines => lines.map(line => ({ text: line.text, fd: 1 }))
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

// Stato della pipeline: righe in transito (stdout e stderr in sospeso) e stderr già finito sul terminale
function initialState(stdin) {
    return { lines: normalizeInput(stdin), terminal: [] };
}

function applyStep(state, step) {
    if (step.cmd === null) return state;
    const command = COMMANDS[step.cmd];
    if (command.redirect) {
        return { lines: command.apply(state.lines, step.args || {}), terminal: state.terminal };
    }
    return {
        lines: command.run(textsOf(state.lines, 1), step.args || {}).map(text => ({ text, fd: 1 })),
        terminal: [...state.terminal, ...textsOf(state.lines, 2)]
    };
}

// A fine pipeline lo stderr ancora in sospeso arriva anch'esso al terminale
function finishState(state) {
    return { output: textsOf(state.lines, 1), stderr: [...state.terminal, ...textsOf(state.lines, 2)] };
}

// Esegue gli step e restituisce stdout finale, stderr arrivato al terminale e lo stato dopo ogni step
function executePipeline(stdin, steps) {
    let state = initialState(stdin);
    const trace = [];
    for (const step of steps) {
        state = applyStep(state, step);
        trace.push({ lines: state.lines.map(line => ({ ...line })), terminal: [...state.terminal] });
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
