// Finestra del Tutor: una pagina per l'obiettivo, una per ogni comando, una per il risultato.
// Si apre con «🎓 TUTOR» dopo una vittoria, o con «🎓» nel menu sui livelli già risolti.
// Tutto il testo è inserito con textContent (l'obiettivo passa da DOMParser, che non esegue niente).

const tutor = { lesson: null, lvl: null, steps: null, page: 0 };

function tutorEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// Testo dell'obiettivo senza HTML
const missionText = html => new DOMParser().parseFromString(String(html), "text/html").body.textContent;

// Classi per le righe prima/dopo: quelle che spariscono e quelle nuove o trasformate
function lineStates(lines, others) {
    const left = new Map();
    others.forEach(line => left.set(line.text, (left.get(line.text) || 0) + 1));
    return lines.map(line => {
        const count = left.get(line.text) || 0;
        if (count) {
            left.set(line.text, count - 1);
            return "";
        }
        return "tutor-diff";
    });
}

function tutorChips(lines, states, limit = 12) {
    const box = tutorEl("span", "chips");
    const shown = lines.slice(0, limit);
    renderChips(box, shown, states ? states.slice(0, limit) : []);
    if (lines.length > limit) box.appendChild(tutorEl("span", "tutor-more", `… e altre ${lines.length - limit}`));
    return box;
}

function tutorRow(label, content) {
    const row = tutorEl("div", "tutor-row");
    row.append(tutorEl("span", "tutor-label", label), content);
    return row;
}

const tutorPageCount = () => tutor.lesson.passes.length + 2;

function tutorGoalPage() {
    const lesson = tutor.lesson;
    const nodes = [tutorEl("h3", "tutor-heading", "L'obiettivo")];
    nodes.push(tutorEl("p", "tutor-text", missionText(tutor.lvl.mission)));
    nodes.push(tutorRow("input", tutorChips(lesson.input)));
    const pipeline = tutorEl("code", "tutor-pipeline", lesson.pipeline);
    nodes.push(tutorRow("pipeline", pipeline));
    if (lesson.insight) {
        const tip = tutorEl("p", "tutor-insight");
        tip.append(tutorEl("strong", "", "Il trucco: "), document.createTextNode(lesson.insight));
        nodes.push(tip);
    }
    const count = lesson.passes.length;
    nodes.push(tutorEl("p", "tutor-hint", count === 1 ? "Ora vediamo il comando: usa Avanti ▶ o le frecce."
        : `Ora vediamo i ${count} comandi uno alla volta: usa Avanti ▶ o le frecce.`));
    return nodes;
}

function tutorStepPage(index) {
    const pass = tutor.lesson.passes[index];
    const nodes = [];
    const heading = tutorEl("h3", "tutor-heading", `Passo ${index + 1}: `);
    heading.appendChild(tutorEl("code", "", pass.label));
    nodes.push(heading);
    nodes.push(tutorEl("p", "tutor-text", `${pass.label.split(" ")[0]} ${pass.what}`));
    if (pass.options.length) {
        const list = tutorEl("dl", "tutor-options");
        pass.options.forEach(option => list.append(tutorEl("dt", "", option.flag), tutorEl("dd", "", option.text)));
        nodes.push(list);
    }
    nodes.push(tutorRow("prima", tutorChips(pass.before, lineStates(pass.before, pass.after))));
    nodes.push(tutorRow("dopo", tutorChips(pass.after, lineStates(pass.after, pass.before))));
    nodes.push(tutorEl("p", "tutor-hint", "Bordo giallo: prima, le righe che spariscono o cambiano; dopo, quelle nuove o trasformate."));
    if (pass.toTerminal.length) nodes.push(tutorRow("sul terminale", tutorChips(pass.toTerminal.map(text => ({ text, fd: 2 })))));
    const why = tutorEl("div", "tutor-why");
    why.append(tutorEl("strong", "", "Perché serve qui: "), document.createTextNode(pass.without.sentence));
    nodes.push(why);
    if (!pass.without.solved) nodes.push(tutorRow("senza", tutorChips(pass.without.output.map(text => ({ text, fd: 1 })), null, 8)));
    const links = tutorEl("div", "tutor-links");
    const entry = MANUAL.find(item => item.cmds.includes(pass.cmd));
    if (entry) {
        const man = tutorEl("button", "manual-man", `📄 man ${MAN_PAGES[entry.id].names[0]}`);
        man.onclick = () => { closeTutor(); openManPage(entry.id); };
        links.appendChild(man);
    }
    // L'obiettivo d'esame LPI che allena questo comando (sezione 📘 LPI)
    const lpi = typeof lpiObjectiveFor === "function" ? lpiObjectiveFor(pass.cmd) : null;
    if (lpi) {
        const exam = tutorEl("button", "manual-man", `📘 LPI ${lpi.objective.id}`);
        exam.title = `${lpi.exam.name}: ${lpi.objective.title}`;
        exam.onclick = () => { closeTutor(); openLpi(lpi.exam.id, lpi.objective.id); };
        links.appendChild(exam);
    }
    if (links.childNodes.length) nodes.push(links);
    return nodes;
}

function tutorResultPage() {
    const lesson = tutor.lesson;
    const lvl = tutor.lvl;
    const nodes = [tutorEl("h3", "tutor-heading", "Il risultato")];
    nodes.push(tutorRow("stdout", tutorChips(lesson.output.map(text => ({ text, fd: 1 })))));
    if (lesson.stderr.length) nodes.push(tutorRow("sul terminale", tutorChips(lesson.stderr.map(text => ({ text, fd: 2 })))));
    nodes.push(tutorEl("p", "tutor-text", lesson.solved
        ? `È proprio quello che chiedeva il livello, con ${lesson.passes.length === 1 ? "un comando" : `${lesson.passes.length} comandi`}.`
        : "Questa pipeline non risolve il livello."));
    if (lvl.type === "quiz" && lvl.wrong) {
        nodes.push(tutorEl("h3", "tutor-heading", "Le risposte sbagliate"));
        const list = tutorEl("ul", "tutor-list");
        lvl.wrong.forEach(alt => {
            const item = tutorEl("li");
            item.append(tutorEl("code", "", pipelineText(alt.steps)), document.createTextNode(` · ${alt.why}`));
            list.appendChild(item);
        });
        nodes.push(list);
    }
    if (lvl.type === "debug" && lvl.start) {
        nodes.push(tutorRow("era rotta", tutorEl("code", "tutor-pipeline", pipelineText(gridSteps(lvl, lvl.start)))));
    }
    if (!lvl.type && !lvl.locked && lesson.solved) {
        const best = tutorStepsFor(lvl);
        if (best.length < lesson.passes.length) {
            nodes.push(tutorRow("più corta", tutorEl("code", "tutor-pipeline", pipelineText(best))));
            nodes.push(tutorEl("p", "tutor-text", `Si può fare con ${best.length === 1 ? "un comando" : `${best.length} comandi`}: rivedi i passi con «Perché serve qui» per trovare quello in più.`));
        }
    }
    if (lvl.explain && lvl.explain !== lesson.insight) nodes.push(tutorEl("p", "tutor-insight", lvl.explain));
    const lab = tutorEl("button", "manual-man", "⚗️ Prova nel laboratorio");
    lab.onclick = () => {
        closeTutor();
        openLab({ input: lvl.stdin, steps: tutor.steps }, LAB_BACK_TO_LEVEL, { target: lvl.target, targetStderr: lvl.targetStderr });
    };
    nodes.push(lab);
    return nodes;
}

function renderTutorPage() {
    const total = tutorPageCount();
    const page = tutor.page;
    const nodes = page === 0 ? tutorGoalPage() : page === total - 1 ? tutorResultPage() : tutorStepPage(page - 1);
    const body = document.getElementById("tutor-body");
    body.innerHTML = "";
    body.append(...nodes);
    document.getElementById("tutor-pos").textContent = `${page + 1} di ${total}`;
    document.getElementById("tutor-prev").disabled = page === 0;
    const next = document.getElementById("tutor-next");
    next.textContent = page === total - 1 ? "Fine ✓" : "Avanti ▶";
    document.querySelector(".tutor-panel").scrollTop = 0;
}

function tutorMove(delta) {
    const target = tutor.page + delta;
    if (target >= tutorPageCount()) {
        closeTutor();
        return;
    }
    tutor.page = Math.max(0, target);
    renderTutorPage();
}

function openTutor(lvl, steps) {
    tutor.lvl = lvl;
    tutor.steps = steps.filter(step => step && step.cmd !== null);
    tutor.lesson = tutorLesson(lvl, tutor.steps);
    tutor.page = 0;
    document.getElementById("tutor-title").textContent = `🎓 TUTOR · ${lvl.title}`;
    renderTutorPage();
    document.getElementById("tutor-overlay").hidden = false;
}

function closeTutor() {
    document.getElementById("tutor-overlay").hidden = true;
}

// Dal pulsante dopo la vittoria: la pipeline appena usata; il passaggio automatico si ferma
function openTutorFromLevel() {
    if (!lastTutor) return;
    holdAutoNext();
    openTutor(lastTutor.lvl, lastTutor.steps);
}

document.getElementById("tutor-prev").onclick = () => tutorMove(-1);
document.getElementById("tutor-next").onclick = () => tutorMove(1);
document.getElementById("tutor-overlay").addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); tutorMove(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); tutorMove(-1); }
});
