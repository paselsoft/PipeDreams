// Aiuti progressivi e Maratona.
const { assert, open, placeSolution, run, consoleText } = require("./helpers");

const actsDone = () => Object.fromEntries([...Array(23)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));

// Mette nelle celle la soluzione del livello generato in corso (sfida o maratona)
const solveGenerated = page => page.evaluate(() => {
    const options = slotOptions(currentLevel());
    gridState = new Array(gridState.length).fill(0);
    solveLevel(currentLevel()).optimal[0].split(" | ").forEach((label, i) => { gridState[i] = options.findIndex(o => stepLabel(o) === label); });
    buildGrid();
});

module.exports = {
    "aiuti: spinta gratis, poi piano e una cella che abbassano le stelle": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(1));
        assert.equal(await page.textContent("#btn-hint"), "? AIUTO 1/3");
        await page.click("#btn-hint");
        let text = await consoleText(page);
        assert.match(text, /AIUTO 1 · SPINTA\] uniq vede solo i doppioni che si toccano/);
        assert.match(text, /Il prossimo aiuto \(piano\) limita le stelle a ★★☆/);
        assert.equal(await page.textContent("#btn-hint"), "? AIUTO 2/3");
        await page.click("#btn-hint");
        assert.match(await consoleText(page), /AIUTO 2 · PIANO\] Piano in 2 passi/);
        await page.click("#btn-hint");
        text = await consoleText(page);
        assert.match(text, /AIUTO 3 · UNA CELLA\] Cella 1: sort\./);
        assert.ok(await page.$eval("#c0", cell => cell.classList.contains("revealed")));
        await placeSolution(page, 1);
        await page.evaluate(() => { levelSession.hintTier = 3; });
        text = await run(page);
        assert.match(text, /★☆☆ Soluzione ottimale/);
        assert.match(text, /Con gli aiuti usati il massimo era ★☆☆/);
    },

    "aiuti: solo la spinta lascia le tre stelle": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(1));
        await page.click("#btn-hint");
        await placeSolution(page, 1);
        await page.evaluate(() => { levelSession.hintTier = 1; });
        assert.match(await run(page), /★★★ Soluzione ottimale/);
    },

    "terzo aiuto per debug, quiz e terminale": async ({ page }) => {
        await open(page, { progress: { levels: actsDone() } });
        const debug = await page.evaluate(() => levels.findIndex(lvl => lvl.type === "debug"));
        await page.evaluate(i => { loadLevel(i); showHint(); showHint(); showHint(); }, debug);
        assert.match(await consoleText(page), /La cella da cambiare è la numero 3\./);
        const quiz = await page.evaluate(() => levels.findIndex(lvl => lvl.type === "quiz"));
        await page.evaluate(i => { loadLevel(i); showHint(); showHint(); showHint(); }, quiz);
        assert.match(await consoleText(page), /eliminato una risposta sbagliata/);
        assert.equal(await page.locator(".quiz-answer:disabled").count(), 1);
        assert.equal(await page.locator(".quiz-answer[data-correct=true]:disabled").count(), 0);
        await page.evaluate(() => loadLevel(1));
        await page.click("#mode-toggle [data-mode=terminal]");
        await page.evaluate(() => { showHint(); showHint(); showHint(); });
        assert.match(await consoleText(page), /Il comando numero 1 della soluzione è: sort/);
    },

    "maratona: livelli in sequenza, tempo bonus e difficoltà crescente": async ({ page }) => {
        await open(page);
        await page.click("#btn-menu");
        await page.click("#menu-marathon");
        assert.equal(await page.isVisible("#marathon-bar"), true);
        assert.match(await page.innerText("#level-title"), /^🏃 MARATONA · LIVELLO 1 \(facile\)/);
        assert.equal(await page.isVisible("#mode-toggle"), false, "niente terminale nella maratona");
        for (let i = 1; i <= 3; i++) {
            const before = await page.evaluate(() => marathon.deadline);
            await solveGenerated(page);
            await page.click("#btn-run");
            await page.waitForFunction(n => document.getElementById("level-title").innerText.includes(`LIVELLO ${n + 1} `), i, { timeout: 7000 });
            assert.equal(await page.evaluate(() => marathon.deadline) - before, 20000, "+20 s per un livello facile");
        }
        assert.match(await page.innerText("#level-title"), /LIVELLO 4 \(media\)/);
        assert.match(await page.textContent("#marathon-status"), /Risolti: 3/);
        // Cambiare livello costa 20 secondi
        const before = await page.evaluate(() => [marathon.deadline, currentLevel().id]);
        await page.click("text=⏭ Cambia (−20 s)");
        const after = await page.evaluate(() => [marathon.deadline, currentLevel().id]);
        assert.equal(before[0] - after[0], 20000);
        assert.notEqual(before[1], after[1]);
    },

    "maratona: fine del tempo, record, obiettivo e uscita": async ({ page }) => {
        await open(page, { query: "?maratona" });
        assert.equal(await page.isVisible("#marathon-bar"), true);
        await page.evaluate(() => { marathon.solved = 5; marathon.deadline = Date.now() - 1; });
        await page.waitForFunction(() => !document.getElementById("act-overlay").hidden);
        assert.equal(await page.textContent("#act-label"), "MARATONA FINITA");
        assert.equal(await page.textContent("#act-title"), "5 livelli risolti");
        assert.equal(await page.evaluate(() => progress.marathon.best), 5);
        assert.ok(await page.evaluate(() => progress.achievements.maratoneta));
        assert.equal(await page.$eval("#btn-run", button => button.disabled), true, "a tempo scaduto non si esegue");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /LIVELLO 1 \(facile\)/, "RIPROVA riparte da capo");
        await page.click("text=✕ Esci");
        assert.equal(await page.isVisible("#marathon-bar"), false);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
        await page.click("#btn-menu");
        assert.match(await page.textContent("#menu-marathon"), /record 5/);
    }
};
