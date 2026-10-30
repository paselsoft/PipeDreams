// Solver a forza bruta: prova ogni combinazione di comandi negli slot.
// Con n comandi e k slot le combinazioni sono (n+1)^k (es. 5^4 = 625), quindi è istantaneo.

function slotOptions(lvl) {
    return [EMPTY_STEP, ...lvl.allowedCommands];
}

function solveLevel(lvl, slotCount = SLOT_COUNT) {
    const options = slotOptions(lvl);
    const total = options.length ** slotCount;
    // Le soluzioni sono deduplicate per sequenza di comandi, ignorando la posizione degli slot vuoti
    const solutions = new Map();

    for (let combo = 0; combo < total; combo++) {
        const indices = [];
        let rest = combo;
        for (let i = 0; i < slotCount; i++) {
            indices.push(rest % options.length);
            rest = Math.floor(rest / options.length);
        }
        const used = indices.filter(idx => idx !== 0);
        const key = used.join(",");
        if (solutions.has(key)) continue;

        const { output } = executePipeline(lvl.stdin, indices.map(idx => options[idx]));
        if (streamsEqual(output, lvl.target)) {
            solutions.set(key, used.map(idx => stepLabel(options[idx])).join(" | "));
        }
    }

    const sequences = [...solutions.entries()].map(([key, text]) => ({
        length: key === "" ? 0 : key.split(",").length,
        text
    }));
    const par = sequences.length ? Math.min(...sequences.map(s => s.length)) : null;

    return {
        solvable: sequences.length > 0,
        par,
        optimal: sequences.filter(s => s.length === par).map(s => s.text),
        solutionCount: sequences.length
    };
}

function validateLevels(levelList, slotCount = SLOT_COUNT) {
    return levelList.map((lvl, i) => {
        const result = solveLevel(lvl, slotCount);
        const problems = [];
        if (!result.solvable) problems.push("IRRISOLVIBILE");
        if (result.par === 0) problems.push("già risolto senza comandi");
        if (result.optimal.length > 1) problems.push(`${result.optimal.length} soluzioni ottimali`);
        return {
            livello: i + 1,
            titolo: lvl.title,
            par: result.par,
            soluzioni: result.solutionCount,
            ottimale: result.optimal[0] || "-",
            avvisi: problems.join(", ") || "ok"
        };
    });
}
