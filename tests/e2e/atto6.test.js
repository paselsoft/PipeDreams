// Atto VI: introduzione, nuovi comandi nelle celle, nel terminale, nel manuale e nell'editor.
const { assert, open, placeSolution, run, won, consoleText, fileUrl } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));

module.exports = {
    "atto VI: introduzione e livelli risolti dalle celle": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(29), lastLevel: 29, seenActs: [1, 2, 3, 4, 5] }, seenActs: false });
        assert.equal(await page.isVisible("#act-overlay"), true);
        assert.equal(await page.textContent("#act-label"), "ATTO VI");
        assert.equal(await page.textContent("#act-title"), "Il grande trasloco");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^LIVELLO 30\/59: Log alla Rovescia/);
        assert.match(await page.textContent("#story-text"), /log al contrario/);
        await placeSolution(page, 29);
        const text = await run(page);
        assert.ok(won(text));
        assert.match(text, /Altre soluzioni ottimali: tac \| grep 'backup'/);
    },

    "atto VI: il boss scritto nel terminale, con la riga di shell": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(36), lastLevel: 35 }, settings: { inputMode: "terminal" } });
        await page.evaluate(() => loadLevel(35));
        await page.fill("#terminal-input", "rev | cut -c1-3 | rev | sort | uniq -c | sort -rn");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /FALLIMENTO/.test(document.getElementById("console").innerText));
        await page.fill("#terminal-input", "sort -k2 -t.");
        assert.match(await page.textContent("#terminal-error"), /-k2 da solo arriva fino a fine riga/);
        await page.fill("#terminal-input", "rev | cut -d. -f1 | rev | sort | uniq -c | sort -rn");
        assert.equal(await page.textContent("#terminal-error"), "");
        assert.match(await page.textContent("#shell-line"), /rev \|\s+cut -d'\.' -f1 \|\s+rev \|\s+LC_ALL=C sort/);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
        assert.match(await consoleText(page), /4 jpg/);
    },

    "atto VI: manuale tac / rev ed editor con i nuovi comandi": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openManual("tacrev"));
        assert.match(await page.innerText("#manual-body"), /tac non è sort -r/);
        assert.match(await page.innerText("#manual-body"), /vacanze|jpg/);
        await page.goto(fileUrl("editor.html"));
        const options = await page.$$eval(".ed-cmd select >> nth=0", selects => [...selects[0].options].map(o => o.value));
        for (const cmd of ["tac", "rev", "cutc"]) assert.ok(options.includes(cmd), cmd);
        await page.evaluate(() => loadFromLevel(32));
        const code = await page.textContent("#ed-code");
        assert.match(code, /separator: ",", key: 3/);
        assert.equal(await page.$eval("#ed-share", button => button.disabled), false, "il livello 32 è valido anche nell'editor");
    }
};
