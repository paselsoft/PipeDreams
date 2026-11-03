// Sfida del giorno.
const { assert, open, run } = require("./helpers");

// Mette nelle celle la soluzione della sfida corrente
const solveDaily = page => page.evaluate(() => {
    const lvl = dailyLevel;
    const options = slotOptions(lvl);
    solveLevel(lvl).optimal[0].split(" | ").forEach((label, i) => { gridState[i] = options.findIndex(o => stepLabel(o) === label); });
    buildGrid();
});

module.exports = {
    "il link ?sfida apre la sfida di oggi, uguale per tutti": async ({ page }) => {
        await open(page, { query: "?sfida" });
        assert.match(await page.innerText("#level-title"), /^📅 SFIDA DEL /);
        const same = await page.evaluate(() => JSON.stringify(dailyLevel) === JSON.stringify(generateDaily(dateKey())));
        assert.equal(same, true);
        assert.equal(await page.isVisible("#mode-toggle"), false, "niente modalità terminale nella sfida");
    },

    "risolta: riepilogo da condividere, risultato salvato e serie": async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await open(page);
        // Ieri e l'altro ieri risolte: oggi la serie arriva a 3
        await page.evaluate(() => {
            const today = new Date();
            for (const back of [1, 2]) {
                const day = new Date(today);
                day.setDate(today.getDate() - back);
                progress.daily[dateKey(day)] = { stars: 3, used: 3, attempts: 1, seconds: 30 };
            }
            loadDaily();
        });
        await solveDaily(page);
        const text = await run(page);
        assert.match(text, /SFIDA COMPLETATA/);
        assert.equal(await page.textContent("#act-title"), "Risolta! 🎉");
        const share = await page.textContent("#act-text");
        assert.match(share, /^Pipe Dreams · Sfida del /);
        assert.match(share, /🔥 3 giorni di fila/);
        assert.match(share, /\?sfida$/);
        await page.click("#act-button");
        assert.equal((await page.evaluate(() => navigator.clipboard.readText())).split("\n")[0], share.split("\n")[0]);
        assert.ok(await page.evaluate(() => progress.daily[dateKey()].stars === 3));
        assert.ok(await page.evaluate(() => progress.achievements.serie));
        await page.click("#btn-menu");
        assert.match(await page.textContent("#menu-daily"), /✓ ★★★ · 🔥 3/);
    },

    "tornare alla campagna dalla sfida": async ({ page }) => {
        await open(page, { query: "?sfida" });
        await page.click("#btn-menu");
        await page.locator(".menu-level").first().click();
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
        assert.equal(await page.evaluate(() => dailyLevel), null);
    }
};
