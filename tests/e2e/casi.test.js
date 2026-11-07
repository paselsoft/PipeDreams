// Casi a puntate: sblocco, capitoli, enigmi con stdout nascosto, taccuino, deduzione e finale.
const { assert, open, consoleText } = require("./helpers");

// Livelli degli atti I-III risolti: i casi si sbloccano
const actsUpTo3 = page => page.evaluate(() => {
    progress.levels = Object.fromEntries(levels.filter(lvl => lvl.act <= 3).map(lvl => [lvl.id, { stars: 3, best: 1 }]));
    persistProgress();
});

const solveCurrent = page => page.evaluate(() => {
    const options = slotOptions(currentLevel());
    gridState = new Array(gridState.length).fill(0);
    solveLevel(currentLevel()).optimalSteps[0].forEach((step, i) => { gridState[i] = options.indexOf(step); });
    buildGrid();
});

module.exports = {
    "casi: bloccati all'inizio, poi un capitolo intero con indizi e deduzione": async ({ page }) => {
        await open(page);
        await page.click("#btn-menu");
        await page.click("#menu-stories");
        assert.match(await page.innerText("#stories-body"), /Si sblocca completando l'Atto II\b/);
        assert.match(await page.innerText("#stories-body"), /Si sblocca completando l'Atto III/);
        assert.equal(await page.$eval("#stories-body .gallery-play", button => button.disabled), true);
        await page.keyboard.press("Escape");

        await actsUpTo3(page);
        await page.evaluate(() => openStories());
        await page.click("[aria-label='Apri il caso Il server fantasma']");
        assert.match(await page.textContent("#stories-title"), /IL SERVER FANTASMA/);
        assert.equal(await page.locator(".story-chapter.open").count(), 1, "solo il primo capitolo è aperto");
        assert.equal(await page.locator(".story-chapter.locked").count(), 4);
        await page.locator(".story-chapter.open .gallery-play").click();
        assert.equal(await page.textContent("#act-label"), "📚 IL SERVER FANTASMA · CAPITOLO 1");
        await page.click("#act-button");

        // Enigma 1: lo stdout atteso è nascosto
        assert.match(await page.innerText("#level-title"), /^📚 CAP\. 1 · Accessi Notturni \(1\/2\)/);
        assert.equal(await page.textContent("#txt-target"), "🔒 nascosto: è l'indizio (1 riga)");
        assert.equal(await page.isVisible("#mystery-bar"), true);
        await solveCurrent(page);
        await page.click("#btn-run");
        await page.waitForFunction(() => document.getElementById("level-title").innerText.includes("(2/2)"), null, { timeout: 6000 });
        assert.ok(await page.evaluate(() => progress.stories["server-fantasma"].puzzles["le-3-14/chi"].stars === 3));
        // Enigma 2, poi la deduzione
        await solveCurrent(page);
        await page.click("#btn-run");
        await page.waitForFunction(() => /DEDUZIONE/.test(document.getElementById("stories-title").textContent), null, { timeout: 6000 });
        const body = await page.innerText("#stories-body");
        assert.match(body, /Chi entra alle 03:14:\s*bruno/);
        assert.match(body, /Da quale indirizzo:\s*10\.0\.0\.42/);
        // Una risposta sbagliata, poi quella giusta: due tentativi, due stelle
        await page.click(".deduction-option >> nth=1");
        assert.match(await page.textContent(".deduction-feedback"), /^✗ No: 10\.0\.0\.42 è un indirizzo interno/);
        assert.equal(await page.$eval(".deduction-option >> nth=1", button => button.disabled), true);
        await page.click(".deduction-option >> nth=0");
        assert.match(await page.textContent(".deduction-feedback"), /^✓ Esatto!.*★★☆$/);
        assert.deepEqual(await page.evaluate(() => progress.stories["server-fantasma"].chapters["le-3-14"]), { stars: 2, attempts: 2, hints: 0 });
        await page.click("#stories-body >> text=CAPITOLO SUCCESSIVO ▶");
        assert.equal(await page.textContent("#act-label"), "📚 IL SERVER FANTASMA · CAPITOLO 2");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^📚 CAP\. 2 · Quanti File\?/);
        // Il taccuino dalla barra del caso
        await page.click("#mystery-bar >> text=🗒 Taccuino");
        assert.match(await page.innerText("#stories-body"), /1\. Le 3:14/);
        await page.keyboard.press("Escape");
        await page.click("#mystery-bar >> text=✕ Esci");
        assert.equal(await page.isVisible("#mystery-bar"), false);
        assert.match(await page.innerText("#level-title"), /^LIVELLO /);
    },

    "casi: ultimo capitolo, finale, obiettivi, date di uscita e backup": async ({ page }) => {
        await open(page);
        await actsUpTo3(page);
        // Tutti gli enigmi risolti e i capitoli 1-4 dedotti al primo colpo
        await page.evaluate(() => {
            const story = STORIES[0];
            const state = storyProgress(story.id);
            story.chapters.forEach((chapter, i) => {
                chapter.puzzles.forEach(puzzle => { state.puzzles[puzzleKey(chapter, puzzle)] = { stars: 3, best: 1 }; });
                if (i < 4) state.chapters[chapter.id] = { stars: 3, attempts: 1 };
            });
            persistProgress();
        });
        await page.evaluate(() => openDeduction("server-fantasma", "caso-chiuso"));
        assert.match(await page.innerText("#stories-body"), /Il taccuino/);
        assert.match(await page.innerText("#stories-body"), /Macchina con l'indirizzo 10\.0\.0\.42:\s*portatile-bruno/);
        await page.click(".deduction-option >> nth=0");
        assert.ok(await page.evaluate(() => progress.achievements.detective && progress.achievements.sherlock));
        await page.click("#stories-body >> text=📜 IL FINALE");
        assert.equal(await page.textContent("#act-label"), "CASO CHIUSO");
        assert.match(await page.textContent("#act-text"), /una riga dimenticata in un crontab/);
        // Un capitolo con una data futura resta chiuso
        const status = await page.evaluate(() => {
            const story = { ...STORIES[0], chapters: STORIES[0].chapters.map((chapter, i) => i === 1 ? { ...chapter, release: "2999-01-01" } : chapter) };
            progress.stories[story.id].chapters = { "le-3-14": { stars: 3, attempts: 1 } };
            return chapterStatus(story, 1);
        });
        assert.equal(status, "soon");
        // Il backup porta anche i casi
        const restored = await page.evaluate(() => readBackup(backupCode(progress)).progress.stories["server-fantasma"]);
        assert.equal(Object.keys(restored.puzzles).length, 9);
    },

    "casi: aiuti nella deduzione, statistiche e righe dell'indizio": async ({ page }) => {
        await open(page);
        await actsUpTo3(page);
        await page.evaluate(() => {
            const state = storyProgress("server-fantasma");
            state.puzzles["le-3-14/chi"] = { stars: 3, best: 3 };
            state.puzzles["le-3-14/da-dove"] = { stars: 2, best: 4 };
            persistProgress();
            openDeduction("server-fantasma", "le-3-14");
        });
        // Aiuto 1: suggerimento e indizi da guardare evidenziati
        await page.click(".deduction-help");
        assert.match(await page.textContent(".deduction-hint"), /^💡 Gli indirizzi 10\.x sono della rete interna/);
        assert.equal(await page.locator(".notebook-clue.clue-focus").count(), 2);
        // Aiuto 2: una risposta sbagliata eliminata, poi la giusta vale al massimo ★★
        await page.click(".deduction-help");
        assert.equal(await page.locator(".deduction-option.eliminated").count(), 1);
        assert.equal(await page.$eval(".deduction-help", button => button.disabled), true);
        await page.click(".deduction-option >> nth=0");
        assert.deepEqual(await page.evaluate(() => progress.stories["server-fantasma"].chapters["le-3-14"]), { stars: 2, attempts: 1, hints: 2 });
        // Statistiche del caso
        await page.click("#stories-back");
        const stats = await page.innerText(".story-stats");
        assert.match(stats, /Capitoli\s+1\/5/);
        assert.match(stats, /Stelle negli enigmi\s+5\/27/);
        assert.match(stats, /Stelle nelle deduzioni\s+2\/15/);
        assert.match(stats, /Deduzioni al primo colpo\s+1\/5/);
        assert.match(stats, /Aiuti nelle deduzioni\s+2/);
        // Enigma con risultato sbagliato: il gioco dice quante righe ha l'indizio
        await page.evaluate(() => playPuzzle("server-fantasma", "cosa-sparisce", 0));
        await page.evaluate(() => {
            const options = slotOptions(currentLevel());
            gridState = [options.findIndex(o => stepLabel(o) === "grep '03:14'"), 0, 0, 0];
            buildGrid();
        });
        await page.click("#btn-run");
        await page.waitForFunction(() => /FALLIMENTO/.test(document.getElementById("console").innerText));
        assert.match(await consoleText(page), /L'indizio ha 1 riga, la tua uscita 4\./);
    },

    "casi: gli enigmi si risolvono anche nel terminale": async ({ page }) => {
        await open(page, { settings: { inputMode: "terminal" } });
        await actsUpTo3(page);
        await page.evaluate(() => playPuzzle("server-fantasma", "crontab", 0));
        assert.equal(await page.isVisible("#mode-toggle"), true);
        assert.equal(await page.evaluate(() => document.body.dataset.input), "terminal");
        assert.equal(await page.textContent(".terminal-prompt"), "$ crontab -l");
        await page.fill("#terminal-input", "grep '14 3 ' | sed -E 's/^14 3 \\* \\* \\* //'");
        assert.equal(await page.textContent("#terminal-error"), "");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /Indizio nel taccuino/.test(document.getElementById("console").innerText), null, { timeout: 6000 });
        assert.ok(await page.evaluate(() => progress.stories["server-fantasma"].puzzles["crontab/comando"]));
        assert.ok(await page.evaluate(() => progress.achievements.terminalista));
    },

    "casi: ogni caso si sblocca con il suo atto; stderr nascosto e indizio nel taccuino": async ({ page }) => {
        await open(page);
        const unlocked = () => page.evaluate(() => STORIES.map(story => storyOpen(story)));
        await page.evaluate(() => { progress.levels = Object.fromEntries(levels.filter(lvl => lvl.act <= 6).map(lvl => [lvl.id, { stars: 3, best: 1 }])); });
        const byId = async () => Object.fromEntries(await page.evaluate(() => STORIES.map(story => [story.id, storyOpen(story)])));
        assert.deepEqual(await byId(), { "server-fantasma": true, "messaggio-nascosto": true, "pacchetto-avvelenato": false, "caffe-scomparso": true, "ultimo-commit": false });
        await page.evaluate(() => { progress.levels = Object.fromEntries(levels.map(lvl => [lvl.id, { stars: 3, best: 1 }])); persistProgress(); });
        assert.ok((await unlocked()).every(Boolean));
        await page.evaluate(() => openStories());
        assert.equal(await page.locator("#stories-body .gallery-play:not([disabled])").count(), 5);
        // In ordine di atto: il caffè (Atto II) per primo
        assert.match(await page.textContent("#stories-body .story-item strong"), /Il caffè scomparso/);
        // Enigma con tee: anche lo stderr atteso è nascosto, e l'indizio lo comprende
        await page.evaluate(() => {
            const state = storyProgress("pacchetto-avvelenato");
            for (const chapter of ["cpu", "origine", "sorgente"]) state.chapters[chapter] = { stars: 3, attempts: 1 };
            playPuzzle("pacchetto-avvelenato", "diffusione", 0);
        });
        assert.equal(await page.isVisible("#row-target-stderr"), true);
        assert.match(await page.textContent("#txt-target-stderr"), /nascosto: fa parte dell'indizio \(3 righe\)/);
        await solveCurrent(page);
        await page.click("#btn-run");
        await page.waitForFunction(() => /DEDUZIONE/.test(document.getElementById("stories-title").textContent), null, { timeout: 6000 });
        const clue = await page.innerText("#stories-body");
        assert.match(clue, /Server con fast-json-tools.*:\s*3\s*gatto\s*mela\s*zebra/s);
    },

    "casi: ogni enigma di ogni caso si risolve nel gioco e lascia il suo indizio": async ({ page }) => {
        await open(page, { settings: { speed: "istantanea" } });
        await page.evaluate(() => { progress.levels = Object.fromEntries(levels.map(lvl => [lvl.id, { stars: 3, best: 1 }])); });
        const puzzles = await page.evaluate(() => STORIES.flatMap(story => story.chapters.flatMap(chapter =>
            chapter.puzzles.map((puzzle, index) => ({ story: story.id, chapter: chapter.id, index, key: chapter.id + "/" + puzzle.id })))));
        assert.ok(puzzles.length >= 39);
        for (const puzzle of puzzles) {
            await page.evaluate(p => { clearTimeout(transitionTimer); closeStories(); playPuzzle(p.story, p.chapter, p.index); }, puzzle);
            await solveCurrent(page);
            await page.click("#btn-run");
            await page.waitForFunction(() => /Indizio nel taccuino/.test(document.getElementById("console").innerText), null, { timeout: 6000 })
                .catch(() => { throw new Error(`enigma non risolto: ${puzzle.story} ${puzzle.key}`); });
            assert.ok(await page.evaluate(p => Boolean(progress.stories[p.story].puzzles[p.key]), puzzle), puzzle.key);
        }
        await page.evaluate(() => clearTimeout(transitionTimer));
    }
};
