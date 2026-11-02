// Verifica l'interprete della modalità terminale:
// 1) ogni comando di livelli, sfide ed esempi del manuale, scritto con la sua sintassi di shell,
//    viene riletto esattamente nello stesso comando;
// 2) le pipeline complete delle soluzioni si rileggono nei passi originali;
// 3) le varianti di scrittura comuni (opzioni unite, virgolette diverse) sono riconosciute;
// 4) gli errori tipici producono un messaggio invece di un risultato.
// Uso: node tools/check-terminal.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "manual.js", "daily.js", "terminal.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext(`(() => {
    const failures = [];
    // Forma canonica di un passo: solo cmd e args non vuoti
    const canon = step => JSON.stringify(Object.keys(step.args || {}).length ? { cmd: step.cmd, args: step.args } : { cmd: step.cmd });
    const same = (a, b) => a.length === b.length && a.every((step, i) => canon(step) === canon(b[i]));

    // 1) ogni comando singolo
    const steps = [];
    for (const lvl of levels) steps.push(...lvl.allowedCommands, ...(lvl.wrong || []).flatMap(w => w.steps));
    for (const entry of MANUAL) for (const example of entry.examples) steps.push(...example.steps);
    for (let d = 0; d < 60; d++) steps.push(...generateDaily(dateKey(new Date(2026, 10, 1 + d))).allowedCommands);
    let single = 0;
    for (const step of steps) {
        const text = stepLabel(step);
        const result = parsePipeline(COMMANDS[step.cmd].redirect ? text : "| " + text);
        single++;
        if (result.error || !same(result.steps, [step])) failures.push("comando: " + text + " → " + (result.error || JSON.stringify(result.steps)));
    }

    // 2) pipeline complete: soluzioni dei livelli ed esempi del manuale
    const pipelines = [];
    for (const lvl of levels) pipelines.push(referenceSolution(lvl).filter(step => step.cmd !== null));
    for (const entry of MANUAL) for (const example of entry.examples) pipelines.push(example.steps);
    for (const steps of pipelines) {
        const text = pipelineText(steps);
        const result = parsePipeline(text);
        if (result.error || !same(result.steps, steps)) failures.push("pipeline: " + text + " → " + (result.error || JSON.stringify(result.steps)));
    }

    // 3) varianti di scrittura equivalenti
    const variants = [
        ["sort -n -r", [{ cmd: "sort", args: { numeric: true, reverse: true } }]],
        ["sort -nr", [{ cmd: "sort", args: { numeric: true, reverse: true } }]],
        ["head -2", [{ cmd: "head", args: { n: 2 } }]],
        ["head -n2", [{ cmd: "head", args: { n: 2 } }]],
        ["head", [{ cmd: "head", args: { n: 10 } }]],
        ["grep -v ERR", [{ cmd: "grep", args: { pattern: "ERR", invert: true } }]],
        ['grep "a b"', [{ cmd: "grep", args: { pattern: "a b" } }]],
        ["cut -d : -f 2", [{ cmd: "cut", args: { delim: ":", field: 2 } }]],
        ["cut -f2 -d,", [{ cmd: "cut", args: { delim: ",", field: 2 } }]],
        ["paste -s -d ,", [{ cmd: "paste", args: { delim: "," } }]],
        ["paste -d, -s", [{ cmd: "paste", args: { delim: "," } }]],
        ["awk -F: '{ print $1 }'", [{ cmd: "awk", args: { field: 1, separator: ":" } }]],
        ["tr , '\\\\n'", [{ cmd: "tr", args: { from: ",", to: "\\n" } }]],
        ["sed -E 's|a/b|x|g'", [{ cmd: "sed", args: { pattern: "a/b", replacement: "x", global: true } }]],
        ["2> /dev/null | sort", [{ cmd: "devnull" }, { cmd: "sort" }]],
        ["2>&1 | grep ERR | uniq -c", [{ cmd: "merge" }, { cmd: "grep", args: { pattern: "ERR" } }, { cmd: "uniq", args: { count: true } }]],
        ["| LC_ALL=C sort | uniq", [{ cmd: "sort" }, { cmd: "uniq" }]],
        ["sort 2>/dev/null 2>&1", [{ cmd: "sort" }, { cmd: "devnull" }, { cmd: "merge" }]]
    ];
    for (const [text, expected] of variants) {
        const result = parsePipeline(text);
        if (result.error || !same(result.steps, expected)) failures.push("variante: " + text + " → " + (result.error || JSON.stringify(result.steps)));
    }

    // 4) errori attesi
    const errors = ["gerp ERR", "sort -x", "sort |", "| | sort", "grep", "grep 'ERR", "wc", "cut -f2", "cut -d:: -f1",
        "sed 's/a/b/'", "sed -E 's/a|b/x/'", "sed -E 's/a/b/q'", "awk '{print $1, $2}'", "head -n zero", "paste -d,",
        "sort > out.txt", "tr -d", "uniq -u", ""];
    for (const text of errors) {
        const result = parsePipeline(text);
        if (!result.error) failures.push("errore atteso per: " + JSON.stringify(text) + " → " + JSON.stringify(result.steps));
    }
    return { single, pipelines: pipelines.length, variants: variants.length, errors: errors.length, failures };
})()`, context);

for (const failure of report.failures) console.log(failure);
console.log(`Interprete: ${report.single} comandi, ${report.pipelines} pipeline, ${report.variants} varianti, ${report.errors} errori attesi; ${report.failures.length} problemi`);
if (report.failures.length) process.exit(1);
