// Runner dei test nel browser (Playwright, Chromium senza interfaccia).
// Ogni file *.test.js esporta un oggetto { "nome del test": async ({ page, context, browser }) => {...} }.
// Ogni test ha un contesto pulito (localStorage vuoto) e fallisce anche se la pagina produce errori.
// Il gioco è servito da un piccolo server HTTP locale, come su GitHub Pages: con le pagine aperte
// da file:// Chromium a volte perde localStorage tra una navigazione e l'altra.
// Uso: node tests/e2e/run.js [filtro sul nome del file o del test]
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
    ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };

// Serve i file del progetto; nessun file fuori dalla cartella del gioco
function startServer() {
    const server = http.createServer((request, response) => {
        const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        const file = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
        if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            response.writeHead(404).end();
            return;
        }
        response.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
        fs.createReadStream(file).pipe(response);
    });
    return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const filter = (process.argv[2] || "").toLowerCase();
const files = fs.readdirSync(__dirname).filter(name => name.endsWith(".test.js")).sort();

(async () => {
    const server = await startServer();
    process.env.E2E_BASE_URL = `http://127.0.0.1:${server.address().port}/`;
    const browser = await chromium.launch();
    let passed = 0;
    const failed = [];
    const started = Date.now();

    for (const file of files) {
        const tests = require(path.join(__dirname, file));
        for (const [name, run] of Object.entries(tests)) {
            const fullName = `${file.replace(".test.js", "")} › ${name}`;
            if (filter && !fullName.toLowerCase().includes(filter)) continue;
            const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
            const page = await context.newPage();
            page.setDefaultTimeout(10000);
            const pageErrors = [];
            page.on("pageerror", error => pageErrors.push(error.message));
            page.on("console", message => { if (message.type() === "error") pageErrors.push(message.text()); });
            const t0 = Date.now();
            try {
                await run({ page, context, browser, pageErrors });
                if (pageErrors.length) throw new Error(`errori nella pagina: ${pageErrors.join(" | ")}`);
                passed++;
                console.log(`✓ ${fullName} (${Date.now() - t0} ms)`);
            } catch (error) {
                failed.push(fullName);
                console.log(`✗ ${fullName}\n    ${String(error.message).split("\n").join("\n    ")}`);
            } finally {
                await context.close();
            }
        }
    }

    await browser.close();
    server.close();
    console.log(`\n${passed}/${passed + failed.length} test superati in ${((Date.now() - started) / 1000).toFixed(1)} s`);
    if (failed.length) process.exit(1);
})();
