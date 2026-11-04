// Allenamento: livelli generati senza fine su un comando scelto, senza tempo né punteggio.
// I primi livelli sono brevi, poi arrivano quelli con più comandi e infine quelli della sfida del giorno.

// Allenamento in corso: { topic, seed, round, solved }
let training = null;

const trainingTopic = id => TRAINING_TOPICS.find(topic => topic.id === id);
const trainingTotal = () => Object.values(progress.training).reduce((sum, n) => sum + n, 0);

function openTrainingMenu() {
    closeMenu();
    const list = document.getElementById("training-list");
    list.innerHTML = "";
    for (const topic of TRAINING_TOPICS) {
        const button = el("button", "training-topic");
        button.dataset.topic = topic.id;
        const solved = progress.training[topic.id] || 0;
        button.append(el("strong", "", topic.label), el("span", "training-desc", topic.desc),
            el("span", "training-count", solved ? `✓ ${solved}` : ""));
        button.onclick = () => startTraining(topic.id);
        list.appendChild(button);
    }
    document.getElementById("training-overlay").hidden = false;
}

function closeTrainingMenu() {
    document.getElementById("training-overlay").hidden = true;
}

function startTraining(topicId) {
    if (!trainingTopic(topicId)) return;
    stopMarathon();
    stopGallery();
    stopMystery();
    closeMenu();
    closeTrainingMenu();
    closeActIntro();
    training = { topic: topicId, seed: Date.now().toString(36), round: 0, solved: 0 };
    document.getElementById("training-bar").hidden = false;
    nextTrainingLevel();
}

function nextTrainingLevel() {
    if (!training) return;
    const topic = trainingTopic(training.topic);
    const lvl = generateTrainingLevel(training.topic, training.seed, training.round);
    training.round++;
    dailyLevel = lvl;
    showLevel(lvl, `🎯 ALLENAMENTO ${topic.label.toUpperCase()} · LIVELLO ${training.solved + 1}: ${lvl.title}`);
    logToConsole(`> Allenamento su ${topic.label}: ${topic.desc}. Nessun limite di tempo.`);
    updateTrainingBar();
}

function updateTrainingBar() {
    const topic = trainingTopic(training.topic);
    document.getElementById("training-status").textContent =
        `🎯 ${topic.label} · risolti oggi: ${training.solved} · in totale: ${progress.training[training.topic] || 0}`;
}

// Chiamata da showResult quando un livello dell'allenamento è risolto
function trainingSolved(lvl) {
    const used = usedSlots();
    const stars = Math.min(hintStarCap(), computeStars(used, currentSolution.par));
    training.solved++;
    progress.training[training.topic] = (progress.training[training.topic] || 0) + 1;
    persistProgress();
    checkSessionAchievements(currentSolution.par);
    if (trainingTotal() >= 10) unlockAchievement("palestra");
    updateTrainingBar();
    playWin();
    celebrate(stars);
    logToConsole(`> ${rating(stars, used)}`, "log-success");
    const review = reviewSolution(lvl, currentSteps(), { next: nextTrainingLevel });
    if (review.stop) {
        setBusy(false);
        return;
    }
    logToConsole("> [SUCCESSO] Prossimo livello...", "log-success");
    transitionTimer = setTimeout(nextTrainingLevel, review.pause ? 3500 : 1500);
}

function skipTrainingLevel() {
    if (!training) return;
    nextTrainingLevel();
}

function stopTraining() {
    if (!training) return;
    training = null;
    document.getElementById("training-bar").hidden = true;
}

function exitTraining() {
    stopTraining();
    loadLevel(startLevelIndex());
}
