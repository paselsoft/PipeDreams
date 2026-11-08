// Modalità terminale.
const { assert, open, run, consoleText } = require("./helpers");

// Atti I-IV completati: il terminale è sbloccato nei loro livelli
const actsDone = () => Object.fromEntries([...Array(23)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));

module.exports = {
    "bloccata finché l'atto non è completo": async ({ page }) => {
        await open(page);
        assert.equal(await page.textContent("#mode-toggle [data-mode=terminal]"), "⌨️ Terminale 🔒");
        await page.click("#mode-toggle [data-mode=terminal]");
        assert.equal(await page.evaluate(() => document.body.dataset.input), "cells");
        assert.match(await consoleText(page), /si sblocca risolvendo tutti i livelli dell'Atto I/);
    },

    "scrivere la pipeline risolve il livello e lascia il segno nel menu": async ({ page }) => {
        await open(page, { progress: { levels: actsDone(), lastLevel: 1 } });
        await page.evaluate(() => loadLevel(1));
        await page.click("#mode-toggle [data-mode=terminal]");
        assert.equal(await page.isVisible("#grid"), false);
        await page.fill("#terminal-input", "uniq | sort");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /FALLIMENTO/.test(document.getElementById("console").innerText));
        await page.fill("#terminal-input", "");
        await page.click(".terminal-chip >> text=sort");
        await page.click(".terminal-chip >> text=uniq");
        assert.equal(await page.inputValue("#terminal-input"), "sort | uniq");
        assert.equal(await page.innerText("#score-display"), "⌨️ Comandi: 2 · Par: 2");
        assert.match(await page.textContent("#shell-line"), /LC_ALL=C sort \|\s+uniq/);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
        assert.equal(await page.evaluate(() => progress.terminal[2]), true);
        assert.ok(await page.evaluate(() => progress.achievements.terminalista));
        await page.evaluate(() => { clearTimeout(transitionTimer); openMenu(); });
        assert.match(await page.locator(".menu-level").nth(1).innerText(), /⌨️/);
    },

    "errori di sintassi mentre si scrive e all'invio": async ({ page }) => {
        await open(page, { progress: { levels: actsDone(), lastLevel: 2 }, settings: { inputMode: "terminal" } });
        await page.evaluate(() => loadLevel(2));
        await page.fill("#terminal-input", "gerp ERR");
        assert.equal(await page.textContent("#terminal-error"), "bash: gerp: comando non trovato");
        await page.press("#terminal-input", "Enter");
        assert.match(await consoleText(page), /\$ programma gerp ERR\s+bash: gerp: comando non trovato/);
        await page.fill("#terminal-input", "2> /dev/null | sed 's/.*/\\U&/' | LC_ALL=C sort | uniq");
        assert.equal(await page.textContent("#terminal-error"), "");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
    },

    "non disponibile per quiz, debug, celle bloccate e sfida": async ({ page }) => {
        const all = Object.fromEntries([...Array(50)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
        await open(page, { progress: { levels: all }, settings: { inputMode: "terminal" } });
        const special = await page.evaluate(() => levels.map((lvl, i) => lvl.type || lvl.locked ? i : -1).filter(i => i >= 0));
        assert.equal(special.length, 8);
        for (const index of special) {
            await page.evaluate(i => loadLevel(i), index);
            assert.equal(await page.isVisible("#mode-toggle"), false, `livello ${index + 1}`);
            assert.equal(await page.evaluate(() => document.body.dataset.input), "cells");
        }
        await page.evaluate(() => loadDaily());
        assert.equal(await page.isVisible("#mode-toggle"), false);
    }
};
