// Galleria della community: elenco, partita con stelle salvate, obiettivo e proposta dall'editor.
const { assert, open, consoleText, fileUrl } = require("./helpers");

// Mette nelle celle una soluzione ottimale del livello in corso
const solveCurrent = page => page.evaluate(() => {
    const options = slotOptions(currentLevel());
    gridState = new Array(gridState.length).fill(0);
    solveLevel(currentLevel()).optimalSteps[0].forEach((step, i) => { gridState[i] = options.indexOf(step); });
    buildGrid();
});

module.exports = {
    "galleria: si gioca un livello, le stelle restano e si torna all'elenco": async ({ page }) => {
        await open(page);
        await page.click("#btn-menu");
        await page.click("#menu-gallery");
        const count = await page.evaluate(() => COMMUNITY_LEVELS.length);
        assert.equal(await page.locator(".gallery-item").count(), count);
        assert.match(await page.textContent("#gallery-total"), new RegExp(`^0/${count} risolti$`));
        const first = await page.evaluate(() => COMMUNITY_LEVELS[0]);
        await page.locator(".gallery-play").first().click();
        assert.equal(await page.isVisible("#gallery-bar"), true);
        assert.equal(await page.innerText("#level-title"), `🌍 COMMUNITY: ${first.level.title} (di ${first.author})`);
        await solveCurrent(page);
        await page.click("#btn-run");
        await page.waitForFunction(() => /Livello della community risolto/.test(document.getElementById("console").innerText));
        assert.deepEqual(Object.keys(await page.evaluate(() => progress.community)), [first.id]);
        assert.equal(await page.evaluate(id => progress.community[id].stars, first.id), 3);
        assert.deepEqual(await page.evaluate(() => Object.keys(progress.levels)), [], "la campagna non cambia");
        await page.click("#gallery-bar >> text=🌍 Galleria");
        assert.equal(await page.textContent(".gallery-item .gallery-stars"), "★★★");
        assert.match(await page.textContent("#gallery-total"), new RegExp(`^1/${count} risolti$`));
        await page.keyboard.press("Escape");
        await page.click("#gallery-bar >> text=✕ Esci");
        assert.equal(await page.isVisible("#gallery-bar"), false);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
    },

    "galleria: obiettivo Esploratore, backup e soluzione lunga": async ({ page }) => {
        const ids = await (async () => { await open(page); return page.evaluate(() => COMMUNITY_LEVELS.map(entry => entry.id)); })();
        await page.evaluate(([a, b]) => { progress.community = { [a]: { stars: 2, best: 4 }, [b]: { stars: 3, best: 2 } }; persistProgress(); }, ids);
        await page.evaluate(id => playCommunity(id), ids[2]);
        // Soluzione con un comando in più: confronto con quella ottimale, PROSSIMO riapre la galleria
        await page.evaluate(() => {
            const lvl = currentLevel();
            const options = slotOptions(lvl);
            const best = solveLevel(lvl).optimalSteps[0];
            const extra = options.find(option => option.cmd !== null && isSolved(lvl, executePipeline(lvl.stdin, [option, ...best])));
            gridState = new Array(gridState.length).fill(0);
            [extra, ...best].forEach((step, i) => { gridState[i] = options.indexOf(step); });
            buildGrid();
        });
        await page.click("#btn-run");
        await page.waitForFunction(() => !document.getElementById("result-card").hidden);
        assert.ok(await page.evaluate(() => progress.achievements.esploratore));
        await page.click("#result-card >> text=PROSSIMO ▶");
        assert.equal(await page.isVisible("#gallery-overlay"), true);
        // Il backup porta anche i livelli della community
        const restored = await page.evaluate(() => readBackup(backupCode(progress)).progress.community);
        assert.equal(Object.keys(restored).length, 3);
    },

    "editor: PROPONI ALLA GALLERIA apre una proposta su GitHub con il link": async ({ page }) => {
        await open(page, { file: "editor.html" });
        await page.evaluate(() => { window.openedUrls = []; window.open = url => { window.openedUrls.push(url); }; });
        await page.evaluate(() => loadFromLevel(levels[1].id));
        await page.click("#ed-propose");
        const [url] = await page.evaluate(() => window.openedUrls);
        assert.ok(url.startsWith("https://github.com/paselsoft/PipeDreams/issues/new?title="), url);
        const params = new URL(url).searchParams;
        assert.match(params.get("title"), /^Livello per la galleria: /);
        assert.match(params.get("body"), new RegExp(`Link per giocarlo: ${fileUrl("index.html").replace(/[.?]/g, "\\$&")}#livello=`));
        await page.fill("#ed-title", "");
        assert.equal(await page.$eval("#ed-propose", button => button.disabled), true);
    }
};
