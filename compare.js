// Confronto dopo la vittoria: la pipeline del giocatore accanto alle soluzioni ottimali del solver.
// Se la soluzione è più lunga del par, il gioco si ferma e spiega quali comandi si possono togliere.

// pipelineText (terminal.js) scrive la pipeline come in bash, con i reindirizzamenti attaccati

// Vale per i livelli "componi" senza celle bloccate (quiz e debug si valutano sui tentativi)
const canCompare = lvl => !lvl.type && !lvl.locked;

function solutionReport(lvl, steps, solution) {
    const mine = steps.filter(step => step.cmd !== null);
    const text = pipelineText(mine);
    const optimalSteps = solution.optimalSteps || [];
    const report = { mine: text, used: mine.length, par: solution.par, optimal: mine.length <= solution.par };
    if (report.optimal) {
        report.alternatives = optimalSteps.map(pipelineText).filter(other => other !== text).slice(0, 2);
        return report;
    }
    report.best = optimalSteps[0];
    report.steps = mine;
    // Comandi che si possono togliere uno alla volta lasciando l'output giusto
    const solves = list => isSolved(lvl, executePipeline(lvl.stdin, list));
    report.removable = mine.map((step, i) => ({ step, i }))
        .filter(({ i }) => solves(mine.filter((_, j) => j !== i)))
        .map(({ step, i }) => ({ label: stepLabel(step), position: i + 1 }));
    return report;
}

// Istogramma delle soluzioni del livello (calcolato dal solver, senza dati di altri giocatori):
// righe dal par fino a qualche comando in più, o fino alla soluzione del giocatore
function histogramFor(lvl, used, par) {
    const maxLength = Math.min(levelSlots(lvl), Math.max(used, par + 2));
    return solutionHistogram(lvl, maxLength).rows.filter(row => row.commands >= par);
}

// Una riga per lunghezza: barra in scala logaritmica (i numeri crescono in fretta) e conteggio.
// La barra è nascosta ai lettori di schermo, che leggono la frase completa.
function logHistogram(rows, used) {
    const most = Math.max(...rows.map(row => row.count), 1);
    logToConsole("> 📊 Quante pipeline diverse risolvono questo livello:", "log-hint");
    const width = String(Math.max(...rows.map(row => row.commands))).length;
    for (const row of rows) {
        const size = row.count === 0 ? 0 : 1 + Math.round(9 * Math.log(row.count) / Math.log(Math.max(most, 2)));
        const line = document.createElement("div");
        line.className = "log-histogram" + (row.commands === used ? " mine" : "");
        const label = `${String(row.commands).padStart(width)} ${row.commands === 1 ? "comando " : "comandi "}`;
        const bar = document.createElement("span");
        bar.className = "histogram-bar";
        bar.setAttribute("aria-hidden", "true");
        bar.textContent = ("█".repeat(size) || "·").padEnd(11, " ");
        const spoken = document.createElement("span");
        spoken.className = "sr-only";
        spoken.textContent = `${commandCount(row.commands)}: ${row.count} ${row.count === 1 ? "pipeline" : "pipeline"}${row.commands === used ? ", la tua" : ""}.`;
        const visible = document.createElement("span");
        visible.setAttribute("aria-hidden", "true");
        visible.append(`   ${label}`, bar, `${row.count}${row.commands === used ? "  ← la tua" : ""}`);
        line.append(spoken, visible);
        document.getElementById("console").appendChild(line);
    }
    const consoleBox = document.getElementById("console");
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

// Il secondo aiuto per l'ottimizzazione: un indizio che non svela tutta la soluzione
function optimizationClue(report) {
    if (report.removable.length) {
        const item = report.removable[0];
        return `Il comando ${item.position} (${item.label}) non serve: senza, l'output è identico.`;
    }
    const mine = report.steps.map(stepLabel);
    const best = report.best.map(stepLabel);
    const unused = mine.find(label => !best.includes(label));
    if (unused) return `La soluzione più corta non usa ${unused}.`;
    const missing = best.find(label => !mine.includes(label));
    if (missing) return `La soluzione più corta usa ${missing}, che tu non hai usato.`;
    return "La soluzione più corta usa gli stessi comandi, in un ordine diverso.";
}

// Riquadro sotto la console, quando la soluzione è più lunga del par. Gli aiuti sono a gradini:
// 1) quanti comandi in meno (subito), 2) un indizio, 3) la soluzione completa: chi la guarda,
// riprovando, prende al massimo ★★. actions: { next } (assente all'ultimo livello o nella sfida)
function showSolutionCard(lvl, report, actions = {}) {
    const card = document.getElementById("result-card");
    card.innerHTML = "";
    const fewer = report.used - report.par;
    card.append(el("h3", "result-title", "📊 SI PUÒ FARE MEGLIO"));
    card.appendChild(el("p", "result-why", `Hai usato ${commandCount(report.used)}: ${report.par === 1 ? "ne basta 1" : `ne bastano ${report.par}`}. Prova a trovare la soluzione con ${fewer === 1 ? "un comando" : `${fewer} comandi`} in meno: con ${commandCount(report.par)} ottieni ★★★.`));
    const extra = el("div", "result-extra");
    extra.setAttribute("aria-live", "polite");
    card.appendChild(extra);

    const buttons = el("div", "result-buttons");
    const clue = el("button", "btn-hint", "💡 INDIZIO");
    clue.onclick = () => {
        extra.appendChild(el("p", "result-clue", `💡 ${optimizationClue(report)}`));
        clue.disabled = true;
    };
    const reveal = el("button", "btn-hint", "🔍 SOLUZIONE (max ★★)");
    reveal.onclick = () => {
        levelSession.sawSolution = true;
        clue.disabled = true;
        reveal.disabled = true;
        const rows = el("div", "result-rows");
        rows.append(el("span", "result-label", "La tua"), el("code", "result-mine", report.mine), el("span", "result-count", commandCount(report.used)));
        rows.append(el("span", "result-label", "Ottimale"), el("code", "result-best", pipelineText(report.best)), el("span", "result-count", commandCount(report.par)));
        extra.replaceChildren(rows, ...explainReport(report).slice(1).map(line => el("p", "result-why", line)));
        const labButton = el("button", "btn-hint", "🧪 LABORATORIO");
        labButton.onclick = () => openLab({ input: lvl.stdin, steps: report.best }, LAB_BACK_TO_LEVEL, { target: lvl.target, targetStderr: lvl.targetStderr });
        buttons.insertBefore(labButton, retry);
    };
    const retry = el("button", "btn-hint", "↺ RIPROVA");
    retry.onclick = () => {
        hideSolutionCard();
        logToConsole(`> Modifica le celle e riprova: con ${commandCount(report.par)} ottieni ${starString(hintStarCap())}.`, "log-hint");
    };
    buttons.append(clue, reveal, retry);
    if (actions.next) {
        const next = el("button", "btn-run", "PROSSIMO ▶");
        next.onclick = () => { hideSolutionCard(); actions.next(); };
        buttons.appendChild(next);
    }
    card.appendChild(buttons);
    card.hidden = false;
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function explainReport(report) {
    const extra = report.used - report.par;
    const lines = [`Hai usato ${commandCount(report.used)}: ${report.par === 1 ? "ne basta 1" : `ne bastano ${report.par}`}.`];
    if (report.removable.length) {
        // Due comandi uguali: basta segnalarne uno
        const distinct = report.removable.filter((item, i, all) => all.findIndex(other => other.label === item.label) === i);
        for (const item of distinct.slice(0, 2)) {
            lines.push(`Il comando ${item.position} (${item.label}) non serve: senza, l'output è identico.`);
        }
        if (extra > 1 && report.removable.length === 1) lines.push("Poi cerca un altro passaggio da risparmiare.");
    } else {
        lines.push("Nessun comando si può semplicemente togliere: la soluzione ottimale arriva al risultato per un'altra strada. Aprila nel laboratorio per vederla passo per passo.");
    }
    return lines;
}

function hideSolutionCard() {
    document.getElementById("result-card").hidden = true;
}

// Dopo una vittoria: l'istogramma delle soluzioni in console e, se la soluzione è più lunga del
// par, il riquadro con gli aiuti per l'ottimizzazione.
// Restituisce { stop } se il gioco deve fermarsi (niente passaggio automatico al livello successivo)
// e { pause } se in console c'è qualcosa da leggere prima di andare avanti.
function reviewSolution(lvl, steps, actions = {}) {
    if (!canCompare(lvl) || !currentSolution || !currentSolution.optimalSteps) return {};
    const report = solutionReport(lvl, steps, currentSolution);
    logHistogram(histogramFor(lvl, report.used, report.par), report.used);
    if (report.optimal) {
        if (report.alternatives.length) logToConsole(`> Altre soluzioni ottimali: ${report.alternatives.join("  ·  ")}`, "log-hint");
        return { pause: true };
    }
    logToConsole(`> Si può fare con ${commandCount(report.par)}: guarda gli aiuti qui sotto.`, "log-hint");
    showSolutionCard(lvl, report, actions);
    return { stop: true };
}
