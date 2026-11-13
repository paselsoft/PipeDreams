// Sincronizzazione dei progressi con un repository GitHub privato (sync.js). L'API di GitHub è
// simulata: un finto repository in memoria risponde a GET e PUT come api.github.com.
const { assert, open, placeSolution, run, won, reload } = require("./helpers");

const REPO = "paselsoft/pipedreams-progressi";
const TOKEN = "github_pat_finto";
const fromBase64 = data => Buffer.from(data, "base64").toString("utf8");
const toBase64 = text => Buffer.from(text, "utf8").toString("base64");

// Finto GitHub: file del repository, richieste ricevute, risposte forzate e conflitti
async function fakeGitHub(page, { file = null, conflicts = 0, status = null, offline = false } = {}) {
    const github = { file, sha: file ? "sha-0" : null, puts: [], requests: [], conflicts, status, offline, version: 0 };
    await page.route("https://api.github.com/**", async route => {
        const request = route.request();
        const url = new URL(request.url());
        github.requests.push(`${request.method()} ${url.pathname}`);
        if (github.offline) return route.abort("internetdisconnected");
        if (request.headers().authorization !== `Bearer ${TOKEN}`) return route.fulfill({ status: 401, json: { message: "Bad credentials" } });
        if (github.status) return route.fulfill({ status: github.status, json: { message: "forzato" } });
        if (url.pathname === `/repos/${REPO}`) return route.fulfill({ json: { full_name: REPO, private: true } });
        if (url.pathname !== `/repos/${REPO}/contents/progressi.json`) return route.fulfill({ status: 404, json: { message: "Not Found" } });
        if (request.method() === "GET") {
            if (!github.file) return route.fulfill({ status: 404, json: { message: "Not Found" } });
            return route.fulfill({ json: { sha: github.sha, content: toBase64(github.file).replace(/(.{60})/g, "$1\n") } });
        }
        const body = request.postDataJSON();
        github.puts.push(body);
        // Un altro dispositivo ha appena salvato: lo sha non è più quello giusto
        if (github.conflicts > 0) {
            github.conflicts--;
            github.file = JSON.stringify({ app: "pipedreams", progress: { levels: { 9: { stars: 3, best: 3 } }, lastLevel: 8 } });
            github.sha = `sha-altro-${github.version++}`;
            return route.fulfill({ status: 409, json: { message: "conflict" } });
        }
        if ((body.sha || null) !== github.sha) return route.fulfill({ status: 409, json: { message: "sha" } });
        github.file = fromBase64(body.content);
        github.sha = `sha-${++github.version}`;
        return route.fulfill({ status: github.version === 1 && !body.sha ? 201 : 200, json: { content: { sha: github.sha } } });
    });
    return github;
}

const remoteProgress = github => JSON.parse(github.file).progress;
const connected = { "pipedreams.sync.v1": JSON.stringify({ token: TOKEN, repo: REPO }) };

// Le risposte 404/409/401 finte compaiono nella console come «Failed to load resource»: sono previste
const dropResourceErrors = pageErrors => {
    for (let i = pageErrors.length - 1; i >= 0; i--) if (/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(pageErrors[i])) pageErrors.splice(i, 1);
};

async function openWith(page, storage, options) {
    await page.addInitScript(entries => {
        if (sessionStorage.getItem("sync-init")) return;
        sessionStorage.setItem("sync-init", "1");
        for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    }, storage);
    await open(page, options);
}

const waitStatus = (page, pattern) => page.waitForFunction(source => new RegExp(source).test(syncState.status), pattern.source);

module.exports = {
    "sincronizzazione: collegare la chiave crea il file su GitHub": async ({ page, pageErrors }) => {
        const github = await fakeGitHub(page);
        await open(page, { progress: { levels: { 1: { stars: 3, best: 1 }, 2: { stars: 2, best: 4 } }, lastLevel: 2 } });
        await page.evaluate(() => openBackup());
        assert.equal(await page.isVisible("#sync-off"), true);
        assert.equal(await page.inputValue("#sync-repo-input"), REPO);
        await page.click("#sync-connect");
        assert.match(await page.textContent("#sync-message"), /Incolla la chiave/);
        await page.fill("#sync-token", TOKEN);
        await page.click("#sync-connect");
        await page.waitForSelector("#sync-on:not([hidden])");
        await waitStatus(page, /^Sincronizzato alle/);
        assert.equal(github.puts.length, 1);
        assert.equal(github.puts[0].sha, undefined, "file nuovo: senza sha");
        assert.match(github.puts[0].message, /2\/75 livelli/);
        assert.deepEqual(Object.keys(remoteProgress(github).levels), ["1", "2"]);
        // La chiave è salvata solo in questo browser, e il campo si svuota
        assert.equal(await page.inputValue("#sync-token"), "");
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.sync.v1")).token), TOKEN);
        dropResourceErrors(pageErrors);
    },

    "sincronizzazione: all'apertura unisce i progressi degli altri dispositivi": async ({ page, pageErrors }) => {
        const github = await fakeGitHub(page, {
            file: JSON.stringify({ app: "pipedreams", progress: { levels: { 1: { stars: 3, best: 1 }, 2: { stars: 3, best: 2 }, 3: { stars: 3, best: 3 } }, lastLevel: 3 } })
        });
        await openWith(page, connected, { progress: { levels: { 1: { stars: 2, best: 2 }, 5: { stars: 1, best: 9 } }, lastLevel: 0 } });
        await waitStatus(page, /^Sincronizzato alle/);
        const local = await page.evaluate(() => progress.levels);
        // Per ogni livello il risultato migliore, da una parte o dall'altra
        assert.deepEqual(local, { 1: { stars: 3, best: 1 }, 2: { stars: 3, best: 2 }, 3: { stars: 3, best: 3 }, 5: { stars: 1, best: 9 } });
        assert.deepEqual(remoteProgress(github).levels, local);
        assert.match(await page.textContent("#toast"), /aggiornati da un altro dispositivo/);
        // Non aveva ancora toccato niente: si ritrova all'ultimo livello giocato altrove
        assert.equal(await page.evaluate(() => currentLevelIndex), 3);
        dropResourceErrors(pageErrors);
    },

    "sincronizzazione: un livello risolto va su GitHub dopo qualche secondo": async ({ page, pageErrors }) => {
        const github = await fakeGitHub(page, { file: JSON.stringify({ app: "pipedreams", progress: { levels: {}, lastLevel: 0 } }) });
        await openWith(page, connected, {});
        await waitStatus(page, /^Sincronizzato alle/);
        const first = github.puts.length;
        await page.evaluate(() => syncNow());
        assert.equal(github.puts.length, first, "niente di nuovo: nessun salvataggio");
        await page.evaluate(() => { syncState.delay = 50; });
        await placeSolution(page, 0);
        assert.ok(won(await run(page)));
        await page.waitForFunction(() => syncState.status.startsWith("Sincronizzato") && !syncState.timer && !syncState.running);
        assert.ok(github.puts.length > first);
        assert.equal(remoteProgress(github).levels[1].stars, 3);
        dropResourceErrors(pageErrors);
    },

    "sincronizzazione: se un altro dispositivo salva insieme, riscarica e riunisce": async ({ page, pageErrors }) => {
        const github = await fakeGitHub(page, { conflicts: 1 });
        await openWith(page, connected, { progress: { levels: { 1: { stars: 3, best: 1 } } } });
        await waitStatus(page, /^Sincronizzato alle/);
        // Primo PUT respinto (409); poi c'è il livello 9 dell'altro dispositivo: si uniscono
        assert.equal(github.puts.length, 2);
        assert.deepEqual(Object.keys(remoteProgress(github).levels).sort(), ["1", "9"]);
        assert.deepEqual(Object.keys(await page.evaluate(() => progress.levels)).sort(), ["1", "9"]);
        dropResourceErrors(pageErrors);
    },

    "sincronizzazione: chiave sbagliata, permessi, rete assente e scollegamento": async ({ page, pageErrors }) => {
        const github = await fakeGitHub(page);
        await open(page, {});
        await page.evaluate(() => openBackup());
        await page.fill("#sync-token", "chiave-sbagliata");
        await page.click("#sync-connect");
        await page.waitForFunction(() => /non è valida o è scaduta/.test(document.getElementById("sync-message").textContent));
        assert.equal(await page.isVisible("#sync-off"), true);
        assert.equal(await page.evaluate(() => localStorage.getItem("pipedreams.sync.v1")), null);

        await page.fill("#sync-token", TOKEN);
        await page.click("#sync-connect");
        await waitStatus(page, /^Sincronizzato alle/);
        github.status = 403;
        await page.click("#sync-now");
        await waitStatus(page, /permesso di scrivere/);
        github.status = null;
        github.offline = true;
        await page.click("#sync-now");
        await waitStatus(page, /Senza connessione/);
        assert.match(await page.textContent("#sync-status"), /Senza connessione/);
        // Torna la rete: il browser lo segnala e si risincronizza da solo
        github.offline = false;
        await page.evaluate(() => window.dispatchEvent(new Event("online")));
        await waitStatus(page, /^Sincronizzato alle/);

        page.once("dialog", dialog => dialog.accept());
        await page.click("#sync-disconnect");
        assert.equal(await page.isVisible("#sync-off"), true);
        assert.equal(await page.evaluate(() => localStorage.getItem("pipedreams.sync.v1")), null);
        const before = github.requests.length;
        await page.evaluate(() => { persistProgress(); return syncNow(); });
        assert.equal(github.requests.length, before, "scollegato: nessuna richiesta a GitHub");
        dropResourceErrors(pageErrors);
    },

    "sincronizzazione: senza chiave non contatta GitHub; finestra a 320px e axe": async ({ page }) => {
        const github = await fakeGitHub(page);
        await page.setViewportSize({ width: 320, height: 700 });
        await open(page, {});
        await page.evaluate(() => { persistProgress(); openBackup(); });
        await page.waitForTimeout(100);
        assert.equal(github.requests.length, 0);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `scorrimento orizzontale di ${overflow}px`);
        const fs = require("fs");
        const path = require("path");
        let axe = null;
        try { axe = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8"); } catch (e) { /* axe non installato */ }
        if (axe) {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document.getElementById("backup-overlay"), { resultTypes: ["violations"] })).violations.map(v => v.id + ": " + v.nodes.length));
            assert.deepEqual(violations, []);
        }
    }
};
