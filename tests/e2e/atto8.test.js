// Atto VIII: tr -s, sort -h, xargs e fold sugli output di ps, du, ss, df e auth.log.
const { assert, open, placeSolution, run, won, consoleText } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);

module.exports = {
    "atto VIII: introduzione e primo livello con tr -s": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(43), lastLevel: 43, seenActs: [1, 2, 3, 4, 5, 6, 7] }, seenActs: false });
        assert.equal(await page.textContent("#act-label"), "ATTO VIII");
        assert.equal(await page.textContent("#act-title"), "Reperibilità notturna");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^LIVELLO 44\/75: Chi Mangia la CPU/);
        assert.match(await page.innerText(".io-panel"), /input \(output di ps aux\)/);
        // Senza tr -s, cut -f2 trova il campo vuoto fra due spazi
        await page.evaluate(() => {
            const options = slotOptions(currentLevel());
            const pick = label => options.findIndex(option => stepLabel(option) === label);
            gridState = [pick("grep 'python3'"), pick("cut -d' ' -f2"), 0, 0, 0];
            buildGrid();
        });
        assert.ok(!won(await run(page)));
        await placeSolution(page, await indexOf(page, 44));
        assert.ok(won(await run(page)));
    },

    "atto VIII: ogni livello si risolve con la soluzione di riferimento": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(50) } });
        for (const id of [45, 46, 47, 48, 50]) {
            const index = await indexOf(page, id);
            await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, index);
            await placeSolution(page, index);
            assert.ok(won(await run(page)), `livello ${id}`);
        }
    },

    "atto VIII: i nuovi comandi nel terminale": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(50) }, settings: { inputMode: "terminal" } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 50));
        const line = "df -h 2>/dev/null | grep /dev/nvme | tr -s ' ' | sort -rh -t' ' -k2,2 | cut -d' ' -f6 | xargs";
        // Il programma del livello è già la sorgente: si scrive da 2>/dev/null in poi
        await page.fill("#terminal-input", line.replace("df -h ", ""));
        assert.equal(await page.textContent("#terminal-error"), "");
        assert.match(await page.textContent("#shell-line"), /tr -s ' '.*LC_ALL=C sort -rh -t' ' -k2,2.*xargs/s);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO|COMPLETATO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, await indexOf(page, 47));
        await page.fill("#terminal-input", "tr -s ' ' | fold -sw 16 | sed -E 's/ $//'");
        assert.equal(await page.textContent("#terminal-error"), "");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => { clearTimeout(transitionTimer); loadLevel(i); }, await indexOf(page, 46));
        await page.fill("#terminal-input", "grep Failed | xargs rm");
        assert.match(await page.textContent("#terminal-error"), /xargs lancia sempre echo/);
    },

    "atto VIII: manuale e pagine man di fold e xargs; quiz su sort -h": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(50) } });
        await page.evaluate(() => openManual("xargs"));
        assert.match(await page.innerText("#manual-body"), /anna luca eva/);
        await page.click(".manual-man");
        assert.match(await page.innerText(".man-header"), /XARGS\(1\)/);
        await page.evaluate(() => openManPage("fold"));
        assert.match(await page.innerText("#manual-body"), /-s\s+va a capo dopo uno spazio/);
        await page.evaluate(() => openManPage("sort"));
        assert.match(await page.innerText(".man-options"), /-h\s+ordina le dimensioni/);
        await page.evaluate(() => closeManual());

        await page.evaluate(i => loadLevel(i), await indexOf(page, 49));
        assert.equal(await page.locator(".quiz-answer").count(), 3);
        await page.click(".quiz-answer[data-correct=true]");
        await page.waitForFunction(() => /20K < 900M/.test(document.getElementById("console").innerText));
        assert.match(await consoleText(page), /20K < 900M < 1\.5G/);
    }
};
