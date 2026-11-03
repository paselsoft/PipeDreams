// App installabile (manifest, icone, funzionamento offline) e livelli condivisi con un link.
const { assert, open, placeLabels, run, won, consoleText, fileUrl } = require("./helpers");

const PROGRESS = { levels: { 1: { stars: 2, best: 3 } }, lastLevel: 1 };

// Link a un livello costruito nella pagina (il codice di share.js è già caricato)
const linkFor = (page, level) => page.evaluate(lvl => shareUrl(lvl, location.origin + "/index.html"), level);

const LEVEL = {
    title: "Ordina e conta", mission: "Ordina le righe <code>uniche</code>.", nudge: "Prima ordina.", hint: "sort poi uniq.",
    stdin: ["b", "a", "b"], target: ["a", "b"],
    allowedCommands: [{ cmd: "sort", desc: "Ordina" }, { cmd: "uniq", desc: "Rimuovi doppioni" }, { cmd: "head", args: { n: 1 }, desc: "Prima riga" }]
};

module.exports = {
    "pwa: manifest, icone e service worker che rende il gioco disponibile offline": async ({ page, context }) => {
        await open(page);
        const manifest = await page.evaluate(async () => {
            const link = document.querySelector("link[rel=manifest]");
            return (await fetch(link.href)).json();
        });
        assert.equal(manifest.display, "standalone");
        assert.equal(manifest.start_url, "./");
        for (const icon of manifest.icons) {
            const response = await page.request.get(fileUrl(icon.src));
            assert.equal(response.ok(), true, icon.src);
            assert.equal(response.headers()["content-type"], "image/png");
        }
        // Il service worker salva i file del gioco: senza rete la pagina si ricarica lo stesso
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.waitForFunction(async () => (await (await caches.open("pipedreams-v1")).keys()).length >= 20);
        await page.reload();
        await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
        await context.setOffline(true);
        await page.reload();
        assert.match(await page.innerText("#level-title"), /^LIVELLO/);
        await page.goto(fileUrl("index.html?sfida"));
        assert.match(await page.innerText("#level-title"), /SFIDA/);
        await context.setOffline(false);
    },

    "link condiviso: si gioca il livello, i progressi restano intatti": async ({ page }) => {
        await open(page, { progress: PROGRESS });
        const url = await linkFor(page, LEVEL);
        assert.ok(url.includes("index.html#livello="));
        await page.goto(url);
        await page.reload(); // la pagina con l'hash deve davvero caricarsi da capo
        assert.equal(await page.isVisible("#test-banner"), true);
        assert.match(await page.textContent("#test-banner-text"), /LIVELLO CONDIVISO/);
        assert.equal(await page.textContent("#test-banner-link"), "Gioca la campagna →");
        assert.match(await page.innerText("#level-title"), /Ordina e conta/);
        assert.equal(await page.innerHTML("#mission-desc"), "<strong>OBIETTIVO:</strong> Ordina le righe <code>uniche</code>.");
        await placeLabels(page, ["sort", "uniq"]);
        assert.ok(won(await run(page)));
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.progress.v1")));
        assert.deepEqual(saved.levels, PROGRESS.levels);
        assert.equal(saved.lastLevel, 1);
        await page.click("#test-banner-link");
        await page.waitForFunction(() => !location.hash && document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"));
        assert.equal(await page.isVisible("#test-banner"), false);
    },

    "link condiviso: l'obiettivo non può eseguire codice": async ({ page }) => {
        await open(page);
        const url = await linkFor(page, { ...LEVEL, mission: `Ciao <img src=x onerror="window.pwned=1"><script>window.pwned=2</script> <strong>ok</strong>` });
        await page.goto(url);
        await page.reload();
        assert.equal(await page.evaluate(() => window.pwned), undefined);
        assert.equal(await page.locator("#mission-desc img, #mission-desc script").count(), 0);
        assert.match(await page.innerText("#mission-desc"), /<img src=x/);
        assert.equal(await page.locator("#mission-desc strong").count(), 2);
    },

    "link condiviso: link rovinati o livelli non validi riportano alla campagna": async ({ page }) => {
        await open(page, { progress: PROGRESS });
        const cases = [
            [fileUrl("index.html#livello=%%%"), /danneggiato/],
            [await linkFor(page, { ...LEVEL, allowedCommands: [{ cmd: "rm", desc: "x" }] }), /comando sconosciuto/],
            [await linkFor(page, { ...LEVEL, allowedCommands: [{ cmd: "sed", args: { pattern: "(a+)+$", replacement: "" }, desc: "x" }] }), /annidati/],
            [await linkFor(page, { ...LEVEL, target: ["zzz"] }), /non ha soluzione/]
        ];
        for (const [url, message] of cases) {
            await page.goto(url);
            await page.reload();
            assert.equal(await page.isVisible("#test-banner"), false);
            assert.match(await page.textContent("#toast"), message);
            assert.match(await page.innerText("#level-title"), /^LIVELLO 2\//);
        }
    },

    "versione visibile nel gioco, nel menu e nell'editor": async ({ page }) => {
        await open(page);
        const version = await page.evaluate(() => APP_VERSION);
        assert.match(version, /^\d+\.\d+\.\d+$/);
        assert.equal(await page.textContent("#app-version"), `Pipe Dreams v${version} · versione di sviluppo · novità`);
        await page.click("#btn-menu");
        assert.equal(await page.isVisible(".menu-version"), true);
        assert.match(await page.textContent(".menu-version"), new RegExp(`v${version.replace(/\./g, "\\.")}`));
        await page.goto(fileUrl("editor.html"));
        assert.match(await page.textContent(".app-version"), /^Pipe Dreams v/);
    },

    "editor: il link del livello si apre nel gioco": async ({ page }) => {
        await open(page, { file: "editor.html" });
        await page.evaluate(() => loadFromLevel(levels[1].id));
        const url = await page.textContent("#ed-share-url");
        assert.ok(url.startsWith(fileUrl("index.html#livello=")), url);
        assert.equal(await page.$eval("#ed-share", button => button.disabled), false);
        await page.fill("#ed-title", "");
        assert.equal(await page.$eval("#ed-share", button => button.disabled), true, "niente link con errori");
        await page.goto(url);
        await page.reload();
        assert.match(await page.textContent("#test-banner-text"), /LIVELLO CONDIVISO/);
        const original = await page.evaluate(() => [currentLevel().title, levels.length]);
        assert.equal(original[1], 1);
        assert.match(await consoleText(page), /.+/);
    }
};
