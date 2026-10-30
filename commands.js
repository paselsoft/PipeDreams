// Registro dei comandi Unix simulati.
// Comandi normali: run(stdout: string[], args) => string[]. Leggono solo stdout; lo stderr
// in sospeso del comando precedente non attraversa la pipe e finisce sul terminale.
// Reindirizzamenti (redirect: true): apply(lines, args) => lines, agiscono sui flussi del
// comando a cui sono attaccati, cioè l'ultimo comando prima di loro (o il programma sorgente).
// label(args) restituisce la sintassi mostrata al giocatore.
const COMMANDS = {
    grep: {
        label: a => `grep${a.invert ? " -v" : ""} '${a.pattern}'`,
        run: (s, a) => s.filter(line => line.includes(a.pattern) !== Boolean(a.invert))
    },
    sort: {
        label: a => `sort${a.reverse ? " -r" : ""}${a.numeric ? " -n" : ""}`,
        run: (s, a) => {
            const sorted = [...s].sort(a.numeric ? (x, y) => parseFloat(x) - parseFloat(y) : undefined);
            return a.reverse ? sorted.reverse() : sorted;
        }
    },
    uniq: {
        label: () => "uniq",
        run: s => s.filter((line, i) => i === 0 || line !== s[i - 1])
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

// Esegue gli step e restituisce stdout finale, stderr arrivato al terminale e lo stato dopo ogni step
function executePipeline(stdin, steps) {
    let lines = normalizeInput(stdin);
    const terminal = [];
    const trace = [];
    for (const step of steps) {
        if (step.cmd !== null) {
            const command = COMMANDS[step.cmd];
            if (command.redirect) {
                lines = command.apply(lines, step.args || {});
            } else {
                terminal.push(...textsOf(lines, 2));
                lines = command.run(textsOf(lines, 1), step.args || {}).map(text => ({ text, fd: 1 }));
            }
        }
        trace.push({ lines: lines.map(line => ({ ...line })), terminal: [...terminal] });
    }
    terminal.push(...textsOf(lines, 2));
    return { output: textsOf(lines, 1), stderr: terminal, trace };
}

function streamsEqual(a, b) {
    return a.length === b.length && a.every((line, i) => line === b[i]);
}

// Livello risolto: stdout identico al target e sul terminale solo lo stderr previsto (di norma nessuno)
function isSolved(lvl, result) {
    return streamsEqual(result.output, lvl.target) && streamsEqual(result.stderr, lvl.targetStderr || []);
}
