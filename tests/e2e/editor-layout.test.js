// Editor dei livelli e impaginazione su schermi diversi.
const { assert, open, fileUrl } = require("./helpers");

module.exports = {
    "editor: ogni livello da comporre fa andata e ritorno identica": async ({ page }) => {
        await open(page, { file: "editor.html" });
        const differences = await page.evaluate(() => {
            const sortKeys = value => Array.isArray(value) ? value.map(sortKeys)
                : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sortKeys(value[k])])) : value;
            const same = (a, b) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
            return levels.filter(lvl => !lvl.type && !lvl.locked).flatMap(original => {
                loadFromLevel(original.id);
                const { level, errors } = buildLevel();
                const code = eval("(" + document.getElementById("ed-code").textContent + ")");
                return errors.length || !same(JSON.parse(JSON.stringify(original)), level) || !same(code, level) ? [original.id] : [];
            });
        });
        assert.deepEqual(differences, []);
    },

    "editor: un livello nuovo, la scorciatoia segnalata e la prova nel gioco": async ({ page }) => {
        await open(page, { file: "editor.html" });
        page.on("dialog", dialog => dialog.accept());
        await page.click("button:has-text('NUOVO')");
        await page.fill("#ed-title", "Prova");
        await page.fill("#ed-stdin", "b\na\na");
        await page.click("text=+ Aggiungi comando");
        await page.locator(".ed-cmd").nth(1).locator("select").selectOption("uniq");
        await page.locator(".ed-cmd").nth(1).locator(".ed-desc").fill("Rimuovi duplicati");
        const solution = page.locator("#ed-solution select");
        await solution.nth(0).selectOption("0");
        await solution.nth(1).selectOption("1");
        await solution.nth(2).selectOption("0");
        assert.match(await page.textContent("#ed-analysis"), /Scorciatoia: la tua soluzione usa 3 comandi, ma ne bastano 2/);
        await solution.nth(2).selectOption("-1");
        assert.deepEqual(await page.locator("#ed-target .chip").allInnerTexts(), ["a", "b"]);
        await page.click("#ed-play");
        await page.waitForURL(/index\.html\?test/);
        assert.match(await page.innerText("#level-title"), /Prova/);
        assert.equal(await page.isVisible("#test-banner"), true);
    },

    "nessuno scorrimento orizzontale su telefono e desktop": async ({ browser }) => {
        for (const width of [320, 390, 1440]) {
            const context = await browser.newContext({ viewport: { width, height: 900 } });
            const page = await context.newPage();
            await open(page, { progress: { levels: Object.fromEntries([...Array(43)].map((_, i) => [i + 1, { stars: 3, best: 1 }])) } });
            // Un livello per tipo, il più largo (7 slot) e la sfida
            for (const index of [0, 16, 23, 24, 25, 36, 42]) {
                await page.evaluate(i => loadLevel(i), index);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px, livello ${index + 1}`);
            }
            // Sfide di giorni diversi (titoli di lunghezze diverse) e un enigma dei casi
            for (let d = 0; d < 7; d++) {
                await page.evaluate(day => {
                    stopMarathon();
                    const key = dateKey(new Date(2026, 10, 1 + day));
                    dailyLevel = generateDaily(key);
                    showLevel(dailyLevel, `📅 SFIDA DEL ${formatDate(key)} (${dailyLevel.daily.difficulty}): ${dailyLevel.title}`);
                }, d);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px, sfida ${d + 1}`);
            }
            await page.evaluate(() => playPuzzle("ultimo-commit", "catalogo", 0));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px, enigma`);
            await page.evaluate(() => { loadDaily(); openManual("sed"); });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px, manuale`);
            await page.goto(fileUrl("editor.html"));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px, editor`);
            await context.close();
        }
    }
};
