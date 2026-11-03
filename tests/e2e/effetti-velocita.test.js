// Velocità dell'animazione, SALTA, dati che scorrono, suoni, coriandoli ed effetto CRT.
const { assert, open, reload, placeSolution, run } = require("./helpers");

// Conta gli oscillatori creati (un suono = un oscillatore)
const countTones = page => page.evaluate(() => {
    window.__tones = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () { window.__tones++; return original.call(this); };
});

module.exports = {
    "SALTA mostra subito il risultato durante un'animazione lenta": async ({ page }) => {
        await open(page, { settings: { speed: "lenta" }, progress: { levels: Object.fromEntries([...Array(16)].map((_, i) => [i + 1, { stars: 3, best: 1 }])) } });
        await placeSolution(page, 16);
        await page.click("#btn-run");
        await page.waitForTimeout(400);
        assert.equal(await page.textContent("#btn-run"), "SALTA ( ⏭ )");
        const t0 = Date.now();
        await page.click("#btn-run");
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText));
        assert.ok(Date.now() - t0 < 1500, "il salto deve essere immediato");
        assert.equal(await page.locator("#console .log-step").count(), 7, "tutti i passi restano in console");
    },

    "la velocità scelta resta salvata": async ({ page }) => {
        await open(page);
        await page.click("[data-speed=veloce]");
        await reload(page);
        assert.equal(await page.$eval("#speed-control .active", button => button.dataset.speed), "veloce");
    },

    "i dati scorrono: le righe di sort scivolano nella nuova posizione": async ({ page }) => {
        await open(page, { settings: { speed: "lenta" } });
        await page.evaluate(() => loadLevel(1));
        await page.evaluate(() => { cycleCell(0); runPipeline(); });
        let maxShift = 0;
        for (let i = 0; i < 20; i++) {
            await page.waitForTimeout(50);
            const shift = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll("#stream-lines .chip")].map(chip => {
                const transform = getComputedStyle(chip).transform;
                if (transform === "none") return 0;
                const values = transform.match(/-?[\d.]+/g).map(Number);
                return Math.abs(values[4]) + Math.abs(values[5]);
            })));
            maxShift = Math.max(maxShift, shift);
        }
        assert.ok(maxShift > 20, `spostamento massimo ${maxShift}px`);
    },

    "suoni, coriandoli e vibrazione per le tre stelle": async ({ page }) => {
        await open(page, { settings: { sound: true } });
        await countTones(page);
        await placeSolution(page, 0);
        await run(page);
        assert.ok(await page.evaluate(() => window.__tones) >= 5, "bip del passo e accordo di vittoria");
        assert.ok(await page.locator(".confetti").count() > 20);
    },

    "suoni spenti: nessun suono": async ({ page }) => {
        await open(page);
        await countTones(page);
        await placeSolution(page, 0);
        await run(page);
        assert.equal(await page.evaluate(() => window.__tones), 0);
    },

    "effetto CRT attivabile e salvato": async ({ page }) => {
        await open(page);
        assert.equal(await page.evaluate(() => document.body.classList.contains("crt")), false);
        await page.click("#btn-crt");
        await reload(page);
        assert.equal(await page.evaluate(() => document.body.classList.contains("crt")), true);
    },

    "riduci movimento: niente animazioni né coriandoli": async ({ browser }) => {
        const context = await browser.newContext({ reducedMotion: "reduce" });
        const page = await context.newPage();
        await open(page, { settings: { speed: "lenta" } });
        await placeSolution(page, 1);
        await page.click("#btn-run");
        await page.waitForTimeout(700);
        const animated = await page.$$eval("#stream-lines .chip", chips => chips.filter(c => c.classList.contains("leaving") || c.classList.contains("entering") || c.style.transform).length);
        assert.equal(animated, 0);
        await page.waitForFunction(() => /SUCCESSO/.test(document.getElementById("console").innerText), null, { timeout: 10000 });
        assert.equal(await page.locator(".confetti").count(), 0);
        await context.close();
    }
};
