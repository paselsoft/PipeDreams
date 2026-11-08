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
    const sortedArgs = args => Object.fromEntries(Object.keys(args).sort().map(key => [key, args[key]]));
    const canon = step => JSON.stringify(Object.keys(step.args || {}).length ? { cmd: step.cmd, args: sortedArgs(step.args) } : { cmd: step.cmd });
    const same = (a, b) => a.length === b.length && a.every((step, i) => canon(step) === canon(b[i]));

    // 1) ogni comando singolo
    const steps = [];
    for (const lvl of levels) steps.push(...lvl.allowedCommands, ...(lvl.wrong || []).flatMap(w => w.steps));
    for (const entry of MANUAL) for (const example of entry.examples) steps.push(...example.steps);
    for (let d = 0; d < 60; d++) steps.push(...generateDaily(dateKey(new Date(2026, 10, 1 + d))).allowedCommands);
    let single = 0;
    for (const step of steps) {
        const text = stepLabel(step);
        const result = parsePipeline(COMMANDS[step.cmd].redirect ? text : "| " + text, levelFiles({ allowedCommands: [step] }));
        single++;
        if (result.error || !same(result.steps, [step])) failures.push("comando: " + text + " → " + (result.error || JSON.stringify(result.steps)));
    }

    // 2) pipeline complete: soluzioni dei livelli ed esempi del manuale
    const pipelines = [];
    for (const lvl of levels) pipelines.push(referenceSolution(lvl).filter(step => step.cmd !== null));
    for (const entry of MANUAL) for (const example of entry.examples) pipelines.push(example.steps);
    for (const steps of pipelines) {
        const text = pipelineText(steps);
        const result = parsePipeline(text, levelFiles({ allowedCommands: steps }));
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
        ["sort 2>/dev/null 2>&1", [{ cmd: "sort" }, { cmd: "devnull" }, { cmd: "merge" }]],
        ["sort -t , -k 2,2 -n", [{ cmd: "sort", args: { separator: ",", key: 2, numeric: true } }]],
        ["sort -rn -t: -k3,3", [{ cmd: "sort", args: { separator: ":", key: 3, numeric: true, reverse: true } }]],
        ["grep -o -v x", null],
        ["grep -o x", [{ cmd: "grep", args: { pattern: "x", only: true } }]],
        ["uniq -c -d", [{ cmd: "uniq", args: { count: true, repeated: true } }]],
        ["cut -c 2-4", [{ cmd: "cutc", args: { from: 2, to: 4 } }]],
        ["cut -c3", [{ cmd: "cutc", args: { from: 3, to: 3 } }]],
        ["tac | rev", [{ cmd: "tac" }, { cmd: "rev" }]],
        ["nl -b a -w 1 -s '. '", [{ cmd: "nl", args: { all: true, width: 1, separator: ". " } }]],
        ["nl -bt", [{ cmd: "nl", args: {} }]],
        ["tee /dev/stderr | wc -l", [{ cmd: "tee", args: { file: "/dev/stderr" } }, { cmd: "wc" }]],
        ["comm -21 - critici.txt", [{ cmd: "comm", args: { mode: "12", file: "critici.txt", lines: ["bash", "sudo"] } }]],
        ["comm -1 -3 - critici.txt", [{ cmd: "comm", args: { mode: "13", file: "critici.txt", lines: ["bash", "sudo"] } }]],
        ["join -t , - ultime.txt", [{ cmd: "join", args: { separator: ",", file: "ultime.txt", lines: ["bash,5.2", "curl,8.1"] } }]],
        ["sort -hr", [{ cmd: "sort", args: { human: true, reverse: true } }]],
        ["tr -s ' ' | cut -d' ' -f2", [{ cmd: "squeeze", args: { set: " " } }, { cmd: "cut", args: { delim: " ", field: 2 } }]],
        ["fold -w5", [{ cmd: "fold", args: { width: 5 } }]],
        ["fold -sw 5", [{ cmd: "fold", args: { width: 5, spaces: true } }]],
        ["fold -s -w 12", [{ cmd: "fold", args: { width: 12, spaces: true } }]],
        ["fold -20", [{ cmd: "fold", args: { width: 20 } }]],
        ["xargs echo", [{ cmd: "xargs" }]],
        ["xargs -n2", [{ cmd: "xargs", args: { n: 2 } }]],
        ["xargs -n 3 echo", [{ cmd: "xargs", args: { n: 3 } }]]
    ].filter(([, expected]) => expected);
    const variantFiles = { "critici.txt": ["bash", "sudo"], "ultime.txt": ["bash,5.2", "curl,8.1"] };
    for (const [text, expected] of variants) {
        const result = parsePipeline(text, variantFiles);
        if (result.error || !same(result.steps, expected)) failures.push("variante: " + text + " → " + (result.error || JSON.stringify(result.steps)));
    }

    // 4) errori attesi
    const errors = ["gerp ERR", "sort -x", "sort |", "| | sort", "grep", "grep 'ERR", "wc", "cut -f2", "cut -d:: -f1",
        "sed 's/a/b/'", "sed -E 's/a|b/x/'", "sed -E 's/a/b/q'", "awk '{print $1, $2}'", "head -n zero", "paste -d,",
        "sort > out.txt", "tr -d", "uniq -u", "", "sort -k2", "sort -t, -k2,3", "sort -k2,2", "sort -t,",
        "grep -vo x", "cut -c", "cut -c4-2", "cut -c1-3 -d,", "tac -s x", "rev file",
        "comm - critici.txt", "comm -3 - critici.txt", "comm -12 critici.txt -", "comm -12 - altro.txt", "join - ", "join -t,, - ultime.txt",
        "nl -bx", "nl -w0", "tee", "tee -a log", "tee a b",
        "sort -nh", "tr -s", "tr -s a b", "fold", "fold -w 0", "fold -x", "xargs rm", "xargs -n", "xargs -n 0", "xargs -0"];
    for (const text of errors) {
        const result = parsePipeline(text, variantFiles);
        if (!result.error) failures.push("errore atteso per: " + JSON.stringify(text) + " → " + JSON.stringify(result.steps));
    }
    return { single, pipelines: pipelines.length, variants: variants.length, errors: errors.length, failures };
})()`, context);

for (const failure of report.failures) console.log(failure);
console.log(`Interprete: ${report.single} comandi, ${report.pipelines} pipeline, ${report.variants} varianti, ${report.errors} errori attesi; ${report.failures.length} problemi`);
if (report.failures.length) process.exit(1);
