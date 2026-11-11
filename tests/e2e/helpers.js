// Strumenti comuni dei test nel browser.
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// Versione del gioco: i test partono come chi l'ha già vista, senza l'avviso delle novità
const APP_VERSION = fs.readFileSync(path.join(__dirname, "..", "..", "version.js"), "utf8").match(/APP_VERSION = "([^"]+)"/)[1];

// Indirizzo del server avviato da run.js
const fileUrl = name => (process.env.E2E_BASE_URL || "http://127.0.0.1:8000/") + name;

// Apre una pagina del gioco con progressi e preferenze iniziali. Lo stato viene scritto solo
// alla prima apertura della scheda: i ricaricamenti successivi conservano ciò che il gioco ha salvato.
// Il segno "già inizializzato" sta in window.name, che resta nella scheda tra una navigazione e l'altra.
// Per default animazioni istantanee, suoni spenti e introduzioni degli atti già viste.
// rawProgress scrive esattamente quel testo come salvataggio (per provare dati corrotti o vecchi).
async function open(page, { file = "index.html", query = "", hash = "", progress = {}, settings = {}, seenActs = true, rawProgress } = {}) {
    const initialProgress = rawProgress ?? JSON.stringify({ levels: {}, lastLevel: 0, seenActs: seenActs ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [], ...progress });
    const initialSettings = { speed: "istantanea", sound: false, lastVersion: APP_VERSION, tutorialDone: true, ...settings };
    await page.addInitScript(([p, s]) => {
        if (window.name === "e2e-init") return;
        window.name = "e2e-init";
        localStorage.setItem("pipedreams.progress.v1", p);
        localStorage.setItem("pipedreams.settings.v1", JSON.stringify(s));
    }, [initialProgress, initialSettings]);
    await page.goto(fileUrl(file) + query + hash);
}

// Carica un livello e mette nelle celle la soluzione di riferimento del solver
async function placeSolution(page, index) {
    await page.evaluate(i => {
        clearTimeout(transitionTimer);
        closeActIntro();
        loadLevel(i);
        const lvl = levels[i];
        const options = slotOptions(lvl);
        let grid;
        if (lvl.type === "debug") grid = debugFixes(lvl)[0].grid;
        else if (lvl.locked) grid = solveLocked(lvl).grids[0];
        else {
            grid = new Array(levelSlots(lvl)).fill(0);
            referenceSolution(lvl).forEach((step, j) => { grid[j] = options.indexOf(step); });
        }
        gridState = grid;
        buildGrid();
        updateShellLine();
        updateSlotCounter();
    }, index);
}

// Mette nelle celle una sequenza di etichette di comandi, dalla prima cella
async function placeLabels(page, labels) {
    await page.evaluate(list => {
        const options = slotOptions(currentLevel());
        list.forEach((label, i) => {
            const index = options.findIndex(option => stepLabel(option) === label);
            if (index === -1) throw new Error("comando non tra le opzioni: " + label);
            gridState[i] = index;
        });
        buildGrid();
        updateShellLine();
        updateSlotCounter();
    }, labels);
}

const reload = page => page.reload();

const consoleText = page => page.evaluate(() => document.getElementById("console").innerText);

// Preme ESEGUI e attende l'esito in console
async function run(page) {
    await page.evaluate(() => closeActIntro());
    await page.click("#btn-run");
    await page.waitForFunction(() => /SUCCESSO|COMPLETATO|FALLIMENTO|SFIDA COMPLETATA/.test(document.getElementById("console").innerText), null, { timeout: 15000 });
    return consoleText(page);
}

const won = text => /SUCCESSO|COMPLETATO/.test(text);

module.exports = { APP_VERSION, assert, open, reload, placeSolution, placeLabels, consoleText, run, won, fileUrl };
