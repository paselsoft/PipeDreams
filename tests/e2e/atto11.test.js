// Atto XI: grep -E con le espressioni regolari estese (alternative, ripetizioni, ancore, classi
// POSIX) e sed -E con le classi, per l'obiettivo LPIC-1 103.7.
const { assert, open, placeSolution, run, won, consoleText } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);

module.exports = {
    "atto XI: introduzione e la prima alternativa": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(67), lastLevel: 67, seenActs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, seenActs: false });
        assert.equal(await page.textContent("#act-label"), "ATTO XI");
        assert.equal(await page.textContent("#act-title"), "Espressioni regolari");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^LIVELLO 68\/75: O l'Uno o l'Altro/);
        assert.match(await page.innerText("#level-man"), /man regex/);
        // Senza -E la barra è un carattere come gli altri: non trova niente
        await page.evaluate(() => {
            const options = slotOptions(currentLevel());
            gridState = [options.findIndex(option => stepLabel(option) === "grep 'ERROR|CRIT'"), 0, 0];
            buildGrid();
        });
        assert.ok(!won(await run(page)));
        await placeSolution(page, await indexOf(page, 68));
        assert.ok(won(await run(page)));
        assert.match(await consoleText(page), /grep -E 'ERROR\|CRIT'/);
    },

    "atto XI: ogni livello si risolve con la soluzione di riferimento": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(75) } });
        for (const id of [69, 70, 72, 73, 74, 75]) {
            const index = await indexOf(page, id);
            await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, index);
            await placeSolution(page, index);
            assert.ok(won(await run(page)), `livello ${id}`);
        }
    },

    "atto XI: grep -E nel terminale e gli errori utili": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(75) }, settings: { inputMode: "terminal" } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 75));
        await page.fill("#terminal-input", "grep -E 'Failed|Invalid' | grep -oE '([0-9]{1,3}\\.){3}[0-9]{1,3}' | sort | uniq -c | sort -rn");
        assert.equal(await page.textContent("#terminal-error"), "");
        assert.match(await page.textContent("#shell-line"), /grep -E -o '\(\[0-9\]\{1,3\}\\\.\)\{3\}\[0-9\]\{1,3\}'/);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO|COMPLETATO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, await indexOf(page, 72));
        await page.fill("#terminal-input", "grep -Ev '^[[:space:]]*(#|$)'");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));

        await page.fill("#terminal-input", "grep -E '\\d+'");
        assert.match(await page.textContent("#terminal-error"), /\[\[:digit:\]\]/);
        await page.fill("#terminal-input", "egrep x");
        assert.match(await page.textContent("#terminal-error"), /grep -E/);
    },

    "atto XI: quiz su ?, manuale, pagina man e sezione LPI": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(75) } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 71));
        assert.equal(await page.locator(".quiz-answer").count(), 3);
        await page.click(".quiz-answer[data-correct=true]");
        await page.waitForFunction(() => /colour/.test(document.getElementById("console").innerText));
        await page.evaluate(() => { clearTimeout(transitionTimer); openManual("regex"); });
        assert.match(await page.innerText("#manual-body"), /Il più lungo vince/);
        await page.evaluate(() => openManPage("regex"));
        assert.match(await page.innerText(".man-header"), /REGEX\(1\)/);
        await page.evaluate(() => { closeManual(); openLpi("101-500", "103.7"); });
        const card = page.locator("#lpi-101-500-103-7");
        assert.equal(await card.locator(".lpi-term.in-game", { hasText: "egrep" }).count(), 1);
        assert.match(await card.innerText(), /Atto XI/);
    }
};
