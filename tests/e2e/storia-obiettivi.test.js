// Storia (introduzioni, messaggi, epilogo) e obiettivi.
const { assert, open, reload, placeSolution, run } = require("./helpers");

const allSolvedExceptLast = () => Object.fromEntries([...Array(28)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));

module.exports = {
    "introduzione dell'atto la prima volta, poi mai più": async ({ page }) => {
        await open(page, { seenActs: false });
        assert.equal(await page.isVisible("#act-overlay"), true);
        assert.equal(await page.textContent("#act-title"), "Primo giorno");
        await page.click("#act-button");
        assert.match(await page.innerText("#story-box"), /📨 Marco:/);
        await reload(page);
        assert.equal(await page.isVisible("#act-overlay"), false);
    },

    "ogni livello ha il suo messaggio e il menu i titoli degli atti": async ({ page }) => {
        await open(page);
        assert.equal(await page.evaluate(() => levels.every(lvl => STORY[lvl.id] && ACTS[lvl.act])), true);
        await page.click("#btn-menu");
        const acts = await page.$$eval(".menu-act", headings => headings.map(h => h.textContent));
        assert.equal(acts.length, 5);
        assert.match(acts[4], /ATTO V · Il nuovo stagista/);
    },

    "epilogo dopo l'ultimo livello": async ({ page }) => {
        await open(page, { progress: { levels: allSolvedExceptLast(), lastLevel: 28 } });
        await placeSolution(page, 28);
        await page.click("#btn-run");
        await page.waitForFunction(() => /COMPLETATO/.test(document.getElementById("console").innerText));
        assert.equal(await page.textContent("#act-label"), "EPILOGO");
    },

    "obiettivi: si sbloccano una volta, con notifica, e restano salvati": async ({ page }) => {
        await open(page);
        await placeSolution(page, 0);
        await run(page);
        assert.match(await page.textContent("#toast"), /Hello, World/);
        assert.ok(await page.evaluate(() => progress.achievements.hello));
        await page.evaluate(() => { clearTimeout(transitionTimer); openManual("grep"); openManual("sort"); openManual("uniq"); openManual("cut"); openManual("awk"); closeManual(); });
        assert.ok(await page.evaluate(() => progress.achievements.rtfm));
        await reload(page);
        await page.click("#btn-menu");
        await page.click("text=🏆 Obiettivi e statistiche");
        assert.equal(await page.locator(".achievement.unlocked").count(), 2);
        assert.match(await page.textContent(".stats-table"), /Esecuzioni\s*1/);
    },

    "senza rete: solo se il boss si risolve senza AIUTO": async ({ page }) => {
        await open(page, { progress: { levels: Object.fromEntries([...Array(6)].map((_, i) => [i + 1, { stars: 3, best: 1 }])), lastLevel: 6 } });
        await placeSolution(page, 6);
        await page.evaluate(() => showHint());
        await run(page);
        assert.equal(await page.evaluate(() => Boolean(progress.achievements["senza-rete"])), false);
        await placeSolution(page, 6);
        await run(page);
        assert.equal(await page.evaluate(() => Boolean(progress.achievements["senza-rete"])), true);
    },

    "modalità prova dell'editor: niente storia, niente progressi": async ({ page }) => {
        await open(page);
        await page.evaluate(() => localStorage.setItem("pipedreams.editor.test", JSON.stringify(levels[12])));
        const before = await page.evaluate(() => localStorage.getItem("pipedreams.progress.v1"));
        await page.goto(page.url().split("?")[0] + "?test");
        assert.equal(await page.isVisible("#test-banner"), true);
        assert.equal(await page.isVisible("#story-box"), false);
        await placeSolution(page, 0);
        await run(page);
        assert.equal(await page.evaluate(() => localStorage.getItem("pipedreams.progress.v1")), before);
    }
};
