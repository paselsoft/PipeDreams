// Il consigliere: dopo 3 tentativi sbagliati il personaggio del livello dà un consiglio mirato.
const fs = require("fs");
const path = require("path");
const { assert, open, placeLabels, run, consoleText } = require("./helpers");

// Esegue e aspetta che l'esecuzione sbagliata sia contata
const failRun = async page => {
    const before = await page.evaluate(() => levelSession.failures || 0);
    await page.click("#btn-run");
    await page.waitForFunction(n => (levelSession.failures || 0) > n && !isBusy, before);
};

module.exports = {
    "consigliere: la diagnosi riconosce il tipo di errore senza svelare la soluzione": async ({ page }) => {
        await open(page);
        const cases = await page.evaluate(() => {
            const lvl = (target, targetStderr) => ({ target, targetStderr });
            const res = (output, stderr = []) => ({ output, stderr });
            return {
                doppioni: diagnoseFailure(lvl(["a", "b"]), res(["a", "a", "b"])),
                ordine: diagnoseFailure(lvl(["b", "c", "a"]), res(["a", "b", "c"])),
                numeri: diagnoseFailure(lvl(["9", "10", "100"]), res(["10", "100", "9"])),
                rovescio: diagnoseFailure(lvl(["a", "b", "c"]), res(["c", "b", "a"])),
                troppe: diagnoseFailure(lvl(["a", "b"]), res(["a", "x", "b"])),
                mancano: diagnoseFailure(lvl(["a", "b", "c"]), res(["a", "c"])),
                maiuscole: diagnoseFailure(lvl(["ANNA", "LUCA"]), res(["anna", "luca"])),
                campi: diagnoseFailure(lvl(["anna", "luca"]), res(["anna:30", "luca:25"])),
                taglio: diagnoseFailure(lvl(["anna:30", "luca:25"]), res(["anna", "luca"])),
                conteggio: diagnoseFailure(lvl(["3"]), res(["5"])),
                vuoto: diagnoseFailure(lvl(["a"]), res([])),
                stderr: diagnoseFailure(lvl(["a"]), res(["a"], ["ERR x"])),
                giusto: diagnoseFailure(lvl(["a"]), res(["a"]))
            };
        });
        assert.match(cases.doppioni, /doppioni/);
        assert.match(cases.ordine, /righe giuste, ma in un ordine diverso/);
        assert.match(cases.numeri, /numeri come testo/);
        assert.match(cases.rovescio, /ordine rovesciato/);
        assert.match(cases.troppe, /di troppo/);
        assert.match(cases.mancano, /ne mancano/);
        assert.match(cases.maiuscole, /maiuscole e minuscole/);
        assert.match(cases.campi, /pezzi in più/);
        assert.match(cases.taglio, /tagliando troppo/);
        assert.match(cases.conteggio, /conteggio non torna/);
        assert.match(cases.vuoto, /Non esce niente/);
        assert.match(cases.stderr, /stderr/);
        assert.equal(cases.giusto, null);
        // Nessun consiglio contiene le righe attese
        assert.doesNotMatch(cases.ordine + cases.troppe + cases.mancano, /\b[abc]\b/);
    },

    "consigliere: compare al terzo errore con l'avatar del livello, poi la spinta gratis": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(1));   // sort | uniq, missione di Marco
        await placeLabels(page, ["sort"]);          // restano i doppioni
        await run(page);
        await failRun(page);
        assert.equal(await page.isVisible("#advisor"), false, "non dopo due errori");
        await failRun(page);
        assert.equal(await page.isVisible("#advisor"), true);
        assert.equal(await page.getAttribute("#advisor-avatar .avatar", "data-character"), "marco");
        assert.equal(await page.getAttribute("#advisor-avatar .avatar", "data-mood"), "preoccupato");
        assert.match(await page.textContent("#advisor-text"), /doppioni/);
        await page.click("#advisor-nudge");
        assert.equal(await page.isVisible("#advisor"), false);
        assert.match(await consoleText(page), /AIUTO 1 · SPINTA/);
        assert.equal(await page.evaluate(() => levelSession.hintTier), 1);
        // Una volta chiuso, non torna in questo livello
        await failRun(page);
        assert.equal(await page.isVisible("#advisor"), false);
        // Con la soluzione giusta le stelle non risentono del consiglio
        await placeLabels(page, ["sort", "uniq"]);
        assert.match(await run(page), /★★★/);
    },

    "consigliere: si aggiorna mentre è aperto, si spegne nelle impostazioni, non c'è nella Maratona": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(1));
        await placeLabels(page, ["sort"]);
        await run(page);
        await failRun(page);
        await failRun(page);
        assert.match(await page.textContent("#advisor-text"), /doppioni/);
        await placeLabels(page, ["uniq"]);          // ora l'ordine è sbagliato e restano doppioni lontani
        await failRun(page);
        assert.equal(await page.isVisible("#advisor"), true);
        await page.click("#advisor >> text=GRAZIE");
        // Interruttore nelle impostazioni
        await page.click("#btn-advisor");
        assert.equal(await page.getAttribute("#btn-advisor", "aria-pressed"), "false");
        await page.evaluate(() => loadLevel(1));
        await placeLabels(page, ["sort"]);
        await run(page);
        await failRun(page);
        await failRun(page);
        assert.equal(await page.isVisible("#advisor"), false);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.settings.v1")).advisor), false);
        // Riacceso, ma nella Maratona resta zitto
        await page.click("#btn-advisor");
        await page.evaluate(() => startMarathon());
        for (let i = 0; i < 3; i++) await failRun(page);
        assert.equal(await page.isVisible("#advisor"), false);
    },

    "consigliere: nei casi parla chi racconta il capitolo; nessuna violazione axe": async ({ page }) => {
        await open(page);
        await page.evaluate(() => { progress.levels = Object.fromEntries(levels.map(lvl => [lvl.id, { stars: 3, best: 1 }])); playPuzzle("caffe-scomparso", "b42", 0); });
        for (let i = 0; i < 3; i++) await failRun(page);
        assert.equal(await page.getAttribute("#advisor-avatar .avatar", "data-character"), "giulia");
        let axe = null;
        try { axe = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8"); } catch (e) { /* axe non installato */ }
        if (axe) {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document.getElementById("advisor"), { resultTypes: ["violations"] })).violations.map(v => v.id));
            assert.deepEqual(violations, []);
        }
    }
};
