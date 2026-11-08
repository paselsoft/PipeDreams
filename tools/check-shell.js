// Verifica che la simulazione coincida con la shell reale: per ogni livello esegue in bash
// la soluzione ottimale e N pipeline casuali, confrontando stdout e stderr con il gioco;
// poi fa lo stesso con ogni esempio del manuale.
// Richiede bash e GNU coreutils (Linux). Uso: node tools/check-shell.js [N=100]
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { runBash } = require("./bash");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "manual.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const runs = Number(process.argv[2]) || 100;

// Genera la pipeline nel contesto del gioco: la prima prova di ogni livello è la soluzione ottimale
const simulate = vm.runInContext(`(index, useSolution) => {
    const lvl = levels[index];
    const options = slotOptions(lvl);
    const steps = useSolution
        ? referenceSolution(lvl)
        : Array.from({ length: levelSlots(lvl) }, () => options[Math.floor(Math.random() * options.length)]);
    const result = executePipeline(lvl.stdin, steps);
    return { line: buildShellLine(lvl.stdin, steps), output: result.output, stderr: result.stderr };
}`, context);

let total = 0;
let failures = 0;
const levelCount = vm.runInContext("levels.length", context);
for (let index = 0; index < levelCount; index++) {
    for (let run = 0; run < runs; run++) {
        const sim = simulate(index, run === 0);
        const real = runBash(sim.line);
        const output = real.stdout;
        const stderr = real.stderr;
        total++;
        if (JSON.stringify(output) !== JSON.stringify(sim.output) || JSON.stringify(stderr) !== JSON.stringify(sim.stderr)) {
            failures++;
            console.log(`Livello ${index + 1}: ${sim.line}`);
            console.log(`  gioco: ${JSON.stringify(sim.output)} stderr ${JSON.stringify(sim.stderr)}`);
            console.log(`  bash:  ${JSON.stringify(output)} stderr ${JSON.stringify(stderr)}`);
        }
    }
}

// Esempi del manuale
const examples = vm.runInContext(`MANUAL.flatMap(entry => entry.examples.map(example => {
    const result = executePipeline(example.input, example.steps);
    return { name: entry.id + " / " + example.title, line: buildShellLine(example.input, example.steps),
             output: result.output, stderr: result.stderr };
}))`, context);
for (const sim of examples) {
    const real = runBash(sim.line);
    const output = real.stdout;
    const stderr = real.stderr;
    total++;
    if (JSON.stringify(output) !== JSON.stringify(sim.output) || JSON.stringify(stderr) !== JSON.stringify(sim.stderr)) {
        failures++;
        console.log(`Manuale, ${sim.name}: ${sim.line}`);
        console.log(`  gioco: ${JSON.stringify(sim.output)} stderr ${JSON.stringify(sim.stderr)}`);
        console.log(`  bash:  ${JSON.stringify(output)} stderr ${JSON.stringify(stderr)}`);
    }
}

// Pipeline casuali sui comandi con più casi limite (chiavi di sort, grep -o, uniq -d, cut -c,
// tac, rev) con input casuali: campi mancanti, numeri di lunghezze diverse, righe vuote, parità
const fuzz = vm.runInContext(`(seed) => {
    let state = seed;
    const rand = n => { state = (state * 1103515245 + 12345) % 2147483648; return state % n; };
    const pickOne = list => list[rand(list.length)];
    const words = ["anna", "luca", "b", "a", "10", "9", "100", "x,y", "1,b,3", "c,2", "z,10,a", ",", "", "a,b", "5,5", "ab ab", "abab", " 3", "-1"];
    const pool = [
        { cmd: "sort", args: { separator: ",", key: 1 } }, { cmd: "sort", args: { separator: ",", key: 2 } },
        { cmd: "sort", args: { separator: ",", key: 2, numeric: true } }, { cmd: "sort", args: { separator: ",", key: 3, numeric: true, reverse: true } },
        { cmd: "sort", args: { separator: ",", key: 2, reverse: true } }, { cmd: "sort", args: { numeric: true } }, { cmd: "sort" },
        { cmd: "grep", args: { pattern: "ab", only: true } }, { cmd: "grep", args: { pattern: "a", only: true } }, { cmd: "grep", args: { pattern: ",", only: true } },
        { cmd: "uniq", args: { repeated: true } }, { cmd: "uniq", args: { repeated: true, count: true } }, { cmd: "uniq" },
        { cmd: "cutc", args: { from: 1, to: 2 } }, { cmd: "cutc", args: { from: 2, to: 2 } }, { cmd: "cutc", args: { from: 3, to: 9 } },
        { cmd: "tac" }, { cmd: "rev" }, { cmd: "wc" }, { cmd: "head", args: { n: 2 } },
        // Atto VII: comm e join con file ordinati, nl, tee (anche con 2>&1 dopo, per l'ordine dello stderr)
        { cmd: "comm", args: { mode: "12", file: "f.txt", lines: ["", "10", "a", "a,b", "b"] } },
        { cmd: "comm", args: { mode: "23", file: "f.txt", lines: ["9", "a", "anna", "b"] } },
        { cmd: "comm", args: { mode: "13", file: "f.txt", lines: [",", "a", "c,2", "luca"] } },
        { cmd: "join", args: { file: "f.txt", lines: ["1,b,3 x", "a 1", "a 2", "b 3", "z,10,a 4"] } },
        { cmd: "join", args: { separator: ",", file: "f.txt", lines: ["", "1,x", "a,y", "c,z", "x,w"] } },
        { cmd: "nl" }, { cmd: "nl", args: { all: true, width: 2, separator: ". " } }, { cmd: "nl", args: { width: 1, separator: ":" } },
        { cmd: "tee", args: { file: "/dev/stderr" } }, { cmd: "tee", args: { file: "copia.txt" } }, { cmd: "merge" }, { cmd: "devnull" }
    ];
    const input = Array.from({ length: 1 + rand(7) }, () => pickOne(words));
    const steps = Array.from({ length: 1 + rand(4) }, () => pickOne(pool));
    const result = executePipeline(input, steps);
    return { line: buildShellLine(input, steps), output: result.output, stderr: result.stderr };
}`, context);
// Atto VIII: tr -s, fold, xargs (virgolette chiuse, parole come -n che echo prende per opzioni), sort -h
const fuzz8 = vm.runInContext(`(seed) => {
    let state = seed;
    const rand = n => { state = (state * 1103515245 + 12345) % 2147483648; return state % n; };
    const pickOne = list => list[rand(list.length)];
    const words = ["a", "bb  cc", "  dd", "e\tf", "hello world foo", "1.5K", "2K", "900", "1G", "1.2M", "512", "0", "", "-1K", "3k",
        "10M  /var", " 4G /home", "x 1K", "'a b' c", "\\"q r\\"", "-n", "-e x", "-E", "a\\\\ b", "zz", "12 34 56 78"];
    const pool = [
        { cmd: "squeeze", args: { set: " " } }, { cmd: "squeeze", args: { set: "a-c" } },
        { cmd: "fold", args: { width: 1 } }, { cmd: "fold", args: { width: 4 } }, { cmd: "fold", args: { width: 5, spaces: true } }, { cmd: "fold", args: { width: 9, spaces: true } },
        { cmd: "xargs" }, { cmd: "xargs", args: { n: 1 } }, { cmd: "xargs", args: { n: 2 } }, { cmd: "xargs", args: { n: 3 } },
        { cmd: "sort", args: { human: true } }, { cmd: "sort", args: { human: true, reverse: true } },
        { cmd: "sort", args: { human: true, separator: " ", key: 2 } }, { cmd: "sort", args: { human: true, separator: " ", key: 1, reverse: true } },
        { cmd: "cut", args: { delim: " ", field: 1 } }, { cmd: "awk", args: { field: 2 } }, { cmd: "tac" }, { cmd: "merge" }
    ];
    const input = Array.from({ length: 1 + rand(6) }, () => pickOne(words));
    const steps = Array.from({ length: 1 + rand(3) }, () => pickOne(pool));
    const result = executePipeline(input, steps);
    return { line: buildShellLine(input, steps), output: result.output, stderr: result.stderr };
}`, context);

let fuzzed = 0;
for (let seed = 1; seed <= runs * 5; seed++) {
    for (const generate of [fuzz, fuzz8]) {
    const sim = generate(seed);
    const real = runBash(sim.line);
    const output = real.stdout;
    const stderr = real.stderr;
    total++;
    fuzzed++;
    if (JSON.stringify(output) !== JSON.stringify(sim.output) || JSON.stringify(stderr) !== JSON.stringify(sim.stderr)) {
        failures++;
        console.log(`Casuale ${seed}: ${sim.line}`);
        console.log(`  gioco: ${JSON.stringify(sim.output)} stderr ${JSON.stringify(sim.stderr)}`);
        console.log(`  bash:  ${JSON.stringify(output)} stderr ${JSON.stringify(stderr)}`);
    }
    }
}

console.log(`${total - failures}/${total} pipeline identiche a bash (${examples.length} esempi del manuale, ${fuzzed} pipeline casuali)`);
if (failures) process.exit(1);
