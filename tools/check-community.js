// Verifica i livelli della galleria della community: ogni livello supera la convalida dei link
// condivisi (share.js), ha un id unico, e la sua soluzione ottimale dà in bash lo stdout atteso.
// Uso: node tools/check-community.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { runBash } = require("./bash");

const root = path.join(__dirname, "..");
const context = vm.createContext({ TextEncoder, TextDecoder, btoa, atob });
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "command-form.js", "share.js", "community.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext(`COMMUNITY_LEVELS.map(entry => {
    const error = sharedLevelError(entry.level);
    const solution = error ? null : solveLevel(entry.level);
    return {
        id: entry.id, author: entry.author, title: entry.level.title, error,
        fields: typeof entry.id === "string" && /^c-[a-z0-9-]+$/.test(entry.id) && typeof entry.author === "string" && entry.author.trim() !== "" && /^\\d{4}-\\d{2}-\\d{2}$/.test(entry.added || ""),
        par: solution && solution.par, optimalCount: solution && solution.optimalCount,
        line: solution ? buildShellLine(entry.level.stdin, solution.optimalSteps[0]) : null,
        target: entry.level.target, targetStderr: entry.level.targetStderr || []
    };
})`, context);

let failures = 0;
const ids = new Set();
for (const r of report) {
    const problems = [];
    if (r.error) problems.push(r.error);
    if (!r.fields) problems.push("id (c-...), autore o data mancanti");
    if (ids.has(r.id)) problems.push("id ripetuto");
    ids.add(r.id);
    if (r.line) {
        const real = runBash(r.line);
        if (JSON.stringify(real.stdout) !== JSON.stringify(r.target) || JSON.stringify(real.stderr) !== JSON.stringify(r.targetStderr)) problems.push("bash dà un output diverso");
    }
    if (problems.length) failures++;
    console.log(`${problems.length ? "✗" : "✓"} ${r.id} · ${r.title} (di ${r.author}) · par ${r.par}, ${r.optimalCount} soluzioni ottimali${problems.length ? " · " + problems.join(", ") : ""}`);
}
console.log(`${report.length - failures}/${report.length} livelli della community validi`);
if (failures) process.exit(1);
