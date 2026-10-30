// Registro dei comandi Unix simulati.
// Ogni comando è una funzione pura: (stream: string[], args) => string[]
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
    // Provvisorio: scarta le righe uguali a `match` finché stdout e stderr non saranno flussi separati
    devnull: {
        label: () => "2>/dev/null",
        run: (s, a) => s.filter(line => line !== a.match)
    }
};

// Opzione "slot vuoto": lascia passare il flusso invariato
const EMPTY_STEP = { cmd: null, desc: "Nessuna operazione" };

function stepLabel(step) {
    return step.cmd === null ? "[ Vuoto ]" : COMMANDS[step.cmd].label(step.args || {});
}

// Esegue una sequenza di step e restituisce l'output finale e lo stato dopo ogni step
function executePipeline(stdin, steps) {
    let stream = [...stdin];
    const trace = [];
    for (const step of steps) {
        if (step.cmd !== null) {
            stream = COMMANDS[step.cmd].run(stream, step.args || {});
        }
        trace.push([...stream]);
    }
    return { output: stream, trace };
}

function streamsEqual(a, b) {
    return a.length === b.length && a.every((line, i) => line === b[i]);
}
