// Casi a puntate nel gioco: elenco dei casi, capitoli, enigmi (stdout atteso nascosto),
// taccuino degli indizi e domanda di deduzione. Progressi in progress.stories[id]:
// { puzzles: { "capitolo/enigma": { stars, best } }, chapters: { capitolo: { stars, attempts } }, tries: { capitolo: n } }

let mystery = null; // { story, chapter, puzzle } durante un enigma

const findStory = id => STORIES.find(story => story.id === id);
const storyProgress = id => {
    if (!progress.stories[id]) progress.stories[id] = { puzzles: {}, chapters: {}, tries: {} };
    return progress.stories[id];
};
const puzzleKey = (chapter, puzzle) => `${chapter.id}/${puzzle.id}`;
const storyOpen = story => actCompleted(story.requiresAct);
const solvedChapters = story => story.chapters.filter(chapter => (progress.stories[story.id] || { chapters: {} }).chapters[chapter.id]).length;

// "done", "open", "locked" (capitolo precedente da risolvere) o "soon" (data di uscita futura)
function chapterStatus(story, index) {
    const state = progress.stories[story.id] || { chapters: {} };
    const chapter = story.chapters[index];
    if (state.chapters[chapter.id]) return "done";
    if (index > 0 && !state.chapters[story.chapters[index - 1].id]) return "locked";
    if (chapter.release && chapter.release > dateKey()) return "soon";
    return "open";
}

// --- Finestra dei casi: elenco, capitoli, taccuino, deduzione ---

function showStoriesPanel(title, nodes, back) {
    document.getElementById("stories-title").textContent = title;
    const backButton = document.getElementById("stories-back");
    backButton.hidden = !back;
    backButton.onclick = back || null;
    const body = document.getElementById("stories-body");
    body.replaceChildren(...nodes);
    document.getElementById("stories-overlay").hidden = false;
    body.scrollTop = 0;
}

function openStories() {
    closeMenu();
    const nodes = [el("p", "manual-hint", "Gialli a puntate: in ogni capitolo le pipeline trovano gli indizi, e tu deduci cosa è successo. Lo stdout atteso è nascosto: è proprio l'indizio da scoprire.")];
    for (const story of STORIES) {
        const item = el("div", "gallery-item story-item");
        const info = el("div", "gallery-info");
        const solved = solvedChapters(story);
        info.append(el("strong", "", story.title), el("span", "gallery-meta", story.synopsis),
            el("span", "gallery-stars", storyOpen(story)
                ? `${solved}/${story.chapters.length} capitoli${solved === story.chapters.length ? " · ✓ caso chiuso" : ""}`
                : `🔒 Si sblocca completando l'Atto ${ROMAN[story.requiresAct] || story.requiresAct}`));
        const open = el("button", "btn-hint gallery-play", storyOpen(story) ? "▶ APRI" : "🔒");
        open.disabled = !storyOpen(story);
        open.setAttribute("aria-label", `Apri il caso ${story.title}`);
        open.onclick = () => openStory(story.id);
        item.append(info, open);
        nodes.push(item);
    }
    showStoriesPanel("📚 CASI", nodes, null);
}

function closeStories() {
    document.getElementById("stories-overlay").hidden = true;
}

function openStory(id) {
    const story = findStory(id);
    const state = storyProgress(id);
    const nodes = [el("p", "manual-description", story.synopsis)];
    story.chapters.forEach((chapter, index) => {
        const status = chapterStatus(story, index);
        const item = el("div", "gallery-item story-chapter " + status);
        const info = el("div", "gallery-info");
        const record = state.chapters[chapter.id];
        const label = { done: record ? `✓ ${starString(record.stars)}` : "✓", open: "da giocare", locked: "🔒 risolvi il capitolo precedente", soon: `🔒 esce il ${formatDate(chapter.release || "")}` }[status];
        info.append(el("strong", "", `${index + 1}. ${chapter.title}`), el("span", "gallery-stars", label));
        const play = el("button", "btn-hint gallery-play", status === "done" ? "↺ RIGIOCA" : "▶ GIOCA");
        play.disabled = status === "locked" || status === "soon";
        play.setAttribute("aria-label", `${status === "done" ? "Rigioca" : "Gioca"} il capitolo ${index + 1}: ${chapter.title}`);
        play.onclick = () => startChapter(id, chapter.id);
        item.append(info, play);
        nodes.push(item);
    });
    const notebook = el("button", "menu-stats", "🗒 Taccuino degli indizi");
    notebook.onclick = () => openNotebook(id);
    nodes.push(notebook);
    if (solvedChapters(story) === story.chapters.length) {
        const ending = el("button", "menu-stats", "📜 Rileggi il finale");
        ending.onclick = () => { closeStories(); showStoryScreen("CASO CHIUSO", story.title, story.epilogue, "CHIUDI"); };
        nodes.push(ending);
    }
    showStoriesPanel(`📚 ${story.title.toUpperCase()}`, nodes, openStories);
}

// Indizi trovati: il risultato di ogni enigma risolto, capitolo per capitolo
function clueNodes(story, chapters) {
    const state = storyProgress(story.id);
    const nodes = [];
    for (const chapter of chapters) {
        const found = chapter.puzzles.filter(puzzle => state.puzzles[puzzleKey(chapter, puzzle)]);
        if (!found.length) continue;
        nodes.push(el("h3", "manual-section", `${story.chapters.indexOf(chapter) + 1}. ${chapter.title}`));
        for (const puzzle of found) {
            const row = el("div", "notebook-clue");
            const chips = el("span", "chips");
            renderChips(chips, puzzle.level.target.map(text => ({ text, fd: 1 })));
            row.append(el("span", "notebook-label", `${puzzle.clue}:`), chips);
            nodes.push(row);
        }
    }
    return nodes;
}

function openNotebook(id) {
    const story = findStory(id);
    const clues = clueNodes(story, story.chapters);
    showStoriesPanel("🗒 TACCUINO", clues.length ? clues : [el("p", "manual-hint", "Ancora nessun indizio: risolvi gli enigmi del primo capitolo.")], () => openStory(id));
}

// --- Capitoli ed enigmi ---

function startChapter(storyId, chapterId) {
    const story = findStory(storyId);
    const index = story.chapters.findIndex(chapter => chapter.id === chapterId);
    const chapter = story.chapters[index];
    closeStories();
    closeMenu();
    showStoryScreen(`📚 ${story.title.toUpperCase()} · CAPITOLO ${index + 1}`, chapter.title, `${chapter.from}: «${chapter.text}»`, "🔎 INDAGA", () => {
        // Rigiocando un capitolo si ripetono tutti gli enigmi
        const state = storyProgress(storyId);
        const replay = Boolean(state.chapters[chapterId]);
        nextChapterStep(storyId, chapterId, replay ? 0 : null);
    });
}

// Prossimo enigma del capitolo (from: indice da cui ripartire, o null per il primo non risolto),
// oppure la domanda finale se gli enigmi sono finiti
function nextChapterStep(storyId, chapterId, from = null) {
    const story = findStory(storyId);
    const chapter = story.chapters.find(item => item.id === chapterId);
    const state = storyProgress(storyId);
    const index = from !== null ? from : chapter.puzzles.findIndex(puzzle => !state.puzzles[puzzleKey(chapter, puzzle)]);
    if (index === -1 || index >= chapter.puzzles.length) {
        openDeduction(storyId, chapterId);
        return;
    }
    playPuzzle(storyId, chapterId, index);
}

function playPuzzle(storyId, chapterId, index) {
    const story = findStory(storyId);
    const chapterIndex = story.chapters.findIndex(item => item.id === chapterId);
    const chapter = story.chapters[chapterIndex];
    const puzzle = chapter.puzzles[index];
    stopMarathon();
    stopTraining();
    stopGallery();
    dailyLevel = {
        ...puzzle.level, id: `caso-${storyId}-${chapterId}-${puzzle.id}`, act: 0, hint: puzzle.level.hint || "",
        hiddenTarget: true, story: { from: chapter.from, text: chapter.text },
        mystery: { story: storyId, chapter: chapterId, puzzle: puzzle.id, index }
    };
    mystery = dailyLevel.mystery;
    showLevel(dailyLevel, `📚 CAP. ${chapterIndex + 1} · ${puzzle.level.title} (${index + 1}/${chapter.puzzles.length})`);
    document.getElementById("mystery-bar").hidden = false;
    document.getElementById("mystery-status").textContent = `📚 ${story.title} · capitolo ${chapterIndex + 1} · enigma ${index + 1}/${chapter.puzzles.length}`;
    logToConsole(`> Indizio da trovare: ${puzzle.clue.toLowerCase()}. Lo stdout atteso è nascosto: ha ${puzzle.level.target.length} ${puzzle.level.target.length === 1 ? "riga" : "righe"}.`);
}

// Chiamata da showResult quando un enigma è risolto
function mysterySolved(lvl) {
    const { story: storyId, chapter: chapterId, puzzle: puzzleId, index } = lvl.mystery;
    const story = findStory(storyId);
    const chapter = story.chapters.find(item => item.id === chapterId);
    const puzzle = chapter.puzzles.find(item => item.id === puzzleId);
    const used = usedSlots();
    const stars = Math.min(hintStarCap(), computeStars(used, currentSolution.par));
    const state = storyProgress(storyId);
    const firstTime = !state.puzzles[puzzleKey(chapter, puzzle)];
    recordResult({ levels: state.puzzles }, puzzleKey(chapter, puzzle), stars, used);
    persistProgress();
    checkSessionAchievements(currentSolution.par);
    playWin();
    celebrate(stars);
    logToConsole(`> ${rating(stars, used)}`, "log-success");
    logToConsole(`> 🗒 Indizio nel taccuino: ${puzzle.clue}: ${lvl.target.join(", ")}`, "log-hint");
    if (firstTime) showToast(`🗒 Nuovo indizio: ${puzzle.clue}`);
    const goOn = () => nextChapterStep(storyId, chapterId, index + 1 < chapter.puzzles.length ? index + 1 : chapter.puzzles.length);
    const review = reviewSolution(lvl, currentSteps(), { next: goOn });
    if (review.stop) {
        setBusy(false);
        return;
    }
    logToConsole(index + 1 < chapter.puzzles.length ? "> [SUCCESSO] Prossimo enigma..." : "> [SUCCESSO] Enigmi risolti: ora la deduzione...", "log-success");
    transitionTimer = setTimeout(goOn, review.pause ? 3500 : 2000);
}

// --- Deduzione ---

function openDeduction(storyId, chapterId) {
    const story = findStory(storyId);
    const chapterIndex = story.chapters.findIndex(item => item.id === chapterId);
    const chapter = story.chapters[chapterIndex];
    const state = storyProgress(storyId);
    const question = chapter.question;
    let attempts = 0;
    // Nell'ultimo capitolo servono gli indizi di tutto il caso
    const last = chapterIndex === story.chapters.length - 1;
    const nodes = [
        el("p", "deduction-question", question.text),
        el("h3", "manual-section", last ? "Il taccuino" : "Indizi di questo capitolo"),
        ...clueNodes(story, last ? story.chapters : [chapter])
    ];
    const options = el("div", "deduction-options");
    const feedback = el("p", "deduction-feedback");
    feedback.setAttribute("role", "status");
    question.options.forEach((text, i) => {
        const button = el("button", "deduction-option", text);
        button.onclick = () => {
            attempts++;
            state.tries[chapterId] = (state.tries[chapterId] || 0) + 1;
            if (i !== question.answer) {
                button.disabled = true;
                button.classList.add("wrong");
                feedback.textContent = `✗ No: ${question.why[i]}`;
                persistProgress();
                return;
            }
            button.classList.add("right");
            options.querySelectorAll("button").forEach(other => { other.disabled = true; });
            const stars = starsByAttempts(attempts);
            const previous = state.chapters[chapterId];
            if (!previous || stars > previous.stars) state.chapters[chapterId] = { stars, attempts };
            persistProgress();
            playWin();
            celebrate(stars);
            feedback.textContent = `✓ Esatto! ${question.explain} ${starString(stars)}`;
            const solvedAll = story.chapters.every(item => state.chapters[item.id]);
            if (solvedAll) unlockAchievement("detective");
            if (solvedAll && story.chapters.every(item => state.chapters[item.id].stars === 3)) unlockAchievement("sherlock");
            const next = el("button", "btn-run", last ? "📜 IL FINALE" : "CAPITOLO SUCCESSIVO ▶");
            next.onclick = () => {
                closeStories();
                if (last) showStoryScreen("CASO CHIUSO", story.title, story.epilogue, "CHIUDI", () => openStory(storyId));
                else if (chapterStatus(story, chapterIndex + 1) === "open") startChapter(storyId, story.chapters[chapterIndex + 1].id);
                else openStory(storyId);
            };
            nodes.push(next);
            document.getElementById("stories-body").appendChild(next);
            next.focus();
        };
        options.appendChild(button);
    });
    nodes.push(options, feedback);
    stopMystery();
    loadLevel(startLevelIndex());
    showStoriesPanel(`🔎 CAPITOLO ${chapterIndex + 1}: DEDUZIONE`, nodes, () => openStory(storyId));
}

function stopMystery() {
    mystery = null;
    document.getElementById("mystery-bar").hidden = true;
}

function exitMystery() {
    stopMystery();
    loadLevel(startLevelIndex());
}

function mysteryNotebook() {
    if (mystery) openNotebook(mystery.story);
}
