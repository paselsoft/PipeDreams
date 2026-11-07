// Galleria della community nel gioco: elenco dei livelli di community.js, da giocare con le
// stelle salvate in progress.community. L'obiettivo viene mostrato come quello dei link condivisi.

// Livello giocabile da una voce della galleria
function communityLevel(entry) {
    return { ...entry.level, id: entry.id, act: 0, hint: entry.level.hint || "", community: { id: entry.id, author: entry.author } };
}

function openGallery() {
    closeMenu();
    const list = document.getElementById("gallery-list");
    list.innerHTML = "";
    for (const entry of COMMUNITY_LEVELS) {
        const record = progress.community[entry.id];
        const item = el("div", "gallery-item");
        item.appendChild(avatarNode(entry.author));
        const info = el("div", "gallery-info");
        info.append(el("strong", "", entry.level.title),
            el("span", "gallery-meta", `di ${entry.author} · ${entry.level.allowedCommands.length} comandi a disposizione`),
            el("span", "gallery-stars", record ? starString(record.stars) : "da giocare"));
        const play = el("button", "btn-hint gallery-play", "▶ GIOCA");
        play.setAttribute("aria-label", `Gioca ${entry.level.title} di ${entry.author}`);
        play.onclick = () => playCommunity(entry.id);
        item.append(info, play);
        list.appendChild(item);
    }
    const solved = COMMUNITY_LEVELS.filter(entry => progress.community[entry.id]).length;
    document.getElementById("gallery-total").textContent = `${solved}/${COMMUNITY_LEVELS.length} risolti`;
    document.getElementById("gallery-overlay").hidden = false;
}

function closeGallery() {
    document.getElementById("gallery-overlay").hidden = true;
}

function playCommunity(id) {
    const entry = COMMUNITY_LEVELS.find(item => item.id === id);
    if (!entry) return;
    stopMarathon();
    stopTraining();
    stopMystery();
    closeGallery();
    closeMenu();
    dailyLevel = communityLevel(entry);
    showLevel(dailyLevel, `🌍 COMMUNITY: ${entry.level.title} (di ${entry.author})`);
    document.getElementById("gallery-bar").hidden = false;
    document.getElementById("gallery-status").textContent = `🌍 Livello di ${entry.author}`;
    logToConsole(`> Livello della community, proposto da ${entry.author}.`);
    const record = progress.community[id];
    if (record) logToConsole(`> Record personale: ${starString(record.stars)} (${commandCount(record.best)})`, "log-hint");
}

// Chiamata da showResult quando un livello della galleria è risolto
function communitySolved(lvl) {
    const used = usedSlots();
    const stars = Math.min(hintStarCap(), computeStars(used, currentSolution.par));
    const isRecord = recordResult({ levels: progress.community }, lvl.community.id, stars, used);
    persistProgress();
    checkSessionAchievements(currentSolution.par);
    if (Object.keys(progress.community).length >= 3) unlockAchievement("esploratore");
    playWin();
    celebrate(stars);
    logToConsole(`> ${rating(stars, used)}${isRecord ? " · Nuovo record!" : ""}`, "log-success");
    reviewSolution(lvl, currentSteps(), { next: openGallery });
    logToConsole("> [SUCCESSO] Livello della community risolto: torna alla 🌍 Galleria per un altro.", "log-success");
    setBusy(false);
}

function stopGallery() {
    document.getElementById("gallery-bar").hidden = true;
}

function exitGallery() {
    stopGallery();
    loadLevel(startLevelIndex());
}

