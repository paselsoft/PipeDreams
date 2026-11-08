// Pagine man: ogni scheda del manuale anche nel formato di man(1), con NOME, SINOSSI,
// DESCRIZIONE, OPZIONI, ESEMPI (riga di shell e output calcolato dal motore), ATTENZIONE e
// VEDI ANCHE. Si aprono dal pulsante «📄 man» di ogni scheda o scrivendo «man sort» nel
// terminale. Tutto il testo è inserito con textContent.

// Per ogni scheda: i nomi che aprono la pagina (il primo dà il titolo) e le pagine collegate
const MAN_PAGES = {
    pipe: { names: ["pipe", "bash", "|"], nome: "| (pipe di bash)", seeAlso: ["devnull", "merge", "tee"] },
    grep: { names: ["grep"], seeAlso: ["sed", "awk", "wc"] },
    sort: { names: ["sort"], seeAlso: ["uniq", "comm", "join"] },
    uniq: { names: ["uniq"], seeAlso: ["sort", "comm"] },
    headtail: { names: ["head", "tail"], seeAlso: ["tacrev", "nl"] },
    tacrev: { names: ["tac", "rev"], seeAlso: ["headtail", "sort"] },
    wc: { names: ["wc"], seeAlso: ["grep", "uniq"] },
    cut: { names: ["cut"], seeAlso: ["awk", "paste", "tr"] },
    tr: { names: ["tr"], seeAlso: ["sed", "upper", "paste"] },
    upper: { names: ["maiuscole"], nome: "sed 's/.*/\\U&/'", seeAlso: ["tr", "sed"] },
    sed: { names: ["sed"], seeAlso: ["upper", "tr", "grep"] },
    awk: { names: ["awk"], seeAlso: ["cut", "sort"] },
    nl: { names: ["nl"], seeAlso: ["headtail", "tee"] },
    tee: { names: ["tee"], seeAlso: ["pipe", "devnull"] },
    comm: { names: ["comm"], seeAlso: ["join", "sort", "uniq"] },
    join: { names: ["join"], seeAlso: ["comm", "sort", "cut"] },
    pacchetti: { names: ["apt", "pacman", "yay", "paru", "dnf", "rpm", "dpkg", "dpkg-query"], seeAlso: ["grep", "cut", "devnull"] },
    paste: { names: ["paste"], seeAlso: ["tr", "cut"] },
    devnull: { names: ["null", "/dev/null", "stderr"], nome: "2>/dev/null", seeAlso: ["merge", "pipe"] },
    merge: { names: ["redirezioni", "2>&1"], nome: "2>&1", seeAlso: ["devnull", "pipe"] }
};

// Scheda del manuale per un nome scritto dopo «man» (null se non c'è)
function manEntryFor(name) {
    const wanted = String(name).trim().toLowerCase();
    for (const [id, page] of Object.entries(MAN_PAGES)) {
        if (page.names.includes(wanted)) return MANUAL.find(entry => entry.id === id) || null;
    }
    return null;
}

function manTitle(entry) {
    return MAN_PAGES[entry.id].names[0].toUpperCase();
}

function manSection(title, ...children) {
    const section = el("section", "man-section");
    section.append(el("h3", "man-heading", title), ...children);
    return section;
}

function manText(text) {
    return el("p", "man-text", text);
}

function manExample(example) {
    const box = el("div", "man-example");
    box.appendChild(el("p", "man-example-title", example.title));
    const result = executePipeline(example.input, example.steps);
    const lines = [`$ ${buildShellLine(example.input, example.steps)}`];
    result.output.forEach(line => lines.push(line));
    if (!result.output.length) lines.push("(nessuna riga)");
    box.appendChild(el("pre", "man-pre", lines.join("\n")));
    if (result.stderr.length) {
        box.appendChild(el("pre", "man-pre man-stderr", result.stderr.join("\n")));
    }
    if (example.note) box.appendChild(manText(example.note));
    return box;
}

// back: id della scheda a cui torna «← Indietro», oppure null (senza pulsante)
function renderManPage(entry, back = null) {
    noteManualRead(entry.id);
    const page = MAN_PAGES[entry.id];
    const title = `${manTitle(entry)}(1)`;
    const nodes = [];

    const header = el("div", "man-header");
    header.setAttribute("aria-hidden", "true");
    header.append(el("span", "", title), el("span", "man-header-center", "Manuale di Pipe Dreams"), el("span", "", title));
    nodes.push(header);

    nodes.push(manSection("NOME", manText(`${page.nome || page.names.join(", ")} - ${entry.summary}`)));
    nodes.push(manSection("SINOSSI", el("pre", "man-pre man-synopsis", entry.syntax)));
    nodes.push(manSection("DESCRIZIONE", manText(entry.description)));

    if (entry.options && entry.options.length) {
        const list = el("dl", "man-options");
        for (const option of entry.options) {
            list.append(el("dt", "", option.flag), el("dd", "", option.text));
        }
        nodes.push(manSection("OPZIONI", list));
    }

    nodes.push(manSection("ESEMPI", ...entry.examples.map(manExample)));

    if (entry.traps && entry.traps.length) {
        const list = el("ul", "man-traps");
        entry.traps.forEach(trap => list.appendChild(el("li", "", trap)));
        nodes.push(manSection("ATTENZIONE", list));
    }

    const links = el("p", "man-see-also");
    page.seeAlso.forEach((id, index) => {
        const target = MANUAL.find(item => item.id === id);
        if (!target) return;
        if (index) links.appendChild(document.createTextNode(", "));
        const link = el("button", "man-link", `${MAN_PAGES[id].names[0]}(1)`);
        link.onclick = () => openManPage(id, back);
        links.appendChild(link);
    });
    const card = el("button", "man-link", "scheda con gli esempi da provare");
    card.onclick = () => openManual(entry.id);
    links.append(document.createTextNode(" · "), card);
    nodes.push(manSection("VEDI ANCHE", links));

    nodes.push(manSection("NOTE", manText("Questa pagina descrive le opzioni che si usano nel gioco. In un terminale vero, man mostra tutte le opzioni del comando (e si esce premendo q).")));

    const footer = el("div", "man-footer");
    footer.setAttribute("aria-hidden", "true");
    footer.append(el("span", "", `Pipe Dreams ${APP_VERSION}`), el("span", "", title));
    nodes.push(footer);

    setManualContent(`📄 man ${page.names[0]}`, nodes, back !== null, back);
    document.getElementById("manual-body").classList.add("man-page");
}

function openManPage(entryId, back = null) {
    const entry = MANUAL.find(item => item.id === entryId);
    if (!entry) return;
    renderManPage(entry, back);
    document.getElementById("manual-overlay").hidden = false;
}

// Testo senza accenti e in minuscolo, per cercare «perche» e trovare «perché»
const foldText = text => String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Riga di man -k / apropos e di whatis: «sort (1)  - Ordina le righe...»
function manIndexLine(entry) {
    return `${(MAN_PAGES[entry.id].nome || MAN_PAGES[entry.id].names.join(", ")).padEnd(18)} (1)  - ${entry.summary}`;
}

// Come apropos: cerca la parola nei nomi, nella descrizione breve e nelle opzioni
function manSearch(word) {
    const wanted = foldText(word);
    return MANUAL.filter(entry => {
        const page = MAN_PAGES[entry.id];
        const haystack = [...page.names, page.nome || "", entry.summary, ...(entry.options || []).map(option => option.text)];
        return haystack.some(text => foldText(text).includes(wanted));
    });
}

// Riepilogo di «comando --help», con la sintassi e le opzioni della scheda
function helpLines(name) {
    const entry = manEntryFor(name);
    if (!entry) return null;
    const lines = [`Uso: ${entry.syntax}`, entry.summary];
    (entry.options || []).forEach(option => lines.push(`  ${option.flag.padEnd(12)} ${option.text}`));
    lines.push(`Pagina completa: man ${MAN_PAGES[entry.id].names[0]}`);
    return lines;
}

// Comandi «di aiuto» scritti nel terminale, che non sono pipeline:
//   man X · man -k parola · apropos parola · whatis X · comando --help
// Restituisce null se la riga è una pipeline normale, altrimenti
// { entry } (apre la pagina), { lines } (testo per la console) oppure { error }
function parseHelpCommand(text) {
    const words = text.replace(/['"]/g, "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    const [first, ...rest] = words;

    if (first === "apropos" || (first === "man" && rest[0] === "-k")) {
        const terms = first === "apropos" ? rest : rest.slice(1);
        if (terms.length !== 1) return { error: `${first === "apropos" ? "apropos" : "man -k"}: serve una parola da cercare, es. ${first === "apropos" ? "apropos" : "man -k"} ordina` };
        const found = manSearch(terms[0]);
        if (!found.length) return { error: `${terms[0]}: nulla di adatto.` };
        return { lines: found.map(manIndexLine) };
    }
    if (first === "whatis") {
        if (rest.length !== 1) return { error: "whatis: serve il nome di un comando, es. whatis sort" };
        const entry = manEntryFor(rest[0]);
        return entry ? { lines: [manIndexLine(entry)] } : { error: `${rest[0]}: nulla di adatto.` };
    }
    if (first === "man") {
        if (!rest.length) return { error: "Quale pagina di manuale vuoi? Per esempio: man sort" };
        if (rest.length > 1) return { error: "Una pagina alla volta: per esempio man sort" };
        const entry = manEntryFor(rest[0]);
        if (!entry) return { error: `Nessuna voce di manuale per ${rest[0]}` };
        return { entry };
    }
    if (words.includes("--help")) {
        // Il comando è la prima parola del pezzo di pipeline che contiene --help
        const segment = text.split("|").find(part => /(^|\s)--help(\s|$)/.test(part)) || "";
        const name = segment.trim().split(/\s+/).find(word => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) || "";
        const lines = helpLines(name);
        return lines ? { lines } : { error: `bash: ${name}: comando non trovato` };
    }
    return null;
}
