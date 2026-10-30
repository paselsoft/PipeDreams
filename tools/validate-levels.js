// Verifica da riga di comando che tutti i livelli siano risolvibili.
// Uso: node tools/validate-levels.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext("validateLevels(levels)", context);
console.table(report);
const broken = report.filter(r => r.par === null);
if (broken.length) {
    console.error(`Livelli irrisolvibili: ${broken.map(r => r.livello).join(", ")}`);
    process.exit(1);
}
