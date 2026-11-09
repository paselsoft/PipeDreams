// Controlla i dati della sezione LPI (lpi.js): pesi che sommano come negli esami ufficiali (60 per
// ogni esame LPIC-1, 40 per Linux Essentials), link alle lezioni italiane, comandi del gioco che
// esistono e che allenano davvero almeno un livello della campagna.
// Uso: node tools/check-lpi.js            (solo dati)
//      node tools/check-lpi.js --online   (anche: ogni link risponde 200; serve la rete)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["commands.js", "levels.js", "solver.js", "shell.js", "terminal.js", "tutor.js", "lpi.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const report = vm.runInContext(`(() => {
    const problems = [];
    const expected = { "101-500": 60, "102-500": 60, "010-160": 40 };
    const usedByLevel = levels.map(lvl => new Set(tutorStepsFor(lvl).map(step => step.cmd)));
    const urls = [];
    for (const exam of LPI_EXAMS) {
        const total = exam.objectives.reduce((sum, item) => sum + item.weight, 0);
        if (total !== expected[exam.id]) problems.push(exam.id + ": pesi " + total + " invece di " + expected[exam.id]);
        if (!/^https:\\/\\/learning\\.lpi\\.org\\/pdfstore\\/LPI-Learning-Material-[0-9-]+-it\\.pdf$/.test(exam.pdf)) problems.push(exam.id + ": PDF non valido " + exam.pdf);
        urls.push(exam.url, exam.pdf);
        const ids = new Set();
        for (const objective of exam.objectives) {
            const name = exam.id + " " + objective.id;
            if (ids.has(objective.id)) problems.push(name + ": doppio");
            ids.add(objective.id);
            if (!objective.title || !(objective.weight >= 1)) problems.push(name + ": titolo o peso mancante");
            if (!objective.url.startsWith("https://learning.lpi.org/it/learning-materials/" + exam.id + "/")) problems.push(name + ": link non valido " + objective.url);
            if (!(objective.lessons >= 1)) problems.push(name + ": nessuna lezione");
            urls.push(objective.url);
            for (const cmd of objective.cmds || []) {
                if (!COMMANDS[cmd]) problems.push(name + ": comando del gioco sconosciuto " + cmd);
            }
            if (objective.cmds && objective.cmds.length && !usedByLevel.some(used => objective.cmds.some(cmd => used.has(cmd)))) {
                problems.push(name + ": nessun livello allena i comandi " + objective.cmds.join(", "));
            }
        }
    }
    return { problems, urls, objectives: LPI_EXAMS.reduce((sum, exam) => sum + exam.objectives.length, 0) };
})()`, context);

async function checkOnline(urls) {
    const failed = [];
    for (const url of urls) {
        try {
            const response = await fetch(url, { method: url.endsWith(".pdf") ? "HEAD" : "GET", redirect: "follow" });
            if (!response.ok) failed.push(`${response.status} ${url}`);
        } catch (error) {
            failed.push(`errore ${url}: ${error.message}`);
        }
    }
    return failed;
}

(async () => {
    report.problems.forEach(problem => console.log(problem));
    let online = "";
    if (process.argv.includes("--online")) {
        const failed = await checkOnline(report.urls);
        failed.forEach(line => console.log("Link: " + line));
        report.problems.push(...failed);
        online = `, ${report.urls.length} link controllati`;
    }
    console.log(`LPI: ${LPI_EXAMS_COUNT()} esami, ${report.objectives} obiettivi${online}, ${report.problems.length} problemi`);
    if (report.problems.length) process.exit(1);
})();

function LPI_EXAMS_COUNT() {
    return vm.runInContext("LPI_EXAMS.length", context);
}
