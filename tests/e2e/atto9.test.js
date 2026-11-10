// Atto IX: le opzioni trovate nelle pagine man (grep -c -i -w, sort -u, uniq -u, cut con più
// campi e --complement, wc -w e -c).
const { assert, open, placeSolution, run, won, consoleText } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);

module.exports = {
    "atto IX: introduzione con Nadia e grep -c al primo livello": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(50), lastLevel: 50, seenActs: [1, 2, 3, 4, 5, 6, 7, 8] }, seenActs: false });
        assert.equal(await page.textContent("#act-label"), "ATTO IX");
        assert.equal(await page.textContent("#act-title"), "Leggere il manuale");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^LIVELLO 51\/67: Il Conto in un Colpo/);
        assert.match(await page.innerText("#level-man"), /man grep/);
        await placeSolution(page, await indexOf(page, 51));
        assert.ok(won(await run(page)));
        assert.match(await consoleText(page), /Soluzione ottimale \(1 comando/);
    },

    "atto IX: ogni livello si risolve con la soluzione di riferimento": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(59) } });
        for (const id of [52, 53, 54, 55, 56, 58, 59]) {
            const index = await indexOf(page, id);
            await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, index);
            await placeSolution(page, index);
            assert.ok(won(await run(page)), `livello ${id}`);
        }
    },

    "atto IX: le nuove opzioni nel terminale": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(59) }, settings: { inputMode: "terminal" } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 59));
        await page.fill("#terminal-input", "grep -i failed | cut -d' ' -f6 | sort -u | wc -l");
        assert.equal(await page.textContent("#terminal-error"), "");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO|COMPLETATO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, await indexOf(page, 56));
        await page.fill("#terminal-input", "grep -v nologin | cut -d: -f1,7");
        assert.match(await page.textContent("#shell-line"), /cut -d':' -f1,7/);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, await indexOf(page, 58));
        await page.fill("#terminal-input", "tr -s ' ' | wc -c");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));

        await page.fill("#terminal-input", "uniq -du");
        assert.match(await page.textContent("#terminal-error"), /-d e -u insieme/);
    },

    "atto IX: manuale, Tutor e quiz su --complement": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(59) } });
        await page.evaluate(() => openManual("grep"));
        assert.match(await page.innerText("#manual-body"), /Parole intere \(-w\)/);
        await page.evaluate(() => openManual("wc"));
        assert.match(await page.innerText("#manual-body"), /Contare i byte \(-c\)/);
        await page.evaluate(() => closeManual());

        const quiz = await indexOf(page, 57);
        await page.evaluate(i => loadLevel(i), quiz);
        await page.click(".quiz-answer[data-correct=true]");
        await page.waitForSelector("#btn-tutor:not([hidden])");
        await page.click("#btn-tutor");
        await page.click("#tutor-next");
        assert.match(await page.innerText("#tutor-body"), /--complement\s+capovolge la scelta/);
    }
};
