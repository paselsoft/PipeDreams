// Le emoji del gioco devono esistere anche su sistemi vecchi: macOS 10.13 High Sierra disegna
// solo le emoji fino alla versione 5.0 (2017), le altre diventano quadratini (per esempio 🧪, 🧩, 🧑‍💻).
// Questo controllo elenca i simboli grafici usati nei file del gioco e fallisce se ne trova uno
// fuori dall'elenco. Per aggiungerne uno: controlla su emojipedia.org che sia «Emoji 5.0» o
// precedente, poi aggiungilo a COMPATIBILI. Uso: node tools/check-emoji.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const COMPATIBILI = new Set(["⌨","⏭","⏱","▶","★","☕","☣","☰","♀","⚗","⚠","⚡","✉","✨","❓","⬇","⭐","🆕","🌍","🌙","🎉","🎓","🎯","🏃","🏅","🏆","🐐","🐛","👁","👉","👋","👮","💡","💬","💻","💾","📁","📂","📄","📅","📊","📋","📖","📚","📜","📝","📨","📺","🔄","🔇","🔈","🔊","🔍","🔎","🔒","🔗","🔥","🔧","🔲","🕵","🖨","🗒","🚚","🚨","🛠","🧠"]);

const files = [...fs.readdirSync(root).filter(file => /\.(js|html|css)$/.test(file)), "manifest.webmanifest"];
const problems = [];
let count = 0;
for (const file of files) {
    const lines = fs.readFileSync(path.join(root, file), "utf8").split("\n");
    lines.forEach((line, index) => {
        for (const match of line.matchAll(/\p{Extended_Pictographic}/gu)) {
            count++;
            if (!COMPATIBILI.has(match[0])) {
                const code = match[0].codePointAt(0).toString(16).toUpperCase();
                problems.push(`${file}:${index + 1}: ${match[0]} (U+${code}) non è nell'elenco delle emoji compatibili con High Sierra`);
            }
        }
    });
}
problems.forEach(problem => console.log(problem));
console.log(`Emoji: ${count} usi, ${COMPATIBILI.size} simboli compatibili, ${problems.length} problemi`);
if (problems.length) process.exit(1);
