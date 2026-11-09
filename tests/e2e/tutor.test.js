// Tutor: il livello appena risolto spiegato passo passo.
const fs = require("fs");
const path = require("path");
const { assert, open, placeSolution, placeLabels, run, won } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);
const body = page => page.innerText("#tutor-body");

module.exports = {
    "tutor dopo la vittoria: obiettivo, un passo per comando, risultato; ferma l'avanti automatico": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(10) } });
        const index = await indexOf(page, 11);
        assert.equal(await page.isVisible("#btn-tutor"), false);
        await placeSolution(page, index);
        assert.ok(won(await run(page)));
        assert.equal(await page.isVisible("#btn-tutor"), true);
        await page.click("#btn-tutor");
        assert.equal(await page.isVisible("#tutor-overlay"), true);
        assert.equal(await page.textContent("#tutor-title"), "🎓 TUTOR · La Classifica");
        assert.match(await body(page), /L'obiettivo/);
        assert.match(await body(page), /sort \| uniq -c \| sort -rn \| head -n 2/);
        assert.equal(await page.textContent("#tutor-pos"), "1 di 6");
        assert.equal(await page.isDisabled("#tutor-prev"), true);

        await page.click("#tutor-next");
        assert.match(await body(page), /Passo 1: sort/);
        assert.match(await body(page), /riordina le righe/);
        assert.match(await body(page), /prima[\s\S]*dopo/);
        assert.match(await body(page), /Perché serve qui:/);
        await page.keyboard.press("ArrowRight");
        assert.match(await body(page), /Passo 2: uniq -c/);
        assert.match(await body(page), /-c\s+scrive davanti a ogni riga quante volte/);
        assert.match(await body(page), /Senza, /);
        await page.keyboard.press("ArrowLeft");
        assert.match(await body(page), /Passo 1: sort/);
        for (let i = 0; i < 4; i++) await page.click("#tutor-next");
        assert.match(await body(page), /Il risultato/);
        assert.match(await body(page), /3 rosso/);
        assert.equal(await page.textContent("#tutor-next"), "Fine ✓");

        // Il passaggio automatico si è fermato: si resta sul livello
        await page.waitForTimeout(4000);
        assert.equal(await page.evaluate(() => currentLevel().id), 11);
        assert.equal(await page.isVisible("#btn-next"), true);
        await page.click("#tutor-next");
        assert.equal(await page.isVisible("#tutor-overlay"), false);
    },

    "tutor: dal menu sui livelli risolti, pagina man, soluzione più corta": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(3) } });
        await page.click("#btn-menu");
        assert.equal(await page.locator(".menu-tutor").count(), 3, "solo i livelli risolti");
        await page.click(".menu-tutor >> nth=1");
        assert.equal(await page.isVisible("#tutor-overlay"), true);
        assert.match(await page.textContent("#tutor-title"), /Ordinamento e Duplicati/);
        await page.click("#tutor-next");
        await page.click("#tutor-body .manual-man");
        assert.equal(await page.isVisible("#tutor-overlay"), false);
        assert.equal(await page.textContent("#manual-title"), "📄 man sort");
        await page.click("#manual-overlay .menu-close");

        // Una soluzione più lunga del par: il risultato mostra la più corta e il passo inutile
        await page.evaluate(() => { clearTimeout(transitionTimer); loadLevel(1); });
        await placeLabels(page, ["sort", "sort", "uniq"]);
        assert.ok(won(await run(page)));
        await page.click("#btn-tutor");
        await page.click("#tutor-next");
        assert.match(await body(page), /qui non serve/);
        for (let i = 0; i < 3; i++) await page.click("#tutor-next");
        assert.match(await body(page), /più corta[\s\S]*sort \| uniq/);
    },

    "tutor: quiz con le risposte sbagliate e debug con la pipeline rotta": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(30) } });
        const quiz = await page.evaluate(() => levels.findIndex(lvl => lvl.type === "quiz"));
        await page.evaluate(i => loadLevel(i), quiz);
        await page.click(".quiz-answer[data-correct=true]");
        await page.waitForSelector("#btn-tutor:not([hidden])");
        await page.click("#btn-tutor");
        await page.click("#tutor-overlay .menu-close");
        await page.evaluate(i => openTutor(levels[i], gridSteps(levels[i], levels[i].start)), quiz);
        const pages = await page.evaluate(() => tutor.lesson.passes.length + 2);
        for (let i = 1; i < pages; i++) await page.click("#tutor-next");
        assert.match(await body(page), /Le risposte sbagliate/);

        const debug = await page.evaluate(() => levels.findIndex(lvl => lvl.type === "debug"));
        await page.evaluate(i => openTutor(levels[i], tutorStepsFor(levels[i])), debug);
        const debugPages = await page.evaluate(() => tutor.lesson.passes.length + 2);
        for (let i = 1; i < debugPages; i++) await page.click("#tutor-next");
        assert.match(await body(page), /era rotta/);
        await page.keyboard.press("Escape");
        assert.equal(await page.isVisible("#tutor-overlay"), false);
    },

    "tutor: a 320px senza scorrimento orizzontale e nessuna violazione axe": async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await open(page, { progress: { levels: solvedUpTo(50) } });
        const index = await indexOf(page, 50);
        await page.evaluate(i => openTutor(levels[i], tutorStepsFor(levels[i])), index);
        for (let i = 0; i < 4; i++) {
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            assert.ok(overflow <= 0, `scorrimento orizzontale di ${overflow}px alla pagina ${i + 1}`);
            await page.click("#tutor-next");
        }
        let axe = null;
        try { axe = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [process.cwd(), path.join(__dirname, "..", "..")] }), "utf8"); } catch (e) { /* axe non installato */ }
        if (axe) {
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document.getElementById("tutor-overlay"), { resultTypes: ["violations"] })).violations.map(v => v.id));
            assert.deepEqual(violations, []);
        }
    }
};
