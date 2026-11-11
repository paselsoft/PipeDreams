// Sezione LPI: per ogni esame (LPIC-1 101 e 102, Linux Essentials) gli obiettivi con il peso, il
// link alla lezione ufficiale in italiano, i comandi dell'obiettivo (segnati quelli che sono nel
// gioco), i livelli e l'allenamento che lo esercitano e la casella «studiato».
// Alcune lezioni si leggono anche dentro il gioco, integrali e non modificate (licenza
// CC BY-NC-ND 4.0): «📖 Leggi qui» le apre con lpi-lesson-view.js.

// Comandi del gioco come compaiono negli obiettivi LPI
const LPI_GAME_TERMS = new Set(["grep", "sort", "uniq", "head", "tail", "tac", "rev", "wc", "cut", "tr", "sed", "awk",
    "nl", "tee", "comm", "join", "paste", "fold", "xargs", "md5sum", "sha256sum", "od", "zcat", "bzcat", "xzcat"]);

// Argomenti dell'allenamento per ogni comando del gioco
const LPI_TRAINING = { grep: "grep", sort: "sort", uniq: "uniq", head: "headtail", tail: "headtail", wc: "wc", cut: "cut",
    wcw: "wc", wcc: "wc", tr: "tr", squeeze: "tr", sed: "sed", upper: "sed", paste: "paste", nl: "nl", devnull: "stderr", merge: "stderr" };

const lpiState = { exam: "101-500", levelsCache: null };

function lpiEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function lpiLink(text, href) {
    const link = lpiEl("a", "lpi-link", text);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    return link;
}

const lpiKey = (examId, objectiveId) => `${examId}:${objectiveId}`;
const lpiStudied = (examId, objectiveId) => Boolean(progress.lpi && progress.lpi[lpiKey(examId, objectiveId)]);

// Comandi usati dalla soluzione di ogni livello della campagna (calcolati una volta)
function lpiLevelCommands() {
    if (!lpiState.levelsCache) {
        lpiState.levelsCache = levels.map(lvl => new Set(tutorStepsFor(lvl).map(step => step.cmd)));
    }
    return lpiState.levelsCache;
}

// Livelli della campagna che allenano un obiettivo (al massimo limit)
function lpiLevelsFor(objective, limit = 6) {
    if (!objective.cmds || !objective.cmds.length) return [];
    const used = lpiLevelCommands();
    const matches = levels.map((lvl, index) => ({ lvl, index }))
        .filter(({ index }) => objective.cmds.some(cmd => used[index].has(cmd)));
    if (matches.length <= limit) return matches;
    // Sparsi lungo la campagna: dal primo all'ultimo, non solo i primi livelli
    return Array.from({ length: limit }, (_, i) => matches[Math.round(i * (matches.length - 1) / (limit - 1))]);
}

// Obiettivo LPI che allena un comando del gioco (per il Tutor): prima LPIC-1, poi Linux Essentials
function lpiObjectiveFor(cmd) {
    for (const exam of LPI_EXAMS) {
        const objective = exam.objectives.find(item => item.cmds && item.cmds.includes(cmd));
        if (objective) return { exam, objective };
    }
    return null;
}

function lpiObjectiveCard(exam, objective) {
    const card = lpiEl("section", "lpi-objective");
    card.id = `lpi-${exam.id}-${objective.id}`.replace(/\./g, "-");
    const head = lpiEl("div", "lpi-objective-head");
    const title = lpiEl("h3", "lpi-objective-title");
    title.append(lpiEl("span", "lpi-objective-id", objective.id), document.createTextNode(` ${objective.title}`));
    head.append(title, lpiEl("span", "lpi-weight", `peso ${objective.weight}`));
    card.appendChild(head);

    const actions = lpiEl("div", "lpi-actions");
    if (objective.offline) {
        const read = lpiEl("button", "lpi-level lpi-read", `📖 Leggi qui${objective.offline.length > 1 ? ` (${objective.offline.length} lezioni)` : ""}`);
        read.title = "Il testo integrale della lezione, anche senza connessione";
        read.onclick = () => openLpiLesson(exam.id, objective.id);
        actions.appendChild(read);
    }
    actions.appendChild(lpiLink(`${objective.offline ? "Sul sito LPI" : `📖 ${objective.lessons === 1 ? "Lezione" : `${objective.lessons} lezioni`} in italiano`}`, objective.url));
    const studied = lpiEl("label", "lpi-studied");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = lpiStudied(exam.id, objective.id);
    box.onchange = () => {
        progress.lpi = progress.lpi || {};
        if (box.checked) progress.lpi[lpiKey(exam.id, objective.id)] = true;
        else delete progress.lpi[lpiKey(exam.id, objective.id)];
        persistProgress();
        renderLpiSummary(exam);
    };
    studied.append(box, document.createTextNode(" studiato"));
    actions.appendChild(studied);
    card.appendChild(actions);

    if (objective.terms.length) {
        const terms = lpiEl("div", "lpi-terms");
        objective.terms.forEach(term => {
            const inGame = LPI_GAME_TERMS.has(term);
            const chip = lpiEl("span", inGame ? "lpi-term in-game" : "lpi-term", inGame ? `✓ ${term}` : term);
            if (inGame) chip.title = "Questo comando è nel gioco";
            terms.appendChild(chip);
        });
        card.appendChild(terms);
    }
    if (objective.note) card.appendChild(lpiEl("p", "lpi-note", objective.note));

    const trainLevels = lpiLevelsFor(objective);
    const topics = [...new Set((objective.cmds || []).map(cmd => LPI_TRAINING[cmd]).filter(Boolean))].slice(0, 4);
    if (trainLevels.length || topics.length) {
        const train = lpiEl("div", "lpi-train");
        train.appendChild(lpiEl("span", "lpi-train-label", "Allenati in Pipe Dreams:"));
        trainLevels.forEach(({ lvl, index }) => {
            const unlocked = isUnlocked(progress, levels, index);
            const done = progress.levels[lvl.id];
            const button = lpiEl("button", "lpi-level", `${index + 1}. ${lvl.title}${done ? ` ${starString(levelStars(progress, lvl.id))}` : unlocked ? "" : " 🔒"}`);
            button.disabled = !unlocked;
            button.onclick = () => {
                closeLpi();
                closeMenu();
                loadLevel(index);
            };
            train.appendChild(button);
        });
        topics.forEach(topic => {
            const info = TRAINING_TOPICS.find(item => item.id === topic);
            if (!info) return;
            const button = lpiEl("button", "lpi-level lpi-topic", `🎯 Allenamento ${info.label}`);
            button.onclick = () => {
                closeLpi();
                closeMenu();
                startTraining(topic);
            };
            train.appendChild(button);
        });
        card.appendChild(train);
    }
    return card;
}

function renderLpiSummary(exam) {
    const total = exam.objectives.reduce((sum, item) => sum + item.weight, 0);
    const studied = exam.objectives.filter(item => lpiStudied(exam.id, item.id));
    const trained = exam.objectives.filter(item => item.cmds && item.cmds.length);
    const summary = document.getElementById("lpi-summary");
    summary.textContent = `Studiati: ${studied.length} obiettivi su ${exam.objectives.length} (peso ${studied.reduce((sum, item) => sum + item.weight, 0)} su ${total}).`
        + (trained.length ? ` Pipe Dreams allena ${trained.map(item => item.id).join(", ")} (peso ${trained.reduce((sum, item) => sum + item.weight, 0)} su ${total}).` : "");
}

function renderLpi() {
    document.getElementById("lpi-tabs").hidden = false;
    if (typeof lpiLessonState !== "undefined") lpiLessonState.objective = null;
    const exam = LPI_EXAMS.find(item => item.id === lpiState.exam) || LPI_EXAMS[0];
    document.querySelectorAll("#lpi-tabs button").forEach(button => {
        const active = button.dataset.exam === exam.id;
        button.setAttribute("aria-selected", String(active));
        button.classList.toggle("active", active);
        button.tabIndex = active ? 0 : -1;
    });
    const body = document.getElementById("lpi-body");
    body.innerHTML = "";
    const intro = lpiEl("p", "lpi-intro");
    intro.append(document.createTextNode(`${exam.name}, obiettivi versione ${exam.version}. `),
        lpiLink("Tutte le lezioni", exam.url), document.createTextNode(" · "), lpiLink("PDF in italiano", exam.pdf));
    body.appendChild(intro);
    if (exam.id === "010-160") {
        const news = lpiEl("p", "lpi-note");
        news.append(document.createTextNode("È uscita Linux Essentials 2.0: la traduzione italiana delle lezioni è in preparazione. "), lpiLink("Vedi a che punto è", LPI_SOURCE.newEssentials));
        body.appendChild(news);
    }
    const summary = lpiEl("p", "lpi-summary");
    summary.id = "lpi-summary";
    body.appendChild(summary);
    exam.objectives.forEach(objective => body.appendChild(lpiObjectiveCard(exam, objective)));
    const source = lpiEl("p", "lpi-source");
    source.append(document.createTextNode("Le lezioni sono del Linux Professional Institute, tradotte in italiano da volontari, con licenza "),
        lpiLink(LPI_SOURCE.license, LPI_SOURCE.licenseUrl),
        document.createTextNode(`: si usano gratis per studio, senza scopo commerciale. Pesi e comandi dagli obiettivi ufficiali (`),
        lpiLink("wiki LPI", LPI_SOURCE.objectivesUrl[exam.id === "010-160" ? "le" : "lpic"]),
        document.createTextNode(`), controllati il ${LPI_SOURCE.checked.split("-").reverse().join("/")}. Le note e i collegamenti ai livelli sono di Pipe Dreams. Le lezioni con «📖 Leggi qui» sono copiate nel gioco, integrali e non modificate, e si leggono anche senza connessione; le altre si aprono su learning.lpi.org.`));
    body.appendChild(source);
    renderLpiSummary(exam);
}

function openLpi(examId, objectiveId) {
    if (examId) lpiState.exam = examId;
    renderLpi();
    document.getElementById("lpi-overlay").hidden = false;
    const panel = document.querySelector(".lpi-panel");
    if (objectiveId) {
        const card = document.getElementById(`lpi-${lpiState.exam}-${objectiveId}`.replace(/\./g, "-"));
        if (card) {
            card.classList.add("lpi-highlight");
            requestAnimationFrame(() => card.scrollIntoView({ block: "start" }));
        }
    } else {
        panel.scrollTop = 0;
    }
}

function closeLpi() {
    document.getElementById("lpi-overlay").hidden = true;
}

document.querySelectorAll("#lpi-tabs button").forEach(button => {
    button.onclick = () => {
        lpiState.exam = button.dataset.exam;
        renderLpi();
        document.querySelector(".lpi-panel").scrollTop = 0;
    };
    // Frecce tra le schede, come nei tablist
    button.onkeydown = event => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        const tabs = [...document.querySelectorAll("#lpi-tabs button")];
        const next = tabs[(tabs.indexOf(button) + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.click();
        next.focus();
    };
});
