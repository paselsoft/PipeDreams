// Confronto con la soluzione ottimale dopo la vittoria, e allenamento per comando.
const { assert, open, placeSolution, placeLabels, run, consoleText } = require("./helpers");

// Mette nelle celle una soluzione ottimale del livello generato in corso
const solveGenerated = page => page.evaluate(() => {
    const options = slotOptions(currentLevel());
    gridState = new Array(gridState.length).fill(0);
    solveLevel(currentLevel()).optimalSteps[0].forEach((step, i) => { gridState[i] = options.indexOf(step); });
    buildGrid();
});

// Soluzione ottimale con un comando in più all'inizio, che non cambia il risultato
const solveWithExtra = page => page.evaluate(() => {
    const lvl = currentLevel();
    const options = slotOptions(lvl);
    const best = solveLevel(lvl).optimalSteps[0];
    const extra = options.find(option => option.cmd !== null &&
        isSolved(lvl, executePipeline(lvl.stdin, [option, ...best])));
    if (!extra) return false;
    gridState = new Array(gridState.length).fill(0);
    [extra, ...best].forEach((step, i) => { gridState[i] = options.indexOf(step); });
    buildGrid();
    return true;
});

module.exports = {
    "confronto: soluzione lunga, il gioco si ferma e spiega; RIPROVA e LABORATORIO": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(0));
        await placeLabels(page, ["grep -v 'ERR'", "grep -v 'ERR'"]);
        const text = await run(page);
        assert.match(text, /Ottimale: grep -v 'ERR' \(1 comando\)/);
        assert.match(text, /Quando vuoi, passa al prossimo livello/);
        const card = await page.innerText("#result-card");
        assert.match(card, /La tua\s+grep -v 'ERR' \| grep -v 'ERR'\s+2 comandi/);
        assert.match(card, /Ottimale\s+grep -v 'ERR'\s+1 comando/);
        assert.match(card, /Hai usato 2 comandi: ne basta 1\./);
        assert.equal((card.match(/non serve/g) || []).length, 1, "comandi uguali segnalati una volta");
        // Il gioco resta sul livello: nessun passaggio automatico
        await page.waitForTimeout(2500);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
        // Il laboratorio mostra la soluzione ottimale
        await page.click("#result-card >> text=🧪 LABORATORIO");
        assert.equal(await page.isVisible("#manual-overlay"), true);
        assert.equal(await page.evaluate(() => lab.commands.map(c => c.cmd).join(",")), "grep");
        await page.evaluate(() => closeManual());
        // RIPROVA: le celle si possono cambiare, e con la soluzione ottimale si passa da soli al livello 2
        await page.click("#result-card >> text=↺ RIPROVA");
        assert.equal(await page.isVisible("#result-card"), false);
        assert.match(await consoleText(page), /Modifica le celle e riprova: con 1 comando ottieni ★★★/);
        await placeSolution(page, 0);
        await run(page);
        await page.waitForFunction(() => document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"), null, { timeout: 4000 });
        assert.deepEqual(await page.evaluate(() => progress.levels["1"]), { stars: 3, best: 1 });
    },

    "confronto: spiegazione quando nessun comando si può togliere": async ({ page }) => {
        await open(page);
        const lines = await page.evaluate(() => explainReport({ used: 4, par: 2, removable: [] }));
        assert.equal(lines[0], "Hai usato 4 comandi: ne bastano 2.");
        assert.match(lines[1], /per un'altra strada.*laboratorio/);
    },

    "confronto: con una soluzione ottimale si vedono le alternative": async ({ page }) => {
        await open(page, { progress: { levels: Object.fromEntries([...Array(29)].map((_, i) => [i + 1, { stars: 3, best: 1 }])) } });
        const index = await page.evaluate(() => levels.findIndex(lvl => !lvl.type && !lvl.locked && solveLevel(lvl).optimalCount > 1));
        assert.ok(index >= 0, "serve un livello con più soluzioni ottimali");
        await placeSolution(page, index);
        const text = await run(page);
        assert.match(text, /Altre soluzioni ottimali: /);
        assert.match(text, /Prossimo livello tra 3.5s/);
        assert.equal(await page.isVisible("#result-card"), false);
    },

    "confronto: anche nella sfida del giorno, senza PROSSIMO": async ({ page }) => {
        await open(page, { query: "?sfida" });
        assert.ok(await solveWithExtra(page), "serve un comando in più che non cambia il risultato");
        await run(page);
        await page.evaluate(() => closeActIntro());
        assert.equal(await page.isVisible("#result-card"), true);
        assert.equal(await page.locator("#result-card >> text=PROSSIMO ▶").count(), 0);
        assert.match(await page.innerText("#result-card"), /Il comando 1 \(.+\) non serve/);
    },

    "allenamento: scelta del comando, livelli in sequenza, cambio e uscita": async ({ page }) => {
        await open(page);
        await page.click("#btn-menu");
        await page.click("#menu-training");
        assert.equal(await page.locator(".training-topic").count(), 11);
        await page.click(".training-topic[data-topic=sort]");
        assert.equal(await page.isVisible("#training-bar"), true);
        assert.match(await page.innerText("#level-title"), /^🎯 ALLENAMENTO SORT · LIVELLO 1: /);
        assert.ok(await page.evaluate(() => currentLevel().allowedCommands.some(step => step.cmd === "sort")));
        for (let i = 1; i <= 2; i++) {
            await solveGenerated(page);
            await page.click("#btn-run");
            await page.waitForFunction(n => document.getElementById("level-title").innerText.includes(`LIVELLO ${n + 1}:`), i, { timeout: 6000 });
        }
        assert.equal(await page.evaluate(() => progress.training.sort), 2);
        assert.match(await page.textContent("#training-status"), /risolti oggi: 2 · in totale: 2/);
        // Cambiare livello è gratis
        const before = await page.evaluate(() => currentLevel().id);
        await page.click("#training-bar >> text=⏭ Cambia");
        assert.notEqual(await page.evaluate(() => currentLevel().id), before);
        await page.click("#training-bar >> text=✕ Esci");
        assert.equal(await page.isVisible("#training-bar"), false);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
        // Il totale si vede nel menu e tra le statistiche
        await page.click("#btn-menu");
        await page.click("#menu-training");
        assert.equal(await page.textContent(".training-topic[data-topic=sort] .training-count"), "✓ 2");
    },

    "allenamento: soluzione lunga, obiettivo In palestra e link diretto": async ({ page }) => {
        await open(page, { query: "?allenamento=uniq", progress: { training: { grep: 9 } } });
        assert.match(await page.innerText("#level-title"), /^🎯 ALLENAMENTO UNIQ/);
        assert.ok(await solveWithExtra(page), "serve un comando in più che non cambia il risultato");
        await page.click("#btn-run");
        await page.waitForFunction(() => !document.getElementById("result-card").hidden, null, { timeout: 6000 });
        assert.ok(await page.evaluate(() => progress.achievements.palestra));
        await page.click("#result-card >> text=PROSSIMO ▶");
        assert.match(await page.innerText("#level-title"), /LIVELLO 2:/);
        await page.goto(page.url().replace("?allenamento=uniq", "?allenamento=boh"));
        assert.equal(await page.isVisible("#training-overlay"), true, "argomento sconosciuto: si sceglie dall'elenco");
    }
};
