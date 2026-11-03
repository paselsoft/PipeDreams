// Manuale dei comandi e laboratorio.
const { assert, open, placeLabels, run } = require("./helpers");

module.exports = {
    "il manuale mette in cima i comandi del livello e ogni scheda si apre": async ({ page }) => {
        await open(page, { progress: { levels: Object.fromEntries([...Array(13)].map((_, i) => [i + 1, { stars: 3, best: 1 }])), lastLevel: 13 } });
        await page.evaluate(() => loadLevel(13));
        await page.click("text=📖 MANUALE");
        const first = await page.$$eval("#manual-body > *", nodes => {
            const out = [];
            let inLevel = false;
            for (const node of nodes) {
                if (node.tagName === "H3") { if (inLevel) break; inLevel = node.textContent.includes("questo livello"); continue; }
                if (inLevel) out.push(node.querySelector("code").textContent);
            }
            return out;
        });
        assert.deepEqual(first, ["sort", "uniq", "cut", "awk"]);
        const ids = await page.evaluate(() => MANUAL.map(entry => entry.id));
        for (const id of ids) {
            await page.evaluate(entryId => openManual(entryId), id);
            assert.ok(await page.locator(".manual-example").count() >= 2, `la scheda ${id} ha almeno due esempi`);
        }
    },

    "gli esempi mostrano l'output calcolato dal motore": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openManual("uniq"));
        const example = page.locator(".manual-example", { hasText: "Doppioni lontani" });
        const output = await example.locator(".manual-row").nth(1).locator(".chip").allInnerTexts();
        assert.deepEqual(output, ["a", "b", "a"]);
        await page.click("#manual-back");
        assert.equal(await page.textContent("#manual-title"), "📖 MANUALE");
    },

    "laboratorio: dall'esempio, modifiche dal vivo e ritorno alla scheda": async ({ page }) => {
        await open(page);
        await page.evaluate(() => openManual("uniq"));
        await page.locator(".manual-example", { hasText: "Doppioni lontani" }).locator(".manual-try").click();
        assert.equal(await page.textContent("#manual-title"), "🧪 LABORATORIO");
        await page.click("#manual-body button:has-text('+ Aggiungi comando')");
        await page.locator("#lab-commands .ed-cmd").nth(1).locator(".lab-move").click();
        const final = page.locator("#lab-result .lab-final .chip");
        assert.deepEqual(await final.allInnerTexts(), ["a", "b"]);
        await page.fill("#lab-input", "b\na\n2> attenzione\nb");
        assert.match(await page.textContent("#lab-result"), /Sul terminale \(stderr\): attenzione/);
        // Una regex non supportata ferma il calcolo con una spiegazione
        await page.click("#manual-body button:has-text('+ Aggiungi comando')");
        const row = page.locator("#lab-commands .ed-cmd").nth(2);
        await row.locator("select").selectOption("sed");
        await row.locator("input[type=text]").nth(0).fill("a|b");
        assert.match(await row.locator(".ed-error").textContent(), /alternativa \| non è supportata/);
        assert.match(await page.textContent("#lab-result .lab-warning"), /Il comando 3 ha un errore/);
        await page.click("#manual-back");
        assert.equal(await page.textContent("#manual-title"), "uniq");
    },

    "laboratorio dal livello: confronto con lo stdout atteso": async ({ page }) => {
        await open(page, { progress: { levels: Object.fromEntries([...Array(13)].map((_, i) => [i + 1, { stars: 3, best: 1 }])), lastLevel: 13 } });
        await page.evaluate(() => loadLevel(13));
        await placeLabels(page, ["sort", "uniq -c", "sort -rn", "cut -d' ' -f2"]);
        const text = await run(page);
        assert.match(text, /Per esaminare la pipeline: 🧪 LABORATORIO/);
        const cells = await page.evaluate(() => gridState.join(","));
        await page.click("#btn-lab");
        assert.match(await page.textContent(".lab-verdict"), /Diverso dallo stdout atteso/);
        const row = page.locator("#lab-commands .ed-cmd").nth(3);
        await row.locator("select").selectOption("awk");
        await row.locator("input[type=number]").fill("2");
        assert.match(await page.textContent(".lab-verdict"), /Coincide con lo stdout atteso/);
        await page.click("#manual-back");
        assert.equal(await page.$eval("#manual-overlay", overlay => overlay.hidden), true);
        assert.equal(await page.evaluate(() => gridState.join(",")), cells, "le celle del livello non cambiano");
    }
};
