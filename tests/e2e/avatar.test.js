// Avatar dei personaggi: ritratti validi, espressioni, e dove compaiono nel gioco.
const { assert, open } = require("./helpers");

const solveCurrent = page => page.evaluate(() => {
    const options = slotOptions(currentLevel());
    gridState = new Array(gridState.length).fill(0);
    solveLevel(currentLevel()).optimalSteps[0].forEach((step, i) => { gridState[i] = options.indexOf(step); });
    buildGrid();
});

module.exports = {
    "avatar: ogni ritratto è 16×16, in ogni espressione, con i colori della tavolozza": async ({ page }) => {
        await open(page);
        const problems = await page.evaluate(() => Object.entries(CHARACTERS).flatMap(([id, character]) => MOODS.flatMap(mood => {
            const rows = avatarRows(character, mood);
            const palette = { ...AVATAR_SKIN, ...character.palette, ".": true };
            const bad = rows.length !== 16 || rows.some(row => row.length !== 16 || [...row].some(c => !palette[c]));
            // Le espressioni devono essere davvero diverse
            const same = mood !== "normale" && rows.join() === avatarRows(character, "normale").join();
            return bad || same ? [`${id}/${mood}`] : [];
        })));
        assert.deepEqual(problems, []);
        // Ogni personaggio che parla nei livelli, nelle sfide e nei casi ha un ritratto
        const speakers = await page.evaluate(() => [...new Set([
            ...Object.values(STORY).map(message => message.from),
            ...STORIES.flatMap(story => [story.finale, ...story.chapters.map(chapter => chapter.from)])
        ])]);
        for (const name of speakers) assert.ok(await page.evaluate(n => Boolean(characterByName(n)), name), name);
    },

    "avatar: nel messaggio, preoccupato nelle emergenze e decorativo per i lettori di schermo": async ({ page }) => {
        await open(page);
        await page.evaluate(() => loadLevel(0));
        const avatar = page.locator("#story-avatar .avatar");
        assert.equal(await avatar.getAttribute("data-character"), "marco");
        assert.equal(await avatar.getAttribute("data-mood"), "normale");
        assert.equal(await avatar.getAttribute("aria-hidden"), "true");
        assert.equal(await page.locator("#story-avatar svg rect").count() > 100, true);
        // Livello con 🚨: Giulia preoccupata
        await page.evaluate(() => loadLevel(levels.findIndex(lvl => STORY[lvl.id] && STORY[lvl.id].text.includes("🚨"))));
        assert.equal(await avatar.getAttribute("data-mood"), "preoccupato");
        // Allenamento: nessun personaggio, l'iniziale
        await page.evaluate(() => startTraining("sort"));
        assert.equal(await page.textContent("#story-avatar .avatar"), "A");
        assert.ok(await page.$eval("#story-avatar .avatar", node => node.classList.contains("avatar-initial")));
    },

    "avatar: capitoli, deduzione che cambia espressione e finale del caso": async ({ page }) => {
        await open(page);
        await page.evaluate(() => { progress.levels = Object.fromEntries(levels.map(lvl => [lvl.id, { stars: 3, best: 1 }])); });
        // Nell'elenco dei capitoli, chi racconta
        await page.evaluate(() => openStory("caffe-scomparso"));
        assert.deepEqual(await page.$$eval(".story-chapter > .avatar", nodes => nodes.map(node => node.dataset.character)), ["marco", "giulia", "tommaso", "giulia"]);
        // Schermata del capitolo: avatar grande
        await page.evaluate(() => startChapter("caffe-scomparso", "capsule"));
        assert.equal(await page.getAttribute("#act-avatar .avatar", "data-character"), "marco");
        assert.ok(await page.$eval("#act-avatar .avatar", node => node.classList.contains("avatar-big")));
        await page.click("#act-button");
        // Deduzione: sbagliata -> preoccupato, giusta -> contento
        await page.evaluate(() => {
            const state = storyProgress("caffe-scomparso");
            for (const puzzle of ["badge", "bevanda", "orari"]) state.puzzles["capsule/" + puzzle] = { stars: 3, best: 1 };
            openDeduction("caffe-scomparso", "capsule");
        });
        const asker = page.locator(".deduction-asker .avatar");
        assert.equal(await asker.getAttribute("data-mood"), "normale");
        await page.click(".deduction-option >> nth=1");
        assert.equal(await asker.getAttribute("data-mood"), "preoccupato");
        await page.click(".deduction-option >> nth=0");
        assert.equal(await asker.getAttribute("data-mood"), "contento");
        // Finale: il personaggio della rivelazione, contento
        await page.evaluate(() => {
            const state = storyProgress("caffe-scomparso");
            for (const chapter of STORIES.find(story => story.id === "caffe-scomparso").chapters) state.chapters[chapter.id] = { stars: 3, attempts: 1 };
            openStory("caffe-scomparso");
        });
        await page.click("text=📜 Rileggi il finale");
        assert.equal(await page.getAttribute("#act-avatar .avatar", "data-character"), "elena");
        assert.equal(await page.getAttribute("#act-avatar .avatar", "data-mood"), "contento");
        // Il personaggio nuovo: Nadia racconta il primo capitolo delle stampe di mezzanotte
        await page.evaluate(() => startChapter("stampe-mezzanotte", "mezzanotte"));
        assert.equal(await page.getAttribute("#act-avatar .avatar", "data-character"), "nadia");
        // Le introduzioni degli atti sono un racconto: nessun avatar
        await page.evaluate(() => showActIntro(2));
        assert.equal(await page.isVisible("#act-avatar"), false);
    },

    "avatar: autori della galleria e partita di un enigma con l'avatar nel messaggio": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openGallery());
        const authors = await page.$$eval(".gallery-item > .avatar", nodes => nodes.map(node => node.dataset.character));
        assert.ok(authors.length > 0 && authors.every(Boolean), authors.join(","));
        await page.evaluate(() => { closeGallery(); progress.levels = Object.fromEntries(levels.map(lvl => [lvl.id, { stars: 3, best: 1 }])); playPuzzle("ultimo-commit", "errori", 0); });
        assert.equal(await page.getAttribute("#story-avatar .avatar", "data-character"), "giulia");
        await solveCurrent(page);
        await page.click("#btn-run");
        await page.waitForFunction(() => /Indizio nel taccuino/.test(document.getElementById("console").innerText));
    }
};
