// Tutorial guidato al primo avvio e accessibilità (tastiera, finestre, lettori di schermo, colori).
const fs = require("fs");
const path = require("path");
const { assert, open, consoleText, fileUrl } = require("./helpers");

const NEW_PLAYER = { seenActs: false, settings: { tutorialDone: undefined } };

// axe-core, se installato (in CI: npm install --no-save axe-core)
function axeSource() {
    try {
        return fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8");
    } catch (e) {
        return null;
    }
}

module.exports = {
    "tutorial: un nuovo giocatore viene guidato fino al primo livello risolto": async ({ page }) => {
        await open(page, NEW_PLAYER);
        // Prima l'introduzione dell'atto, poi il tutorial
        assert.equal(await page.isVisible("#act-overlay"), true);
        assert.equal(await page.isVisible("#coach"), false);
        await page.click("#act-button");
        await page.waitForSelector("#coach:not([hidden])");
        assert.equal(await page.textContent("#coach-count"), "Tutorial 1/5");
        assert.ok(await page.$eval("#txt-stdin", el => el.classList.contains("coach-target")));
        await page.click("#coach-next");
        assert.ok(await page.$eval("#txt-target", el => el.classList.contains("coach-target")));
        await page.click("#coach-next");
        assert.match(await page.textContent("#coach-text"), /finché compare «grep -v 'ERR'»/);
        assert.equal(await page.isVisible("#coach-next"), false, "si avanza solo facendo la cosa richiesta");
        // Si avanza solo con il comando giusto
        for (let i = 0; i < 10 && (await page.textContent("#coach-count")) === "Tutorial 3/5"; i++) await page.click("#c0");
        assert.equal(await page.textContent("#coach-count"), "Tutorial 4/5");
        await page.click("#btn-run");
        await page.waitForFunction(() => document.getElementById("coach-count").textContent === "Tutorial 5/5");
        assert.match(await page.textContent("#coach-text"), /primo livello risolto/);
        await page.waitForFunction(() => document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"), null, { timeout: 5000 });
        assert.equal(await page.isVisible("#coach"), true, "resta aperto sul livello 2 per l'ultimo messaggio");
        await page.click("#coach-next");
        assert.equal(await page.isVisible("#coach"), false);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.settings.v1")).tutorialDone), true);
        await page.reload();
        assert.equal(await page.isVisible("#coach"), false, "una volta sola");
    },

    "tutorial: si salta, non disturba chi ha già giocato e si rivede dal menu": async ({ page, browser }) => {
        await open(page, NEW_PLAYER);
        await page.click("#act-button");
        await page.waitForSelector("#coach:not([hidden])");
        await page.click("#coach-skip");
        assert.equal(await page.isVisible("#coach"), false);
        assert.equal(await page.evaluate(() => settings.tutorialDone), true);
        await page.click("#btn-menu");
        await page.click("text=🎓 Rivedi il tutorial");
        assert.equal(await page.textContent("#coach-count"), "Tutorial 1/5");
        // Andare in un altro livello chiude il tutorial
        await page.evaluate(() => loadLevel(5));
        assert.equal(await page.isVisible("#coach"), false);

        const context = await browser.newContext();
        const veteran = await context.newPage();
        await open(veteran, { progress: { levels: { 1: { stars: 3, best: 1 } } }, settings: { tutorialDone: undefined } });
        await veteran.waitForTimeout(200);
        assert.equal(await veteran.isVisible("#coach"), false);
        assert.equal(await veteran.evaluate(() => settings.tutorialDone), true);
        await context.close();
    },

    "tastiera: si risolve un livello senza mouse": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(1));
        await page.focus("#c0");
        // ↓ comando successivo, ↑ precedente, Invio come un tocco
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowUp");
        assert.match(await page.getAttribute("#c0", "aria-label"), /^Cella 1: sort, .*Invio per il comando successivo/);
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement.id), "c1");
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        assert.match(await page.getAttribute("#c1", "aria-label"), /^Cella 2: uniq/);
        await page.focus("#btn-run");
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
        assert.equal(await page.getAttribute("#console", "role"), "log");
    },

    "finestre: il focus entra, Tab resta dentro, Esc chiude e il focus torna": async ({ page }) => {
        await open(page);
        await page.focus("#btn-menu");
        await page.keyboard.press("Enter");
        assert.equal(await page.isVisible("#level-menu"), true);
        await page.waitForFunction(() => document.getElementById("level-menu").contains(document.activeElement));
        for (let i = 0; i < 60; i++) await page.keyboard.press("Tab");
        assert.ok(await page.evaluate(() => document.getElementById("level-menu").contains(document.activeElement)), "Tab non esce dalla finestra");
        await page.keyboard.press("Escape");
        assert.equal(await page.isVisible("#level-menu"), false);
        assert.equal(await page.evaluate(() => document.activeElement.id), "btn-menu");
        // Anche le finestre senza ✕ e quelle create dopo
        await page.evaluate(() => showActIntro(2));
        await page.keyboard.press("Escape");
        assert.equal(await page.isVisible("#act-overlay"), false);
        await page.click("#app-version button");
        await page.keyboard.press("Escape");
        assert.equal(await page.isVisible("#changelog-overlay"), false);
    },

    "colori per daltonici e simboli oltre al colore": async ({ page }) => {
        await open(page);
        await page.click("#btn-cvd");
        assert.ok(await page.evaluate(() => document.body.classList.contains("cvd")));
        assert.equal(await page.getAttribute("#btn-cvd", "aria-pressed"), "true");
        await page.reload();
        assert.ok(await page.evaluate(() => document.body.classList.contains("cvd")), "la scelta resta salvata");
        await page.evaluate(() => loadLevel(0));
        await page.evaluate(() => { gridState[0] = 1; buildGrid(); });
        await page.click("#btn-run");
        await page.waitForFunction(() => /FALLIMENTO|SUCCESSO/.test(document.getElementById("console").innerText));
        const marks = await page.$$eval("#stream-lines .chip", chips => chips.map(chip => getComputedStyle(chip, "::before").content));
        assert.ok(marks.every(mark => mark === '"✓ "' || mark === '"✗ "' || mark === "none"), marks.join(","));
        assert.match(await page.textContent("#stream-title"), /✓ corretto, ✗ sbagliato/);
    },

    "axe: nessun problema di accessibilità in gioco, menu, manuale, tutorial ed editor": async ({ page }) => {
        const axe = axeSource();
        if (!axe) {
            console.log("    (axe-core non installato: controllo saltato)");
            return;
        }
        const audit = async name => {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations
                .map(v => `${v.impact} ${v.id}: ${v.nodes.slice(0, 2).map(n => n.target.join(" ")).join(" · ")}`));
            assert.deepEqual(violations, [], name);
        };
        await open(page, NEW_PLAYER);
        await audit("introduzione dell'atto");
        await page.click("#act-button");
        await page.waitForSelector("#coach:not([hidden])");
        await audit("tutorial");
        await page.click("#coach-skip");
        await audit("gioco");
        await page.evaluate(() => openMenu());
        await audit("menu");
        await page.evaluate(() => { closeMenu(); openManual("sort"); });
        await audit("manuale");
        await page.evaluate(() => { closeManual(); openBackup(); });
        await audit("backup");
        await page.evaluate(() => { closeBackup(); openTrainingMenu(); });
        await audit("allenamento");
        await page.evaluate(() => { closeTrainingMenu(); openGallery(); });
        await audit("galleria");
        await page.evaluate(() => {
            closeGallery();
            progress.levels = Object.fromEntries(levels.filter(lvl => lvl.act <= 3).map(lvl => [lvl.id, { stars: 3, best: 1 }]));
            openStory("server-fantasma");
        });
        await audit("casi");
        await page.evaluate(() => openDeduction("server-fantasma", "le-3-14"));
        await audit("deduzione");
        await page.goto(fileUrl("editor.html"));
        await audit("editor");
    }
};
