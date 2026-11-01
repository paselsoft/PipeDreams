// Verifica la sfida del giorno su un intervallo di date: ogni giorno genera un livello
// deterministico, senza scorciatoie, la cui soluzione dà in bash lo stdout atteso.
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

console.table(recipes);
console.log(`${days - failures}/${days} sfide valide dal ${start} (generazione più lenta: ${slowest} ms)`);
if (failures) process.exit(1);
