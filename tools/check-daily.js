// Verifica la sfida del giorno su un intervallo di date (e un campione di livelli della Maratona):
// ogni livello è deterministico, senza scorciatoie, e la sua soluzione dà in bash lo stdout atteso.
// Uso: node tools/check-daily.js [giorni=366] [data iniziale AAAA-MM-GG, predefinita oggi]
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "daily.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const days = Number(process.argv[2]) || 366;
const start = process.argv[3] || vm.runInContext("dateKey()", context);
const toLines = text => text === "" ? [] : text.replace(/\n$/, "").split("\n");

const check = vm.runInContext(`key => {
    const t0 = Date.now();
    const level = generateDaily(key);
    const ms = Date.now() - t0;
    const again = generateDaily(key);
    const solution = solveLevel(level);
    const options = level.allowedCommands;
    const steps = solution.optimal[0].split(" | ").map(label => options.find(o => stepLabel(o) === label));
    return {
        title: level.title,
        difficulty: level.daily.difficulty,
        deterministic: JSON.stringify(level) === JSON.stringify(again),
        par: solution.par,
        optimalCount: solution.optimalCount,
        slots: levelSlots(level),
        line: buildShellLine(level.stdin, steps),
        target: level.target,
        ms
    };
}`, context);

const nextKey = vm.runInContext(`key => {
    const [y, m, d] = key.split("-").map(Number);
    return dateKey(new Date(y, m - 1, d + 1));
}`, context);

let failures = 0;
let slowest = 0;
const recipes = {};
let key = start;
for (let i = 0; i < days; i++, key = nextKey(key)) {
    const r = check(key);
    recipes[`${r.difficulty} / ${r.title}`] = (recipes[`${r.difficulty} / ${r.title}`] || 0) + 1;
    slowest = Math.max(slowest, r.ms);
    const real = spawnSync("bash", ["-c", r.line], { env: { PATH: process.env.PATH } });
    const problems = [];
    if (!r.deterministic) problems.push("non deterministico");
    if (r.par > r.slots) problems.push("par oltre gli slot");
    if (r.optimalCount > 3) problems.push(`${r.optimalCount} soluzioni ottimali`);
    if (JSON.stringify(toLines(real.stdout.toString())) !== JSON.stringify(r.target)) problems.push("bash dà un output diverso");
    if (real.stderr.length) problems.push("bash scrive su stderr");
    if (problems.length) {
        failures++;
        console.log(`${key} ${r.title}: ${problems.join(", ")}\n  ${r.line}`);
    }
}

// Livelli della Maratona: stesse ricette, semi casuali, ogni difficoltà
const checkMarathon = vm.runInContext(`(seed, round, difficulty) => {
    const level = generateMarathonLevel(seed, round, difficulty);
    const again = generateMarathonLevel(seed, round, difficulty);
    const solution = solveLevel(level);
    const steps = solution.optimal[0].split(" | ").map(label => level.allowedCommands.find(o => stepLabel(o) === label));
    return { deterministic: JSON.stringify(level) === JSON.stringify(again), par: solution.par, slots: levelSlots(level),
             line: buildShellLine(level.stdin, steps), target: level.target, title: level.title };
}`, context);
let marathonChecked = 0;
for (let game = 0; game < 60; game++) {
    for (const difficulty of ["facile", "media", "difficile"]) {
        const r = checkMarathon(`verifica${game}`, game, difficulty);
        const real = spawnSync("bash", ["-c", r.line], { env: { PATH: process.env.PATH } });
        marathonChecked++;
        if (!r.deterministic || r.par > r.slots || JSON.stringify(toLines(real.stdout.toString())) !== JSON.stringify(r.target)) {
            failures++;
            console.log(`maratona ${game} ${difficulty} ${r.title}: non valido\n  ${r.line}`);
        }
    }
}
console.log(`${marathonChecked} livelli della Maratona controllati`);

console.table(recipes);
console.log(`${days + marathonChecked - failures}/${days + marathonChecked} livelli generati validi: ${days} sfide dal ${start} (generazione più lenta: ${slowest} ms) e ${marathonChecked} della Maratona`);
if (failures) process.exit(1);
