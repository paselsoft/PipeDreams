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
    // Comandi che si possono togliere uno alla volta lasciando l'output giusto
    const solves = list => isSolved(lvl, executePipeline(lvl.stdin, list));
    report.removable = mine.map((step, i) => ({ step, i }))
        .filter(({ i }) => solves(mine.filter((_, j) => j !== i)))
        .map(({ step, i }) => ({ label: stepLabel(step), position: i + 1 }));
    return report;
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

// Riquadro del confronto, sotto la console. actions: { next } (assente all'ultimo livello o nella sfida)
function showSolutionCard(lvl, report, actions = {}) {
    const card = document.getElementById("result-card");
    card.innerHTML = "";
    card.append(el("h3", "result-title", "📊 CONFRONTO CON LA SOLUZIONE OTTIMALE"));
    const rows = el("div", "result-rows");
    rows.append(el("span", "result-label", "La tua"), el("code", "result-mine", report.mine), el("span", "result-count", commandCount(report.used)));
    rows.append(el("span", "result-label", "Ottimale"), el("code", "result-best", pipelineText(report.best)), el("span", "result-count", commandCount(report.par)));
    card.appendChild(rows);
    for (const line of explainReport(report)) card.appendChild(el("p", "result-why", line));

    const buttons = el("div", "result-buttons");
    const retry = el("button", "btn-hint", "↺ RIPROVA");
    retry.onclick = () => {
        hideSolutionCard();
        logToConsole(`> Modifica le celle e riprova: con ${commandCount(report.par)} ottieni ★★★.`, "log-hint");
    };
    const labButton = el("button", "btn-hint", "🧪 LABORATORIO");
    labButton.onclick = () => openLab({ input: lvl.stdin, steps: report.best }, LAB_BACK_TO_LEVEL, { target: lvl.target, targetStderr: lvl.targetStderr });
    buttons.append(retry, labButton);
    if (actions.next) {
        const next = el("button", "btn-run", "PROSSIMO ▶");
        next.onclick = () => { hideSolutionCard(); actions.next(); };
        buttons.appendChild(next);
    }
    card.appendChild(buttons);
    card.hidden = false;
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function hideSolutionCard() {
    document.getElementById("result-card").hidden = true;
}

// Dopo una vittoria: righe in console e, se la soluzione non è ottimale, il riquadro.
// Restituisce { stop } se il gioco deve fermarsi (niente passaggio automatico al livello successivo)
// e { pause } se in console ci sono soluzioni alternative da leggere prima di andare avanti.
function reviewSolution(lvl, steps, actions = {}) {
    if (!canCompare(lvl) || !currentSolution || !currentSolution.optimalSteps) return {};
    const report = solutionReport(lvl, steps, currentSolution);
    if (report.optimal) {
        if (!report.alternatives.length) return {};
        logToConsole(`> Altre soluzioni ottimali: ${report.alternatives.join("  ·  ")}`, "log-hint");
        return { pause: true };
    }
    logToConsole(`> Ottimale: ${pipelineText(report.best)} (${commandCount(report.par)}). Guarda il confronto qui sotto.`, "log-hint");
    showSolutionCard(lvl, report, actions);
    return { stop: true };
}
