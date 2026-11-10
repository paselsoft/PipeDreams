// Atto VII: comm, join, nl, tee, file del livello, stderr atteso e origine dell'input.
const { assert, open, placeSolution, run, won, consoleText, fileUrl } = require("./helpers");

const solvedUpTo = n => Object.fromEntries([...Array(n)].map((_, i) => [i + 1, { stars: 3, best: 1 }]));
const indexOf = (page, id) => page.evaluate(levelId => levels.findIndex(lvl => lvl.id === levelId), id);

module.exports = {
    "atto VII: introduzione, origine dell'input e nl": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(36), lastLevel: 36, seenActs: [1, 2, 3, 4, 5, 6] }, seenActs: false });
        assert.equal(await page.textContent("#act-label"), "ATTO VII");
        assert.equal(await page.textContent("#act-title"), "Patch Tuesday");
        await page.click("#act-button");
        assert.match(await page.innerText("#level-title"), /^LIVELLO 37\/67: Lista della Spesa di apt/);
        assert.match(await page.innerText(".io-panel"), /input \(output di apt list --upgradable\)/);
        assert.equal(await page.textContent(".terminal-prompt"), "$ apt list --upgradable");
        await placeSolution(page, 36);
        assert.ok(won(await run(page)));
    },

    "atto VII: tee mostra sul terminale lo stderr atteso": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(43) } });
        const index = await indexOf(page, 38);
        await page.evaluate(i => loadLevel(i), index);
        assert.equal(await page.isVisible("#row-target-stderr"), true);
        assert.equal(await page.innerText("#txt-target-stderr"), "firefox\nlinux\nmesa\npython".replace(/\n/g, await page.evaluate(() => document.getElementById("txt-target-stderr").innerText.includes("\n") ? "\n" : "")));
        // Con tee su un file lo stdout è giusto, ma sul terminale non arriva niente
        await page.evaluate(() => {
            const options = slotOptions(currentLevel());
            const pick = label => options.findIndex(option => stepLabel(option) === label);
            gridState = [pick("cut -d' ' -f1"), pick("tee aggiornamenti.txt"), pick("wc -l"), 0];
            buildGrid();
        });
        assert.ok(!won(await run(page)));
        await placeSolution(page, index);
        assert.ok(won(await run(page)));
    },

    "atto VII: comm e join mostrano il file del livello e si scrivono nel terminale": async ({ page }) => {
        await open(page, { progress: { levels: solvedUpTo(43) }, settings: { inputMode: "terminal" } });
        await page.evaluate(i => loadLevel(i), await indexOf(page, 39));
        assert.match(await page.innerText("#level-files"), /file critici\.txt:\s*glibc\s*openssh\s*openssl\s*sudo/);
        await page.fill("#terminal-input", "comm -12 - critici.txt");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /FALLIMENTO/.test(document.getElementById("console").innerText));
        assert.match(await consoleText(page), /comm: file 1 is not in sorted order/);
        await page.fill("#terminal-input", "sort | comm -12 - nessuno.txt");
        assert.match(await page.textContent("#terminal-error"), /nessuno\.txt: file non trovato \(in questo livello: critici\.txt\)/);
        await page.fill("#terminal-input", "sort | comm -21 - critici.txt");
        assert.match(await page.textContent("#shell-line"), /LC_ALL=C comm -12 - <\(printf '%s\\n' 'glibc' 'openssh' 'openssl' 'sudo'\)/);
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));

        await page.evaluate(i => loadLevel(i), await indexOf(page, 43));
        await page.fill("#terminal-input", "2>/dev/null | sort | join - vulnerabili.txt | awk '{print $2}' | sort | uniq");
        assert.equal(await page.textContent("#terminal-error"), "");
        await page.press("#terminal-input", "Enter");
        await page.waitForFunction(() => /SUCCESSO|COMPLETATO/.test(document.getElementById("console").innerText));
    },

    "atto VII: manuale, editor con file e livello condiviso con comm": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openManual("comm"));
        assert.match(await page.innerText("#manual-body"), /spesa\.txt/);
        await page.evaluate(() => openManual("pacchetti"));
        assert.match(await page.innerText("#manual-body"), /pacman -Syu/);
        await page.goto(fileUrl("editor.html"));
        await page.evaluate(() => loadFromLevel(43));
        assert.equal(await page.inputValue("#ed-source"), "for s in zebra mela gatto pesca pera; do ssh $s inventario; done");
        assert.match(await page.textContent("#ed-code"), /lines: \["openssh CVE-2024-6387"/);
        // Il livello con comm e il file viaggia nel link
        await page.evaluate(() => loadFromLevel(39));
        const url = await page.textContent("#ed-share-url");
        await page.goto(url);
        await page.reload();
        assert.match(await page.textContent("#test-banner-text"), /LIVELLO CONDIVISO/);
        assert.match(await page.innerText("#level-files"), /critici\.txt/);
        assert.match(await page.innerText(".io-panel"), /output di rpm -qa/);
    }
};
