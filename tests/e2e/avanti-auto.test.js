// Avanti automatico: dopo una vittoria si passa da soli al livello successivo, oppure si resta sul
// livello risolto con il pulsante «PROSSIMO LIVELLO ▶».
const fs = require("fs");
const path = require("path");
const { assert, open, placeSolution, run, won, consoleText } = require("./helpers");

// Mette nelle celle la soluzione ottimale del livello corrente (allenamento, maratona)
const solveCurrent = page => page.evaluate(() => {
    const lvl = currentLevel();
    const options = slotOptions(lvl);
    gridState = new Array(levelSlots(lvl)).fill(0);
    referenceSolution(lvl).forEach((step, j) => { gridState[j] = options.indexOf(step); });
    buildGrid();
    updateShellLine();
});

module.exports = {
    "avanti auto spento: si resta sul livello risolto, poi PROSSIMO LIVELLO": async ({ page }) => {
        await open(page, { settings: { autoNext: false } });
        assert.equal(await page.getAttribute("#btn-autonext", "aria-pressed"), "false");
        assert.equal(await page.isVisible("#btn-next"), false);
        await placeSolution(page, 0);
        assert.ok(won(await run(page)));
        assert.match(await consoleText(page), /Quando vuoi, passa al prossimo livello/);
        assert.equal(await page.isVisible("#btn-next"), true);
        await page.waitForTimeout(4500);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//, "dopo 4,5 s è ancora il livello 1");
        // La soluzione resta nelle celle e nella riga di shell; si può rieseguire
        assert.match(await page.textContent("#shell-line"), /grep -v 'ERR'/);
        assert.equal(await page.evaluate(() => isBusy), false);
        assert.ok(won(await run(page)), "si può rieseguire");
        // Da tastiera
        await page.focus("#btn-next");
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"));
        assert.equal(await page.isVisible("#btn-next"), false);
    },

    "avanti auto: acceso passa da solo; spegnerlo durante l'attesa ferma il passaggio": async ({ page }) => {
        await open(page);
        assert.equal(await page.getAttribute("#btn-autonext", "aria-pressed"), "true");
        await placeSolution(page, 0);
        assert.ok(won(await run(page)));
        assert.match(await consoleText(page), /Prossimo livello tra/);
        await page.click("#btn-autonext");
        assert.equal(await page.getAttribute("#btn-autonext", "aria-pressed"), "false");
        assert.equal(await page.isVisible("#btn-next"), true);
        await page.waitForTimeout(4500);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
        // La scelta resta dopo il ricaricamento
        await page.reload();
        assert.equal(await page.getAttribute("#btn-autonext", "aria-pressed"), "false");
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.settings.v1")).autoNext), false);
        await page.click("#btn-autonext");
        assert.equal(await page.evaluate(() => "autoNext" in JSON.parse(localStorage.getItem("pipedreams.settings.v1"))), false, "riacceso = valore predefinito");
        await placeSolution(page, 0);
        assert.ok(won(await run(page)));
        await page.waitForFunction(() => document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"), null, { timeout: 7000 });
    },

    "avanti auto spento: vale per l'allenamento, non per la maratona": async ({ page }) => {
        await open(page, { settings: { autoNext: false } });
        await page.evaluate(() => startTraining("sort"));
        await solveCurrent(page);
        assert.ok(won(await run(page)));
        assert.equal(await page.isVisible("#btn-next"), true);
        await page.waitForTimeout(2500);
        assert.match(await page.innerText("#level-title"), /ALLENAMENTO SORT · LIVELLO 1:/, "l'allenamento aspetta");
        await page.click("#btn-next");
        await page.waitForFunction(() => /ALLENAMENTO SORT · LIVELLO 2:/.test(document.getElementById("level-title").innerText));
        assert.equal(await page.isVisible("#btn-next"), false);

        await page.evaluate(() => { stopTraining(); startMarathon(); });
        await solveCurrent(page);
        await page.click("#btn-run");
        await page.waitForFunction(() => document.getElementById("level-title").innerText.includes("LIVELLO 2 "), null, { timeout: 7000 });
        assert.equal(await page.isVisible("#btn-next"), false, "la maratona passa da sola");
    },

    "avanti auto: nessuna violazione axe sui pulsanti": async ({ page }) => {
        await open(page, { settings: { autoNext: false } });
        await placeSolution(page, 0);
        await run(page);
        let axe = null;
        try { axe = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8"); } catch (e) { /* axe non installato */ }
        if (axe) {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run({ include: [".action-buttons", ".fx-control"] }, { resultTypes: ["violations"] })).violations.map(v => v.id));
            assert.deepEqual(violations, []);
        }
    }
};
