// Verifica da riga di comando che tutti i livelli siano risolvibili
// e che il manuale abbia una scheda per ogni comando.
// Uso: node tools/validate-levels.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "manual.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext("validateLevels(levels)", context);
console.table(report);
const broken = report.filter(r => r.par === null);
if (broken.length) {
    console.error(`Livelli irrisolvibili: ${broken.map(r => r.livello).join(", ")}`);
    process.exit(1);
}

// Ogni comando del registro deve essere spiegato da almeno una scheda, e gli esempi devono essere validi
const problems = vm.runInContext(`(() => {
    const problems = [];
    const covered = new Set(MANUAL.flatMap(entry => entry.cmds));
    for (const cmd of Object.keys(COMMANDS)) {
        if (!covered.has(cmd)) problems.push("comando senza scheda nel manuale: " + cmd);
    }
    for (const entry of MANUAL) {
        for (const example of entry.examples) {
            for (const step of example.steps) {
                const command = COMMANDS[step.cmd];
                const error = !command ? "comando sconosciuto " + step.cmd
                    : command.validate && command.validate(step.args || {});
                if (error) problems.push(entry.id + " / " + example.title + ": " + error);
            }
        }
    }
    return problems;
})()`, context);
if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
}
console.log(`Manuale: ${vm.runInContext("MANUAL.length", context)} schede, tutti i comandi coperti`);
