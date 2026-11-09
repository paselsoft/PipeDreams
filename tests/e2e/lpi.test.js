// Sezione LPI: obiettivi d'esame con peso, link alle lezioni in italiano, comandi nel gioco,
// livelli che allenano l'obiettivo, casella «studiato» (anche nel backup) e collegamento dal Tutor.
const fs = require("fs");
const path = require("path");
const { assert, open, placeSolution, run, won } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const card = id => `#lpi-101-500-${id.replace(/\./g, "-")}`;

module.exports = {
    "lpi: esame 101 con pesi, lezioni in italiano, comandi nel gioco e livelli": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(12) } });
        await page.click("#btn-menu");
        await page.click("#menu-lpi");
        assert.equal(await page.isVisible("#lpi-overlay"), true);
        assert.equal(await page.getAttribute("#lpi-tab-101", "aria-selected"), "true");
        assert.equal(await page.locator(".lpi-objective").count(), 23);
        assert.match(await page.textContent("#lpi-summary"), /Studiati: 0 obiettivi su 23 \(peso 0 su 60\)\. Pipe Dreams allena 103\.2, 103\.4, 103\.7 \(peso 9 su 60\)/);

        const filters = page.locator(card("103.2"));
        assert.match(await filters.innerText(), /Elaborare flussi di testo utilizzando i filtri/);
        assert.match(await filters.innerText(), /peso 2/);
        assert.equal(await filters.locator("a.lpi-link").getAttribute("href"), "https://learning.lpi.org/it/learning-materials/101-500/103/103.2/");
        assert.equal(await filters.locator("a.lpi-link").getAttribute("target"), "_blank");
        assert.equal(await filters.locator(".lpi-term.in-game", { hasText: "sort" }).count(), 1);
        assert.equal(await filters.locator(".lpi-term:not(.in-game)", { hasText: "od" }).count(), 1, "od non è nel gioco");
        assert.ok(await filters.locator("button.lpi-level").count() >= 2, "livelli che allenano l'obiettivo");

        // Un livello risolto si apre dal pulsante; quelli bloccati sono disabilitati
        await filters.locator("button.lpi-level").first().click();
        assert.equal(await page.isVisible("#lpi-overlay"), false);
        assert.equal(await page.isVisible("#level-menu"), false);
        assert.match(await page.innerText("#level-title"), /^LIVELLO /);
    },

    "lpi: studiato resta salvato, entra nel backup; schede 102 e Linux Essentials": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openLpi());
        await page.locator(card("103.4")).locator("input[type=checkbox]").check();
        assert.match(await page.textContent("#lpi-summary"), /Studiati: 1 obiettivi su 23 \(peso 4 su 60\)/);
        await page.reload();
        assert.equal(await page.evaluate(() => progress.lpi["101-500:103.4"]), true);
        const backup = await page.evaluate(() => JSON.stringify(cleanProgress(progress)));
        assert.match(backup, /"lpi":\{"101-500:103\.4":true\}/);

        await page.evaluate(() => openLpi());
        await page.click("#lpi-tab-102");
        assert.equal(await page.getAttribute("#lpi-tab-102", "aria-selected"), "true");
        assert.equal(await page.locator(".lpi-objective").count(), 19);
        assert.match(await page.innerText("#lpi-body"), /105\.2 Personalizzare o scrivere semplici script/);
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.getAttribute("#lpi-tab-le", "aria-selected"), "true");
        assert.match(await page.innerText("#lpi-body"), /Linux Essentials 2\.0/);
        assert.match(await page.textContent("#lpi-summary"), /peso 0 su 40/);
        assert.match(await page.innerText("#lpi-body"), /CC BY-NC-ND 4\.0/);
    },

    "lpi: dal Tutor all'obiettivo d'esame": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(1) } });
        await page.evaluate(() => loadLevel(1));
        await placeSolution(page, 1);
        assert.ok(won(await run(page)));
        await page.click("#btn-tutor");
        await page.click("#tutor-next");
        await page.click("#tutor-body button:has-text('📘 LPI 103.2')");
        assert.equal(await page.isVisible("#tutor-overlay"), false);
        assert.equal(await page.isVisible("#lpi-overlay"), true);
        assert.match(await page.getAttribute(card("103.2"), "class"), /lpi-highlight/);
    },

    "lpi: a 320px senza scorrimento orizzontale e nessuna violazione axe": async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await open(page);
        await page.evaluate(() => openLpi());
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `scorrimento orizzontale di ${overflow}px`);
        let axe = null;
        try { axe = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8"); } catch (e) { /* axe non installato */ }
        if (axe) {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document.getElementById("lpi-overlay"), { resultTypes: ["violations"] })).violations.map(v => v.id + ": " + v.nodes.length));
            assert.deepEqual(violations, []);
        }
    }
};
