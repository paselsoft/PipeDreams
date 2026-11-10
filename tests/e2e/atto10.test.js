// Atto X: md5sum, sha256sum, od -c e zcat/bzcat/xzcat (gli strumenti che mancavano a LPIC-1 103.2).
const { assert, open, placeSolution, run, won, consoleText } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);

module.exports = {
    "atto X: introduzione e l'impronta md5sum": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(59), lastLevel: 59, seenActs: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, seenActs: false });
        assert.equal(await page.textContent("#act-label"), "ATTO X");
        assert.equal(await page.textContent("#act-title"), "Verso l'esame");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^LIVELLO 60\/67: L'Impronta/);
        assert.match(await page.innerText("#txt-target"), /^[0-9a-f]{32} {2}-$/);
        await placeSolution(page, await indexOf(page, 60));
        assert.ok(won(await run(page)));
    },

    "atto X: ogni livello si risolve con la soluzione di riferimento": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(67) } });
        for (const id of [61, 62, 64, 65, 66, 67]) {
            const index = await indexOf(page, id);
            await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, index);
            await placeSolution(page, index);
            assert.ok(won(await run(page)), `livello ${id}`);
        }
    },

    "atto X: file compresso nel pannello e comandi nel terminale": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(67) }, settings: { inputMode: "terminal" } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 64));
        assert.match(await page.innerText("#level-files"), /file syslog\.1\.gz \(compresso, qui decompresso\):/);
        await page.fill("#terminal-input", "zcat syslog.1.gz | grep -c OOM");
        assert.equal(await page.textContent("#terminal-error"), "");
        assert.match(await page.textContent("#shell-line"), /zcat <\(printf '%s\\n' .* \| gzip\)/);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, await indexOf(page, 62));
        await page.fill("#terminal-input", "grep admin | od -c");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
        await page.fill("#terminal-input", "od -x");
        assert.match(await page.textContent("#terminal-error"), /od -c/);
    },

    "atto X: quiz su od -c, manuale e sezione LPI": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(67) } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 63));
        await page.click(".quiz-answer[data-correct=true]");
        await page.waitForFunction(() => /0000004/.test(document.getElementById("console").innerText));
        await page.evaluate(() => { clearTimeout(transitionTimer); openManual("od"); });
        assert.match(await page.innerText("#manual-body"), /Una tabulazione nascosta/);
        await page.evaluate(() => openManPage("impronte"));
        assert.match(await page.innerText(".man-header"), /MD5SUM\(1\)/);
        await page.evaluate(() => { closeManual(); openLpi("101-500", "103.2"); });
        const card = page.locator("#lpi-101-500-103-2");
        assert.equal(await card.locator(".lpi-term.in-game", { hasText: "md5sum" }).count(), 1);
        assert.equal(await card.locator(".lpi-term.in-game", { hasText: "zcat" }).count(), 3, "zcat, bzcat e xzcat sono tutti nel gioco");
    }
};
