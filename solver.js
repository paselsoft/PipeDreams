// Solver a ricerca in ampiezza sugli stati del flusso.
// Ogni strato contiene gli stati raggiungibili con esattamente N comandi; le sequenze che
// portano allo stesso stato vengono unite, e uno stato già raggiunto con meno comandi viene
// scartato (da lì nessuna sequenza può essere ottimale). Ci si ferma al primo strato che
// risolve il livello: N è il par e le sequenze che arrivano lì sono le soluzioni ottimali.

// Quante sequenze ottimali conservare come esempio
const MAX_EXAMPLES = 5;

function levelSlots(lvl) {
    return lvl.slots || SLOT_COUNT;
}

function slotOptions(lvl) {
    return [EMPTY_STEP, ...lvl.allowedCommands];
}

const stateKey = state => JSON.stringify(state);

function solveLevel(lvl, slotCount = levelSlots(lvl)) {
    const start = initialState(lvl.stdin);
    let layer = new Map([[stateKey(start), { state: start, count: 1, examples: [[]] }]]);
    const seen = new Set(layer.keys());

    for (let depth = 0; depth <= slotCount; depth++) {
        const solved = [...layer.values()].filter(node => isSolved(lvl, finishState(node.state)));
        if (solved.length) {
            return {
                solvable: true,
                par: depth,
                optimalCount: solved.reduce((sum, node) => sum + node.count, 0),
                optimal: solved.flatMap(node => node.examples)
                    .slice(0, MAX_EXAMPLES)
                    .map(seq => seq.map(stepLabel).join(" | "))
            };
        }

        const next = new Map();
        for (const node of layer.values()) {
            for (const step of lvl.allowedCommands) {
                const state = applyStep(node.state, step);
                const key = stateKey(state);
                if (seen.has(key)) continue;
                const entry = next.get(key) || { state, count: 0, examples: [] };
                entry.count += node.count;
                for (const seq of node.examples) {
                    if (entry.examples.length < MAX_EXAMPLES) entry.examples.push([...seq, step]);
                }
                next.set(key, entry);
            }
        }
        next.forEach((_, key) => seen.add(key));
        layer = next;
    }

    return { solvable: false, par: null, optimalCount: 0, optimal: [] };
}

function validateLevels(levelList) {
    return levelList.map((lvl, i) => {
        const result = solveLevel(lvl);
        const problems = [];
        if (!result.solvable) problems.push("IRRISOLVIBILE");
        if (result.par === 0) problems.push("già risolto senza comandi");
        if (result.optimalCount > 1) problems.push(`${result.optimalCount} soluzioni ottimali`);
        return {
            livello: i + 1,
            titolo: lvl.title,
            slot: levelSlots(lvl),
            par: result.par,
            ottimale: result.optimal[0] || "-",
            avvisi: problems.join(", ") || "ok"
        };
    });
}
