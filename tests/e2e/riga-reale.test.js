// Riga di shell «sul sistema vero»: il comando di origine del livello seguito dalla pipeline.
const { assert, open, placeSolution, run, won } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);
const line = page => page.evaluate(() => document.getElementById("shell-line").textContent.replace(/ \|\n {2}/g, " | "));

module.exports = {
    "riga sul sistema vero: scelta, testo, nota e preferenza ricordata": async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await open(page, { progress: { levels: solvedUpTo(50) } });
        // Senza comando di origine la scelta non c'è
        await page.evaluate(() => loadLevel(0));
        assert.equal(await page.isVisible("#shell-view"), false);

        await placeSolution(page, await indexOf(page, 44));
        assert.equal(await page.isVisible("#shell-view"), true);
        assert.match(await line(page), /^printf '%s\\n' 'USER/);
        assert.equal(await page.getAttribute("#shell-view [data-view=riproducibile]", "aria-pressed"), "true");

        await page.click("#shell-view [data-view=real]");
        assert.equal(await line(page), "ps aux | grep 'python3' | tr -s ' ' | cut -d' ' -f2");
        assert.equal(await page.getAttribute("#shell-view [data-view=real]", "aria-pressed"), "true");
        assert.match(await page.textContent("#shell-note"), /output sarà diverso/);
        await page.click("#btn-copy");
        assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^ps aux \|\n {2}grep 'python3'/);
        assert.ok(won(await run(page)), "la scelta non cambia la soluzione");

        // Con i reindirizzamenti attaccati al comando di origine, e la scelta resta dopo il ricaricamento
        await page.reload();
        await placeSolution(page, await indexOf(page, 50));
        assert.equal(await line(page), "df -h 2>/dev/null | grep '/dev/nvme' | tr -s ' ' | sort -rh -t' ' -k2,2 | cut -d' ' -f6 | xargs");

        // File del livello: la nota dice di crearli
        await placeSolution(page, await indexOf(page, 39));
        assert.match(await line(page), /^rpm -qa .*\| comm -12 - critici\.txt$/);
        assert.match(await page.textContent("#shell-note"), /Prima crea critici\.txt/);

        await page.click("#shell-view [data-view=riproducibile]");
        assert.match(await line(page), /<\(printf/);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("pipedreams.settings.v1")).shellView), "riproducibile");
    },

    "riga sul sistema vero anche negli enigmi dei casi e a 320px": async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await open(page, { progress: { levels: solvedUpTo(50) }, settings: { shellView: "real" } });
        await page.evaluate(() => playPuzzle("pagine-cerchiate", "opzioni", 1));
        assert.equal(await page.isVisible("#shell-view"), true);
        assert.equal(await line(page), "du -sh /home/guardia/*", "senza comandi resta il comando di origine");
        await page.click(".cell");
        assert.match(await line(page), /^du -sh \/home\/guardia\/\* \| sort -rh$/);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `scorrimento orizzontale di ${overflow}px`);
    }
};
