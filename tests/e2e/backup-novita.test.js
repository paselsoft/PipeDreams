// Backup dei progressi, novità della versione e avviso di aggiornamento.
const fs = require("fs");
const { APP_VERSION, assert, open, fileUrl } = require("./helpers");

const PROGRESS = {
    levels: { 1: { stars: 3, best: 2 }, 2: { stars: 1, best: 5 } }, lastLevel: 2,
    stats: { runs: 12, manualRead: ["grep"] }, achievements: { hello: "2026-10-01" },
    daily: { "2026-11-01": { stars: 2, used: 4, attempts: 1, seconds: 30 } }, marathon: { best: 4, played: 2 }
};

const savedProgress = page => page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.progress.v1")));

// Un secondo dispositivo: contesto nuovo, progressi vuoti
async function otherDevice(browser, progress = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, acceptDownloads: true });
    const page = await context.newPage();
    await open(page, { progress });
    return { context, page };
}

module.exports = {
    "backup: il codice copiato su un altro dispositivo e unito": async ({ page, browser }) => {
        await open(page, { progress: PROGRESS });
        await page.click("#btn-menu");
        await page.click("text=💾 Backup progressi");
        assert.equal(await page.isVisible("#backup-overlay"), true);
        assert.match(await page.textContent("#backup-summary"), /^2\/\d+ livelli · 4 ★ · 1 obiettivi · 1 sfide del giorno$/);
        const code = await page.inputValue("#backup-code");
        assert.ok(code.startsWith("PIPEDREAMS1:"));

        const other = await otherDevice(browser, { levels: { 2: { stars: 3, best: 3 }, 3: { stars: 2, best: 4 } }, lastLevel: 3, marathon: { best: 6 } });
        await other.page.click("#btn-menu");
        await other.page.click("text=💾 Backup progressi");
        await other.page.fill("#backup-input", code);
        await other.page.click("#backup-merge");
        assert.equal(await other.page.isVisible("#backup-overlay"), false);
        const merged = await savedProgress(other.page);
        assert.deepEqual(merged.levels, { 1: { stars: 3, best: 2 }, 2: { stars: 3, best: 3 }, 3: { stars: 2, best: 4 } });
        assert.equal(merged.lastLevel, 3);
        assert.deepEqual(merged.marathon, { best: 6, played: 2 });
        assert.equal(merged.achievements.hello, "2026-10-01");
        assert.equal(merged.stats.runs, 12);
        assert.match(await other.page.textContent("#toast"), /Progressi uniti: 3\//);
        assert.match(await other.page.innerText("#level-title"), /^LIVELLO 4\//, "riprende dall'ultimo livello");
        await other.context.close();
    },

    "backup: il file scaricato sostituisce i progressi": async ({ page, browser }) => {
        await open(page, { progress: PROGRESS });
        await page.evaluate(() => openBackup());
        const other = await otherDevice(browser, { levels: { 5: { stars: 3, best: 2 } } });
        const [download] = await Promise.all([page.waitForEvent("download"), page.click("text=⬇ SCARICA FILE")]);
        assert.match(download.suggestedFilename(), /^pipedreams-backup-\d{4}-\d{2}-\d{2}\.json$/);
        const file = await download.path();
        assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).version, APP_VERSION);

        await other.page.evaluate(() => openBackup());
        await other.page.setInputFiles("#backup-file", file);
        await other.page.waitForFunction(() => /Scegli UNISCI o SOSTITUISCI/.test(document.getElementById("backup-message").textContent));
        let dialog = "";
        other.page.once("dialog", d => { dialog = d.message(); d.accept(); });
        await other.page.click("#backup-replace");
        assert.match(dialog, /Sostituire i progressi attuali \(1\//);
        assert.deepEqual((await savedProgress(other.page)).levels, PROGRESS.levels);
        await other.context.close();
    },

    "backup: codici sbagliati, dati modificati a mano e annullamento": async ({ page }) => {
        await open(page, { progress: PROGRESS });
        await page.evaluate(() => openBackup());
        const tryCode = async code => {
            await page.fill("#backup-input", code);
            await page.click("#backup-merge");
            return page.textContent("#backup-message");
        };
        assert.match(await tryCode(""), /Incolla un codice/);
        assert.match(await tryCode("ciao"), /Non è un backup/);
        assert.match(await tryCode("PIPEDREAMS1:%%%"), /danneggiato/);
        assert.match(await tryCode(JSON.stringify({ app: "altro", progress: { levels: {} } })), /Non è un backup/);
        assert.deepEqual((await savedProgress(page)).levels, PROGRESS.levels, "nessuna modifica dopo un errore");
        // Valori con la forma sbagliata vengono scartati, il resto si ripristina
        const hacked = JSON.stringify({ app: "pipedreams", progress: { levels: { 9: { stars: 3, best: 1 }, 10: { stars: 99, best: 1 }, 11: "x" },
            achievements: { guru: 5, rtfm: "2026-11-02" }, stats: { runs: -3 }, seenActs: "no" } });
        page.once("dialog", d => d.dismiss());
        await page.fill("#backup-input", hacked);
        await page.click("#backup-replace");
        assert.deepEqual((await savedProgress(page)).levels, PROGRESS.levels, "annullato: nulla cambia");
        await page.click("#backup-merge");
        const saved = await savedProgress(page);
        assert.deepEqual(saved.levels, { ...PROGRESS.levels, 9: { stars: 3, best: 1 } });
        assert.deepEqual(saved.achievements, { hello: "2026-10-01", rtfm: "2026-11-02" });
        assert.equal(saved.stats.runs, 12);
    },

    "novità: la versione apre l'elenco delle novità, anche nell'editor": async ({ page }) => {
        await open(page);
        await page.click("#app-version");
        assert.equal(await page.isVisible("#changelog-overlay"), true);
        assert.match(await page.innerText("#changelog-body"), new RegExp(`v${APP_VERSION.replace(/\./g, "\\.")} · .* \\(questa versione\\)`));
        assert.match(await page.innerText("#changelog-body"), /Backup dei progressi/);
        await page.click("#changelog-overlay .menu-close");
        assert.equal(await page.isVisible("#changelog-overlay"), false);
        await page.click("#btn-menu");
        await page.click(".menu-version");
        assert.equal(await page.isVisible("#changelog-overlay"), true);
        await page.goto(fileUrl("editor.html"));
        await page.focus(".app-version button");
        await page.keyboard.press("Enter");
        assert.equal(await page.isVisible("#changelog-overlay"), true);
    },

    "novità: avviso dopo un aggiornamento, non per un giocatore nuovo": async ({ page, browser }) => {
        await open(page, { progress: PROGRESS, settings: { lastVersion: "0.9.0" } });
        assert.match(await page.textContent("#toast"), new RegExp(`Pipe Dreams v${APP_VERSION.replace(/\./g, "\\.")}: tocca la versione`));
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.settings.v1")).lastVersion), APP_VERSION);
        await page.reload();
        assert.equal(await page.isVisible("#toast"), false, "una volta sola");

        const context = await browser.newContext();
        const fresh = await context.newPage();
        await open(fresh, { seenActs: false, settings: { lastVersion: undefined } });
        assert.equal(await fresh.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.settings.v1")).lastVersion), APP_VERSION);
        assert.doesNotMatch(await fresh.evaluate(() => document.getElementById("toast").textContent), /tocca la versione/);
        await context.close();
    },

    "aggiornamento: quando il service worker cambia compare AGGIORNA": async ({ page }) => {
        await open(page);
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.reload();
        await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
        assert.equal(await page.isVisible("#update-banner"), false);
        await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event("controllerchange")));
        assert.equal(await page.isVisible("#update-banner"), true);
        await page.click("#update-banner button");
        await page.waitForFunction(() => document.readyState === "complete" && document.getElementById("update-banner").hidden);
    }
};
