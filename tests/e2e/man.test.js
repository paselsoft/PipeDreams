// Pagine man: dal pulsante della scheda e scrivendo «man X» nel terminale.
const fs = require("fs");
const path = require("path");
const { assert, open, consoleText } = require("./helpers");

const actsDone = () => Object.fromEntries([...Array(23)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));

module.exports = {
    "man: ogni scheda ha la sua pagina con le sezioni di man": async ({ page }) => {
        await open(page);
        const ids = await page.evaluate(() => MANUAL.map(entry => entry.id));
        assert.deepEqual(await page.evaluate(() => MANUAL.filter(entry => !MAN_PAGES[entry.id]).map(entry => entry.id)), []);
        for (const id of ids) {
            await page.evaluate(entryId => openManPage(entryId), id);
            const headings = await page.locator(".man-heading").allInnerTexts();
            assert.deepEqual(headings.filter(h => ["NOME", "SINOSSI", "DESCRIZIONE", "ESEMPI", "VEDI ANCHE", "NOTE"].includes(h)),
                ["NOME", "SINOSSI", "DESCRIZIONE", "ESEMPI", "VEDI ANCHE", "NOTE"], id);
            assert.ok(await page.locator(".man-example").count() >= 2, id);
        }
        // Collegamenti di VEDI ANCHE verso schede esistenti, nomi unici
        const problems = await page.evaluate(() => {
            const out = [];
            const seen = new Set();
            for (const [id, pg] of Object.entries(MAN_PAGES)) {
                pg.seeAlso.forEach(other => { if (!MAN_PAGES[other]) out.push(`${id} → ${other}`); });
                pg.names.forEach(name => { if (seen.has(name)) out.push(`doppio ${name}`); seen.add(name); });
            }
            return out;
        });
        assert.deepEqual(problems, []);
    },

    "man sort: titolo, opzioni ed esempio con l'output del motore": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openManual("sort"));
        await page.click(".manual-man");
        assert.equal(await page.textContent("#manual-title"), "📄 man sort");
        assert.equal(await page.textContent(".man-header"), "SORT(1)Manuale di Pipe DreamsSORT(1)");
        assert.match(await page.innerText(".man-options"), /-r\s+ordine inverso/);
        const firstExample = await page.locator(".man-example .man-pre").first().innerText();
        assert.match(firstExample, /^\$ printf .*\| LC_ALL=C sort/);
        // Da VEDI ANCHE a un'altra pagina, poi «← Indietro» torna alla scheda di sort
        await page.click(".man-see-also >> text=uniq(1)");
        assert.equal(await page.textContent("#manual-title"), "📄 man uniq");
        await page.click("#manual-back");
        assert.equal(await page.textContent("#manual-title"), "sort");
        assert.equal(await page.locator(".man-page").count(), 0, "la scheda non resta in stile man");
    },

    "terminale: man X apre la pagina e non conta come tentativo": async ({ page }) => {
        await open(page, { progress: { levels: actsDone(), lastLevel: 1 }, settings: { inputMode: "terminal" } });
        await page.evaluate(() => loadLevel(1));
        await page.fill("#terminal-input", "man head");
        assert.equal(await page.textContent("#terminal-error"), "", "nessun errore di sintassi per man");
        await page.press("#terminal-input", "Enter");
        assert.equal(await page.isVisible("#manual-overlay"), true);
        assert.equal(await page.textContent("#manual-title"), "📄 man head");
        assert.match(await page.innerText(".man-section"), /head, tail - /);
        assert.equal(await page.isVisible("#manual-back"), false);
        assert.equal(await page.evaluate(() => levelSession.attempts), 0);
        assert.equal(await page.inputValue("#terminal-input"), "");
        await page.click("#manual-overlay .menu-close");

        for (const [line, message] of [["man pacman", null], ["man ls", /Nessuna voce di manuale per ls/], ["man", /Quale pagina di manuale vuoi/]]) {
            await page.fill("#terminal-input", line);
            await page.press("#terminal-input", "Enter");
            if (message) {
                assert.match(await consoleText(page), message);
                assert.equal(await page.isVisible("#manual-overlay"), false);
            } else {
                assert.match(await page.innerText(".man-header"), /APT\(1\)/);
                await page.click("#manual-overlay .menu-close");
            }
        }
        assert.equal(await page.evaluate(() => levelSession.attempts), 0);
        // Una pipeline normale funziona ancora
        await page.fill("#terminal-input", "sort | uniq");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
    },

    "man: impaginazione a 320px e nessuna violazione axe": async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await open(page);
        await page.evaluate(() => openManPage("pacchetti"));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `scorrimento orizzontale di ${overflow}px`);
        const wide = await page.$$eval(".man-page *", nodes => nodes.filter(n => n.getBoundingClientRect().right > window.innerWidth + 1).map(n => n.className || n.tagName));
        assert.deepEqual(wide, []);
        let axe = null;
        try { axe = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8"); } catch (e) { /* axe non installato */ }
        if (axe) {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document.getElementById("manual-overlay"), { resultTypes: ["violations"] })).violations.map(v => v.id));
            assert.deepEqual(violations, []);
        }
    }
};
