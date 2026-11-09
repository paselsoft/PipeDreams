// Il Tutor deve saper spiegare ogni livello: genera la lezione per i livelli della campagna, gli
// enigmi dei casi, i livelli della galleria, un anno di sfide del giorno, l'allenamento e la
// maratona. Fallisce se la pipeline spiegata non risolve il livello, se un passo non ha una
// spiegazione propria o se un testo contiene «undefined», «NaN» o «[object».
// Uso: node tools/check-tutor.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "terminal.js", "daily.js", "community.js", "stories.js", "tutor.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext(`(() => {
    const problems = [];
    let lessons = 0;
    let passes = 0;
    const commandsSeen = new Set();
    // «null» da solo è un errore, ma /dev/null no
    const bad = /\\bundefined\\b|\\bNaN\\b|\\[object|(^|[^/\\w])null\\b/;
    function check(name, lvl, steps) {
        let lesson;
        try {
            lesson = tutorLesson(lvl, steps);
        } catch (error) {
            problems.push(name + ": errore " + error.message);
            return;
        }
        lessons++;
        if (!lesson.solved) problems.push(name + ": la pipeline spiegata non risolve il livello");
        if (!lesson.passes.length) problems.push(name + ": nessun passo");
        for (const pass of lesson.passes) {
            passes++;
            commandsSeen.add(pass.cmd);
            const texts = [pass.label, pass.what, pass.without.sentence, ...pass.options.flatMap(option => [option.flag, option.text])];
            if (pass.what === "applica il comando a ogni riga.") problems.push(name + ": " + pass.label + " senza spiegazione propria");
            if (texts.some(text => typeof text !== "string" || !text.trim() || bad.test(text))) problems.push(name + ": testo non valido in " + pass.label + ": " + JSON.stringify(texts));
        }
        if (bad.test(lesson.pipeline)) problems.push(name + ": pipeline non valida " + lesson.pipeline);
    }

    levels.forEach(lvl => check("livello " + lvl.id, lvl, tutorStepsFor(lvl)));
    // Quiz: la pipeline della domanda
    levels.filter(lvl => lvl.type === "quiz").forEach(lvl => check("quiz " + lvl.id, lvl, gridSteps(lvl, lvl.start)));
    STORIES.forEach(story => story.chapters.forEach(chapter => chapter.puzzles.forEach(puzzle =>
        check("caso " + story.id + "/" + chapter.id + "/" + puzzle.id, puzzle.level, tutorStepsFor(puzzle.level)))));
    COMMUNITY_LEVELS.forEach(entry => check("galleria " + entry.id, entry.level, tutorStepsFor(entry.level)));
    const day = new Date("2026-01-01T12:00:00");
    for (let i = 0; i < 366; i++) {
        const key = dateKey(new Date(day.getTime() + i * 86400000));
        const lvl = generateDaily(key);
        check("sfida " + key, lvl, tutorStepsFor(lvl));
    }
    TRAINING_TOPICS.forEach(topic => {
        for (let round = 0; round < 12; round++) {
            const lvl = generateTrainingLevel(topic.id, "tutor", round);
            check("allenamento " + topic.id + " " + round, lvl, tutorStepsFor(lvl));
        }
    });
    for (let round = 0; round < 30; round++) {
        const lvl = generateMarathonLevel("tutor", round, round < 10 ? "facile" : round < 20 ? "media" : "difficile");
        check("maratona " + round, lvl, tutorStepsFor(lvl));
    }
    const missing = Object.keys(COMMANDS).filter(cmd => !commandsSeen.has(cmd));
    return { problems, lessons, passes, missing };
})()`, context);

report.problems.slice(0, 40).forEach(problem => console.log(problem));
if (report.missing.length) console.log(`Comandi mai spiegati (non usati nelle soluzioni): ${report.missing.join(", ")}`);
console.log(`Tutor: ${report.lessons} lezioni, ${report.passes} passi spiegati, ${report.problems.length} problemi`);
if (report.problems.length) process.exit(1);
