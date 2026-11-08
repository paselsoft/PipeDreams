// Terminale come bash: cronologia con ↑↓, completamento con Tab, --help, man -k, apropos, whatis.
const { assert, open, consoleText } = require("./helpers");

const actsDone = () => Object.fromEntries([...Array(43)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const openTerminal = async (page, levelIndex = 1) => {
    await open(page, { progress: { levels: actsDone(), lastLevel: levelIndex }, settings: { inputMode: "terminal" } });
    await page.evaluate(i => loadLevel(i), levelIndex);
    await page.focus("#terminal-input");
};
const enter = async (page, line) => {
    await page.fill("#terminal-input", line);
    await page.press("#terminal-input", "Enter");
};

module.exports = {
    "cronologia: ↑ e ↓ richiamano le righe eseguite, anche dopo aver ricaricato": async ({ page }) => {
        await openTerminal(page);
        await enter(page, "uniq | sort");
        await page.waitForFunction(() => !isBusy);
        await enter(page, "man sort");
        await page.click("#manual-overlay .menu-close");
        await page.fill("#terminal-input", "bozza");
        await page.press("#terminal-input", "ArrowUp");
        assert.equal(await page.inputValue("#terminal-input"), "man sort");
        await page.press("#terminal-input", "ArrowUp");
        assert.equal(await page.inputValue("#terminal-input"), "uniq | sort");
        await page.press("#terminal-input", "ArrowUp");
        assert.equal(await page.inputValue("#terminal-input"), "uniq | sort", "resta sulla più vecchia");
        await page.press("#terminal-input", "ArrowDown");
        await page.press("#terminal-input", "ArrowDown");
        assert.equal(await page.inputValue("#terminal-input"), "bozza", "in fondo torna la riga che stavi scrivendo");
        await page.reload();
        await page.focus("#terminal-input");
        await page.press("#terminal-input", "ArrowUp");
        assert.equal(await page.inputValue("#terminal-input"), "man sort");
    },

    "Tab completa comandi, reindirizzamenti, file e pagine di man": async ({ page }) => {
        await openTerminal(page);
        const tab = async (typed, expected, hint = "") => {
            await page.fill("#terminal-input", typed);
            await page.press("#terminal-input", "Tab");
            assert.equal(await page.inputValue("#terminal-input"), expected, typed);
            assert.equal(await page.textContent("#terminal-hint"), hint, `${typed}: alternative`);
        };
        await tab("so", "sort ");
        await tab("sort | un", "sort | uniq ");
        await tab("sort 2>/d", "sort 2>/dev/null ");
        await tab("man pac", "man pacman ");
        await tab("t", "t", "tac   tail   tee   tr");
        await tab("ta", "ta", "tac   tail");
        // Niente da completare: Tab sposta il focus come sempre
        await page.fill("#terminal-input", "sort");
        await page.press("#terminal-input", "Tab");
        assert.notEqual(await page.evaluate(() => document.activeElement.id), "terminal-input");
        // File del livello per comm e join (Atto VII)
        const commLevel = await page.evaluate(() => levels.findIndex(lvl => lvl.allowedCommands.some(step => step.cmd === "comm")));
        await page.evaluate(i => loadLevel(i), commLevel);
        const file = await page.evaluate(() => Object.keys(levelFiles(currentLevel()))[0]);
        await page.focus("#terminal-input");
        await tab(`comm -12 ${file.slice(0, 2)}`, `comm -12 ${file} `);
    },

    "--help, man -k, apropos e whatis rispondono in console senza contare tentativi": async ({ page }) => {
        await openTerminal(page);
        await enter(page, "sort --help");
        let text = await consoleText(page);
        assert.match(text, /\$ sort --help/);
        assert.match(text, /Uso: sort \[-r\]/);
        assert.match(text, /-n\s+ordina per valore numerico/);
        assert.match(text, /Pagina completa: man sort/);
        await enter(page, "grep 'x' | uniq --help");
        assert.match(await consoleText(page), /Uso: uniq/);
        await enter(page, "ls --help");
        assert.match(await consoleText(page), /bash: ls: comando non trovato/);

        await enter(page, "man -k ordin");
        text = await consoleText(page);
        assert.match(text, /^sort\s+\(1\)\s+- Ordina le righe/m);
        await enter(page, "apropos perche");
        assert.match(await consoleText(page), /perche: nulla di adatto\./);
        await enter(page, "apropos maiuscol");
        assert.match(await consoleText(page), /\(1\)\s+- Converte ogni riga in maiuscolo/);
        await enter(page, "whatis tail");
        assert.match(await consoleText(page), /^head, tail\s+\(1\)\s+- Tengono le prime/m);
        await enter(page, "man -k");
        assert.match(await consoleText(page), /man -k: serve una parola/);

        assert.equal(await page.evaluate(() => levelSession.attempts), 0);
        assert.equal(await page.isVisible("#manual-overlay"), false);
    }
};
