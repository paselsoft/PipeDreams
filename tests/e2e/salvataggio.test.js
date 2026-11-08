// Progressi, menu dei livelli, sblocco e azzeramento.
const { assert, open, reload, placeSolution, placeLabels, run } = require("./helpers");

const STORAGE = "pipedreams.progress.v1";
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);

module.exports = {
    "il risultato migliore resta salvato e il gioco riprende da dove eri": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(0));
        await placeLabels(page, ["grep -v 'ERR'", "grep -v 'ERR'"]);
        await run(page);
        assert.deepEqual((await saved(page)).levels["1"], { stars: 2, best: 2 });
        await placeSolution(page, 0);
        await run(page);
        assert.deepEqual((await saved(page)).levels["1"], { stars: 3, best: 1 });
        // Un risultato peggiore non sovrascrive il record
        await page.evaluate(() => { clearTimeout(transitionTimer); loadLevel(0); });
        await placeLabels(page, ["grep -v 'ERR'", "grep -v 'ERR'"]);
        await run(page);
        assert.deepEqual((await saved(page)).levels["1"], { stars: 3, best: 1 });
        await page.click("#result-card >> text=PROSSIMO ▶");
        await page.waitForFunction(() => document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"), null, { timeout: 7000 });
        await reload(page);
        assert.match(await page.innerText("#level-title"), /^LIVELLO 2\//);
    },

    "menu: livelli bloccati, stelle e totale": async ({ page }) => {
        await open(page, { progress: { levels: { 1: { stars: 3, best: 1 } } } });
        await page.click("#btn-menu");
        const items = await page.$$eval(".menu-level", buttons => buttons.map(b => ({ text: b.innerText, disabled: b.disabled })));
        assert.match(items[0].text, /★★★/);
        assert.equal(items[1].disabled, false, "il livello 2 è sbloccato");
        assert.equal(items[2].disabled, true, "il livello 3 è bloccato");
        assert.match(await page.innerText("#menu-total"), /Stelle totali: 3\//);
        await page.locator(".menu-level").nth(2).click({ force: true });
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//, "un livello bloccato non si apre");
        await page.keyboard.press("Escape");
        assert.equal(await page.$eval("#level-menu", menu => menu.hidden), true);
    },

    "azzerare i progressi riparte dal primo livello": async ({ page }) => {
        await open(page, { progress: { levels: { 1: { stars: 3, best: 1 }, 2: { stars: 3, best: 2 } }, lastLevel: 2 } });
        page.on("dialog", dialog => dialog.accept());
        await page.click("#btn-menu");
        await page.click("text=Azzera progressi");
        await page.evaluate(() => closeActIntro());
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
        assert.deepEqual((await saved(page)).levels, {});
    },

    "salvataggio corrotto: si riparte da zero senza errori": async ({ page }) => {
        await open(page, { rawProgress: "{rotto" });
        await page.evaluate(() => closeActIntro());
        assert.match(await page.innerText("#level-title"), /^LIVELLO 1\//);
    },

    "salvataggio del vecchio formato: si riprende e i campi nuovi partono vuoti": async ({ page }) => {
        // Formato precedente a storia e obiettivi: solo levels e lastLevel
        await open(page, { rawProgress: JSON.stringify({ levels: { 1: { stars: 3, best: 1 } }, lastLevel: 1 }) });
        assert.equal(await page.isVisible("#act-overlay"), true, "si vede l'introduzione dell'atto");
        await page.evaluate(() => closeActIntro());
        assert.match(await page.innerText("#level-title"), /^LIVELLO 2\//);
        const progress = await page.evaluate(() => progress);
        assert.deepEqual(progress.achievements, {});
        assert.deepEqual(progress.daily, {});
        assert.deepEqual(progress.seenActs, [1]);
    }
};
