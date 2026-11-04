// Verifica i casi a puntate: ogni enigma è un livello valido (risolvibile entro gli slot, con
// soluzioni ottimali in numero ragionevole), la soluzione dà in bash lo stdout atteso, usa solo
// comandi già visti fino all'atto richiesto, e ogni domanda ha la risposta giusta tra le opzioni.
// Uso: node tools/check-stories.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { runBash } = require("./bash");

const root = path.join(__dirname, "..");
const context = vm.createContext({ TextEncoder, TextDecoder, btoa, atob });
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "command-form.js", "share.js", "stories.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext(`STORIES.map(story => {
    const known = new Set(levels.filter(lvl => lvl.act <= story.requiresAct).flatMap(lvl => lvl.allowedCommands.map(step => step.cmd)));
    return {
        id: story.id, title: story.title, fields: Boolean(story.title && story.synopsis && story.epilogue && Number.isInteger(story.requiresAct)),
        chapters: story.chapters.map(chapter => ({
            id: chapter.id, title: chapter.title,
            fields: Boolean(chapter.title && chapter.from && chapter.text && chapter.puzzles.length) && (chapter.release === undefined || /^\\d{4}-\\d{2}-\\d{2}$/.test(chapter.release)),
            question: chapter.question && Array.isArray(chapter.question.options) && chapter.question.options.length >= 3 &&
                new Set(chapter.question.options).size === chapter.question.options.length &&
                Number.isInteger(chapter.question.answer) && chapter.question.answer >= 0 && chapter.question.answer < chapter.question.options.length &&
                Boolean(chapter.question.explain) && Array.isArray(chapter.question.why) && chapter.question.why.length === chapter.question.options.length,
            puzzles: chapter.puzzles.map(puzzle => {
                const error = sharedLevelError(puzzle.level);
                const solution = error ? null : solveLevel(puzzle.level);
                return {
                    id: puzzle.id, title: puzzle.level.title, clue: Boolean(puzzle.clue), error,
                    unknown: puzzle.level.allowedCommands.map(step => step.cmd).filter(cmd => !known.has(cmd)),
                    par: solution && solution.par, optimalCount: solution && solution.optimalCount, slots: levelSlots(puzzle.level),
                    line: solution ? buildShellLine(puzzle.level.stdin, solution.optimalSteps[0]) : null,
                    target: puzzle.level.target, targetStderr: puzzle.level.targetStderr || []
                };
            })
        }))
    };
})`, context);

let failures = 0;
let checked = 0;
const ids = new Set();
for (const story of report) {
    console.log(`${story.title} (${story.id})`);
    if (!story.fields || ids.has(story.id)) { failures++; console.log("  ✗ campi del caso mancanti o id ripetuto"); }
    ids.add(story.id);
    const chapterIds = new Set();
    for (const chapter of story.chapters) {
        const problems = [];
        if (!chapter.fields) problems.push("campi del capitolo mancanti");
        if (chapterIds.has(chapter.id)) problems.push("id del capitolo ripetuto");
        chapterIds.add(chapter.id);
        if (!chapter.question) problems.push("domanda non valida (servono 3+ opzioni diverse, risposta, spiegazione e un perché per opzione)");
        if (problems.length) { failures++; console.log(`  ✗ ${chapter.title}: ${problems.join(", ")}`); }
        for (const puzzle of chapter.puzzles) {
            checked++;
            const issues = [];
            if (puzzle.error) issues.push(puzzle.error);
            if (!puzzle.clue) issues.push("indizio senza nome");
            if (puzzle.unknown.length) issues.push(`comandi non ancora visti all'atto richiesto: ${puzzle.unknown.join(", ")}`);
            if (puzzle.par > puzzle.slots) issues.push("par oltre gli slot");
            if (puzzle.optimalCount > 4) issues.push(`${puzzle.optimalCount} soluzioni ottimali: l'enigma è troppo aperto`);
            if (puzzle.line) {
                const real = runBash(puzzle.line);
                if (JSON.stringify(real.stdout) !== JSON.stringify(puzzle.target) || JSON.stringify(real.stderr) !== JSON.stringify(puzzle.targetStderr)) issues.push("bash dà un output diverso");
            }
            if (issues.length) failures++;
            console.log(`  ${issues.length ? "✗" : "✓"} ${chapter.title} · ${puzzle.title} · par ${puzzle.par}, ${puzzle.optimalCount} soluzioni ottimali${issues.length ? " · " + issues.join(", ") : ""}`);
        }
    }
}
console.log(`${failures ? "✗" : "✓"} ${report.length} casi, ${checked} enigmi controllati, ${failures} problemi`);
if (failures) process.exit(1);
