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

// --- Tipi di livello oltre a "componi la pipeline" ---
// type "debug": start è la griglia iniziale (indici in slotOptions), da correggere cambiando
//   al massimo maxChanges celle; type "quiz": start è la pipeline da leggere e wrong elenca
//   pipeline alternative ({ steps, why }) i cui output fanno da risposte sbagliate;
// locked ({ slot: indice }) blocca alcune celle su un comando: la soluzione deve rispettarle.

const gridSteps = (lvl, grid) => grid.map(index => slotOptions(lvl)[index]);

// Correzioni di un livello debug che cambiano una sola cella. Due correzioni che producono la
// stessa sequenza di comandi (es. lo stesso comando in due celle vuote diverse) contano una volta.
function debugFixes(lvl) {
    const options = slotOptions(lvl);
    const fixes = new Map();
    lvl.start.forEach((current, cell) => {
        options.forEach((_, choice) => {
            if (choice === current) return;
            const grid = [...lvl.start];
            grid[cell] = choice;
            const key = grid.filter(index => index !== 0).join(",");
            if (!fixes.has(key) && isSolved(lvl, executePipeline(lvl.stdin, gridSteps(lvl, grid)))) fixes.set(key, { cell, choice, grid });
        });
    });
    return [...fixes.values()];
}

// Risposte di un quiz: l'output della pipeline e quelli delle alternative sbagliate
function quizAnswers(lvl) {
    const correct = executePipeline(lvl.stdin, gridSteps(lvl, lvl.start)).output;
    return [
        { output: correct, correct: true },
        ...lvl.wrong.map(alt => ({ output: executePipeline(lvl.stdin, alt.steps).output, correct: false, steps: alt.steps, why: alt.why }))
    ];
}

// Solver per griglie con celle bloccate: programmazione dinamica cella per cella.
// Per ogni stato del flusso conserva il minimo numero di comandi scelti dal giocatore
// (le celle bloccate non contano) e una griglia d'esempio.
function solveLocked(lvl) {
    const options = slotOptions(lvl);
    const locked = lvl.locked || {};
    let layer = new Map([[stateKey(initialState(lvl.stdin)), { state: initialState(lvl.stdin), used: 0, grid: [] }]]);
    for (let slot = 0; slot < levelSlots(lvl); slot++) {
        const next = new Map();
        const choices = locked[slot] !== undefined ? [locked[slot]] : options.map((_, i) => i);
        for (const node of layer.values()) {
            for (const choice of choices) {
                const state = applyStep(node.state, options[choice]);
                const used = node.used + (choice !== 0 && locked[slot] === undefined ? 1 : 0);
                const key = stateKey(state);
                const existing = next.get(key);
                if (!existing || used < existing.used) next.set(key, { state, used, grid: [...node.grid, choice] });
            }
        }
        layer = next;
    }
    const solved = [...layer.values()].filter(node => isSolved(lvl, finishState(node.state)));
    if (!solved.length) return { solvable: false, par: null, optimalCount: 0, optimal: [] };
    const par = Math.min(...solved.map(node => node.used));
    const best = solved.filter(node => node.used === par);
    return {
        solvable: true,
        par,
        optimalCount: best.length,
        optimal: best.slice(0, MAX_EXAMPLES).map(node => gridSteps(lvl, node.grid).filter(step => step.cmd !== null).map(stepLabel).join(" | ")),
        grids: best.map(node => node.grid)
    };
}

// Analisi di un livello qualunque, con lo stesso formato di solveLevel
function analyzeLevel(lvl) {
    if (lvl.type === "debug") {
        const fixes = debugFixes(lvl);
        const startSolved = isSolved(lvl, executePipeline(lvl.stdin, gridSteps(lvl, lvl.start)));
        return {
            solvable: fixes.length > 0 && !startSolved, par: null, optimalCount: fixes.length, startSolved,
            optimal: fixes.slice(0, MAX_EXAMPLES).map(fix => `cella ${fix.cell + 1} → ${stepLabel(slotOptions(lvl)[fix.choice])}`)
        };
    }
    if (lvl.type === "quiz") {
        const answers = quizAnswers(lvl);
        const distinct = new Set(answers.map(answer => JSON.stringify(answer.output))).size === answers.length;
        return { solvable: distinct, par: null, optimalCount: 1, distinct, optimal: [answers[0].output.join(", ")] };
    }
    return lvl.locked ? solveLocked(lvl) : solveLevel(lvl);
}

// Una soluzione di riferimento (griglia completa) per ogni tipo, usata dalle verifiche con bash
function referenceSolution(lvl) {
    if (lvl.type === "debug") return gridSteps(lvl, debugFixes(lvl)[0].grid);
    if (lvl.type === "quiz") return gridSteps(lvl, lvl.start);
    if (lvl.locked) return gridSteps(lvl, solveLocked(lvl).grids[0]);
    const options = slotOptions(lvl);
    return solveLevel(lvl).optimal[0].split(" | ").map(label => options.find(option => stepLabel(option) === label));
}

function validateLevels(levelList) {
    return levelList.map((lvl, i) => {
        const result = analyzeLevel(lvl);
        const problems = [];
        if (lvl.type === "debug") {
            if (result.startSolved) problems.push("la pipeline iniziale è già corretta");
            else if (!result.solvable) problems.push("IRRISOLVIBILE con una modifica");
            else if (result.optimalCount > 1) problems.push(`${result.optimalCount} correzioni possibili`);
        } else if (lvl.type === "quiz") {
            if (!result.distinct) problems.push("IRRISOLVIBILE: risposte con lo stesso output");
        } else {
            if (!result.solvable) problems.push("IRRISOLVIBILE");
            if (result.par === 0) problems.push("già risolto senza comandi");
            if (result.optimalCount > 1) problems.push(`${result.optimalCount} soluzioni ottimali`);
        }
        return {
            livello: i + 1,
            titolo: lvl.title,
            tipo: lvl.type || (lvl.locked ? "bloccate" : "componi"),
            par: result.par,
            ottimale: result.optimal[0] || "-",
            avvisi: problems.join(", ") || "ok"
        };
    });
}
