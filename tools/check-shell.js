// Verifica che la simulazione coincida con la shell reale: per ogni livello esegue in bash
// la soluzione ottimale e N pipeline casuali, confrontando stdout e stderr con il gioco.
// Richiede bash e GNU coreutils (Linux). Uso: node tools/check-shell.js [N=100]
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const runs = Number(process.argv[2]) || 100;
const toLines = text => text === "" ? [] : text.replace(/\n$/, "").split("\n");

// Genera la pipeline nel contesto del gioco: la prima prova di ogni livello è la soluzione ottimale
const simulate = vm.runInContext(`(index, useSolution) => {
    const lvl = levels[index];
    const options = slotOptions(lvl);
    const steps = useSolution
        ? solveLevel(lvl).optimal[0].split(" | ").map(label => options.find(o => stepLabel(o) === label))
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
        const real = spawnSync("bash", ["-c", sim.line], { env: { PATH: process.env.PATH } });
        const output = toLines(real.stdout.toString());
        const stderr = toLines(real.stderr.toString());
        total++;
        if (JSON.stringify(output) !== JSON.stringify(sim.output) || JSON.stringify(stderr) !== JSON.stringify(sim.stderr)) {
            failures++;
            console.log(`Livello ${index + 1}: ${sim.line}`);
            console.log(`  gioco: ${JSON.stringify(sim.output)} stderr ${JSON.stringify(sim.stderr)}`);
            console.log(`  bash:  ${JSON.stringify(output)} stderr ${JSON.stringify(stderr)}`);
        }
    }
}

console.log(`${total - failures}/${total} pipeline identiche a bash`);
if (failures) process.exit(1);
