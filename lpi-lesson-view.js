// Lezioni LPI dentro il gioco: il testo integrale e non modificato di alcune lezioni ufficiali in
// italiano (lpi-lessons.js, licenza CC BY-NC-ND 4.0), da leggere anche senza connessione.
// Si aprono dalla sezione LPI con «📖 Leggi qui» e prendono il posto degli obiettivi nella stessa
// finestra; «← Obiettivi» torna alla scheda da cui si è partiti. Il file con le lezioni (circa
// 240 KB) si carica solo la prima volta che se ne apre una. Tutto il testo va con textContent.

const lpiLessonState = { loading: null, objective: null };

// Carica lpi-lessons.js una volta sola; callback(true) quando c'è, callback(false) se non si carica
function loadLpiLessons(callback) {
    if (typeof LPI_LESSONS !== "undefined") {
        callback(true);
        return;
    }
    if (!lpiLessonState.loading) {
        lpiLessonState.loading = new Promise(resolve => {
            const script = document.createElement("script");
            script.src = "lpi-lessons.js";
            script.onload = () => resolve(true);
            script.onerror = () => {
                script.remove();
                lpiLessonState.loading = null;
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }
    lpiLessonState.loading.then(callback);
}

// I titoli della lezione scendono di due livelli: la finestra ha già il suo h2
const LPI_LESSON_HEADINGS = { h1: "h3", h2: "h3", h3: "h4", h4: "h5" };
const LPI_LESSON_TAGS = new Set(["p", "pre", "code", "strong", "em", "kbd", "ul", "ol", "li", "dl", "dt", "dd", "table", "tr", "th", "td"]);

// Un nodo della lezione (stringa o [tag, figli...]) diventato elemento del DOM
function lpiLessonNode(node, sections) {
    if (typeof node === "string") return document.createTextNode(node);
    const [tag] = node;
    if (tag === "a") {
        const [, href, ...children] = node;
        const link = href ? lpiLink("", href) : lpiEl("span");
        children.forEach(child => link.appendChild(lpiLessonNode(child, sections)));
        return link;
    }
    if (tag === "note") {
        const [, label, ...children] = node;
        const box = lpiEl("aside", "lpi-lesson-note");
        box.appendChild(lpiEl("strong", "lpi-lesson-note-label", label));
        children.forEach(child => box.appendChild(lpiLessonNode(child, sections)));
        return box;
    }
    let element;
    if (LPI_LESSON_HEADINGS[tag]) {
        element = lpiEl(LPI_LESSON_HEADINGS[tag], `lpi-lesson-${tag}`);
    } else if (tag === "caption") {
        element = lpiEl("p", "lpi-lesson-caption");
    } else if (LPI_LESSON_TAGS.has(tag)) {
        element = lpiEl(tag, tag === "pre" ? "lpi-lesson-pre" : "");
    } else {
        element = lpiEl("span");
    }
    node.slice(1).forEach(child => element.appendChild(lpiLessonNode(child, sections)));
    if (tag === "h2") {
        element.id = `lpi-lesson-sec-${sections.length}`;
        element.tabIndex = -1;
        sections.push(element);
    }
    // Le tabelle stanno in un contenitore: con il testo che va a capo non scorrono mai di lato
    if (tag === "table") {
        const wrap = lpiEl("div", "lpi-lesson-table");
        wrap.appendChild(element);
        return wrap;
    }
    return element;
}

function renderLpiLesson(exam, objective, lessonId) {
    const lesson = LPI_LESSONS.find(item => item.id === lessonId);
    const body = document.getElementById("lpi-body");
    body.innerHTML = "";
    document.getElementById("lpi-tabs").hidden = true;

    const bar = lpiEl("div", "lpi-lesson-bar");
    const back = lpiEl("button", "lpi-level lpi-lesson-back", "← Obiettivi");
    back.onclick = () => closeLpiLesson();
    bar.appendChild(back);
    if (objective.offline.length > 1) objective.offline.forEach((id, index) => {
        const button = lpiEl("button", "lpi-level", `Lezione ${index + 1}`);
        if (id === lessonId) {
            button.setAttribute("aria-current", "true");
            button.classList.add("active");
        }
        button.onclick = () => openLpiLesson(exam.id, objective.id, id);
        bar.appendChild(button);
    });
    body.appendChild(bar);

    body.appendChild(lpiEl("p", "lpi-lesson-objective", `${exam.name} · ${objective.id} ${objective.title}`));

    const sections = [];
    const content = lpiEl("article", "lpi-lesson");
    lesson.body.forEach(node => content.appendChild(lpiLessonNode(node, sections)));

    // Indice delle sezioni (Introduzione, Esercizi Guidati, Risposte...)
    const index = lpiEl("nav", "lpi-lesson-index");
    index.setAttribute("aria-label", "Sezioni della lezione");
    sections.forEach(heading => {
        const button = lpiEl("button", "lpi-level", heading.textContent);
        button.onclick = () => {
            heading.scrollIntoView({ block: "start" });
            heading.focus({ preventScroll: true });
        };
        index.appendChild(button);
    });
    body.append(index, content);

    const source = lpiEl("p", "lpi-source lpi-lesson-source");
    source.append(document.createTextNode(`${lesson.notice} `),
        document.createTextNode(`Testo integrale e non modificato della lezione ufficiale, copiato da learning.lpi.org il ${LPI_LESSONS_FETCHED.split("-").reverse().join("/")} e tradotto in italiano dai volontari LPI. `),
        lpiLink("Lezione originale", lesson.url), document.createTextNode(" · "),
        lpiLink(`Licenza ${LPI_SOURCE.license}`, LPI_SOURCE.licenseUrl));
    body.appendChild(source);

    document.querySelector(".lpi-panel").scrollTop = 0;
    back.focus();
}

// Apre una lezione nella finestra LPI (lessonId: la prima dell'obiettivo se manca)
function openLpiLesson(examId, objectiveId, lessonId) {
    const exam = LPI_EXAMS.find(item => item.id === examId);
    const objective = exam && exam.objectives.find(item => item.id === objectiveId);
    if (!objective || !objective.offline) return;
    lpiState.exam = examId;
    lpiLessonState.objective = objectiveId;
    document.getElementById("lpi-overlay").hidden = false;
    const body = document.getElementById("lpi-body");
    body.innerHTML = "";
    body.appendChild(lpiEl("p", "lpi-intro", "Carico la lezione..."));
    loadLpiLessons(ok => {
        if (lpiLessonState.objective !== objectiveId) return;
        if (!ok) {
            body.innerHTML = "";
            body.appendChild(lpiEl("p", "lpi-note", "La lezione non si è caricata. Riprova, oppure aprila su learning.lpi.org."));
            const back = lpiEl("button", "lpi-level", "← Obiettivi");
            back.onclick = () => closeLpiLesson();
            body.appendChild(back);
            return;
        }
        renderLpiLesson(exam, objective, lessonId || objective.offline[0]);
    });
}

// Torna agli obiettivi, sulla scheda della lezione appena letta
function closeLpiLesson() {
    const objectiveId = lpiLessonState.objective;
    lpiLessonState.objective = null;
    document.getElementById("lpi-tabs").hidden = false;
    openLpi(lpiState.exam, objectiveId);
    const card = document.getElementById(`lpi-${lpiState.exam}-${objectiveId}`.replace(/\./g, "-"));
    const button = card && card.querySelector(".lpi-read");
    if (button) button.focus({ preventScroll: true });
}
