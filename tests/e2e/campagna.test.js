// Livelli della campagna: ogni tipo di livello si risolve con la sua soluzione e non con quelle sbagliate.
const { assert, open, placeSolution, placeLabels, run, won, consoleText } = require("./helpers");

module.exports = {
    "ogni livello si risolve con la soluzione del solver": async ({ page }) => {
        await open(page);
        const indexes = await page.evaluate(() => levels.map((lvl, i) => lvl.type === "quiz" ? null : i).filter(i => i !== null));
        for (const index of indexes) {
            await placeSolution(page, index);
            const text = await run(page);
            assert.ok(won(text), `livello ${index + 1} non risolto:\n${text}`);
        }
    },

    "la soluzione invertita non risolve i livelli da comporre": async ({ page }) => {
        await open(page);
        const cases = await page.evaluate(() => levels
            .map((lvl, i) => ({ i, lvl }))
            .filter(({ lvl }) => !lvl.type && !lvl.locked)
            .map(({ i, lvl }) => ({ i, labels: referenceSolution(lvl).map(stepLabel).reverse() }))
            .filter(({ labels }) => labels.length > 1));
        assert.ok(cases.length >= 20);
        for (const { i, labels } of cases) {
            await page.evaluate(index => { clearTimeout(transitionTimer); loadLevel(index); }, i);
            await placeLabels(page, labels);
            const text = await run(page);
            assert.ok(!won(text), `livello ${i + 1} risolto con la sequenza invertita ${labels.join(" | ")}`);
        }
    },

    "stelle in base al par e passaggio al livello successivo": async ({ page }) => {
        await open(page);
        // Livello 1 con un comando in più del par: due stelle
        await page.evaluate(() => loadLevel(0));
        await placeLabels(page, ["grep -v 'ERR'", "grep -v 'ERR'"]);
        let text = await run(page);
        assert.match(text, /★★☆ 2 comandi \(par 1\)/);
        await page.waitForFunction(() => document.getElementById("level-title").innerText.startsWith("LIVELLO 2/"), null, { timeout: 4000 });
        // Durante il passaggio le celle restano bloccate: il livello 2 è appena caricato e intatto
        text = await consoleText(page);
        assert.match(text, /Caricato livello 2/);
    },

    "debug: una sola cella modificabile, la pipeline iniziale è sbagliata": async ({ page }) => {
        await open(page);
        const index = await page.evaluate(() => levels.findIndex(lvl => lvl.type === "debug"));
        await page.evaluate(i => loadLevel(i), index);
        assert.equal(await page.innerText("#score-display"), "Modifiche: 0/1");
        let text = await run(page);
        assert.ok(!won(text), "la pipeline iniziale non deve risolvere il livello");
        await page.evaluate(() => loadLevel(currentLevelIndex));
        await page.click("#c0");
        assert.equal(await page.innerText("#score-display"), "Modifiche: 1/1");
        assert.ok(await page.$eval("#c0", cell => cell.classList.contains("changed")));
        await page.click("#c2");
        text = await consoleText(page);
        assert.match(text, /Puoi cambiare al massimo 1 cella/);
    },

    "quiz: la risposta sbagliata spiega l'errore, quella giusta risolve": async ({ page }) => {
        await open(page);
        const index = await page.evaluate(() => levels.findIndex(lvl => lvl.type === "quiz"));
        await page.evaluate(i => loadLevel(i), index);
        assert.equal(await page.isVisible("#btn-run"), false, "nel quiz ESEGUI è nascosto");
        assert.equal(await page.innerText("#txt-target"), "?");
        assert.equal(await page.locator(".quiz-answer").count(), 3);
        const correct = await page.evaluate(() => quizAnswers(currentLevel())[0].output.join(" "));
        const buttons = page.locator(".quiz-answer");
        let wrongIndex = -1;
        let rightIndex = -1;
        for (let i = 0; i < 3; i++) {
            const text = (await buttons.nth(i).innerText()).replace(/^[ABC]\)\s*/, "").replace(/\s+/g, " ").trim();
            if (text === correct.replace(/\s+/g, " ").trim()) rightIndex = i; else wrongIndex = i;
        }
        await buttons.nth(wrongIndex).click();
        assert.match(await consoleText(page), /Risposta sbagliata[\s\S]*La pipeline di quell'output/);
        await buttons.nth(rightIndex).click();
        assert.match(await consoleText(page), /Risposta giusta[\s\S]*★★☆ Risolto in 2 tentativi/);
    },

    "celle bloccate: non si cambiano e non contano nel par": async ({ page }) => {
        await open(page);
        const index = await page.evaluate(() => levels.findIndex(lvl => lvl.locked));
        await page.evaluate(i => loadLevel(i), index);
        const before = await page.evaluate(() => gridState.join(","));
        await page.click("#c0");
        assert.equal(await page.evaluate(() => gridState.join(",")), before);
        assert.match(await consoleText(page), /cella è bloccata/);
        await placeSolution(page, index);
        const text = await run(page);
        assert.match(text, /★★★ Soluzione ottimale/);
    }
};
