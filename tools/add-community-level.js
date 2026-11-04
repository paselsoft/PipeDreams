// Aggiunge alla galleria della community un livello proposto con il link dell'editor.
// Uso: node tools/add-community-level.js '<link con #livello=...>' 'Autore'
// Il livello viene convalidato come un link condiviso e messo in cima a community.js;
// poi lancia node tools/check-community.js, che lo verifica anche con bash.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const [link, author] = process.argv.slice(2);
if (!link || !author || !author.trim()) {
    console.error("Uso: node tools/add-community-level.js '<link del livello>' 'Autore'");
    process.exit(1);
}

const root = path.join(__dirname, "..");
const context = vm.createContext({ TextEncoder, TextDecoder, btoa, atob });
for (const file of ["commands.js", "levels.js", "solver.js", "command-form.js", "share.js", "community.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const hash = link.slice(link.indexOf("#"));
const result = vm.runInContext(`sharedLevelFromHash(${JSON.stringify(hash)})`, context);
if (!result || result.error) {
    console.error(result ? result.error : "Il link non contiene un livello (#livello=...).");
    process.exit(1);
}

// Solo i campi di un livello "componi", nell'ordine dell'editor
const { title, source, mission, nudge, hint, stdin, target, targetStderr, allowedCommands, slots } = result.level;
const level = { title, ...(source ? { source } : {}), ...(slots ? { slots } : {}), mission, nudge: nudge || "", hint, stdin, target, ...(targetStderr ? { targetStderr } : {}), allowedCommands };
const slug = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "livello";
const existing = vm.runInContext("COMMUNITY_LEVELS.map(entry => entry.id)", context);
let id = `c-${slug}`;
for (let n = 2; existing.includes(id); n++) id = `c-${slug}-${n}`;
const entry = { id, author: author.trim().slice(0, 40), added: new Date().toISOString().slice(0, 10), level };

const file = path.join(root, "community.js");
const original = fs.readFileSync(file, "utf8");
const marker = "const COMMUNITY_LEVELS = [\n";
const indented = JSON.stringify(entry, null, 4).split("\n").map(line => "    " + line).join("\n");
fs.writeFileSync(file, original.replace(marker, `${marker}${indented},\n`));
console.log(`Aggiunto ${id} («${title}» di ${entry.author}). Ora lancia: node tools/check-community.js`);
