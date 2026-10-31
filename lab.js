// Laboratorio: una pipeline libera dentro il pannello del manuale. Input e comandi si modificano
// e il risultato dopo ogni comando si aggiorna mentre si scrive.

// Stato del laboratorio: testo dell'input (righe "2> " = stderr) e comandi { cmd, args }
let lab = null;

const LAB_SAMPLE = { input: ["pera", "mela", "pera"], steps: [{ cmd: "sort" }] };

// Apre il laboratorio con un esempio (input + steps); backTarget è la scheda a cui tornare
function openLab(example = LAB_SAMPLE, backTarget = null) {
    lab = {
        inputText: stdinToText(example.input),
        commands: example.steps.map(step => ({ cmd: step.cmd, args: argsFromStep(step) }))
    };
    renderLab(backTarget);
    document.getElementById("manual-overlay").hidden = false;
}

function renderLab(backTarget) {
    const root = el("div", "form-ui lab");
    root.appendChild(el("p", "manual-description", "Cambia l'input e i comandi: il risultato si aggiorna mentre scrivi."));

    const inputLabel = el("label", "lab-label", "Input: una riga per riga, inizia con \"2> \" per lo stderr");
    const input = el("textarea", "lab-input");
    input.rows = Math.max(3, lab.inputText.split("\n").length + 1);
    input.spellcheck = false;
    input.value = lab.inputText;
    input.oninput = () => {
        lab.inputText = input.value;
        refreshLab();
    };
    inputLabel.htmlFor = input.id = "lab-input";
    root.append(inputLabel, input);

    root.appendChild(el("h3", "manual-section", "Comandi"));
    root.appendChild(el("div", "", "")).id = "lab-commands";

    const add = el("button", "ed-btn", "+ Aggiungi comando");
    add.onclick = () => {
        lab.commands.push({ cmd: "sort", args: defaultArgs("sort") });
        renderLabCommands();
        refreshLab();
    };
    root.appendChild(add);

    root.appendChild(el("h3", "manual-section", "Risultato"));
    root.appendChild(el("div", "lab-result")).id = "lab-result";

    setManualContent("🧪 LABORATORIO", [root], true, backTarget);
    renderLabCommands();
    refreshLab();
}

function renderLabCommands() {
    const container = document.getElementById("lab-commands");
    container.innerHTML = "";
    lab.commands.forEach((command, index) => {
        const row = el("div", "ed-cmd");
        const label = el("span", "ed-label");
        const error = el("span", "ed-error");
        // Aggiorna etichetta ed errore senza ricostruire la riga (mantiene il focus)
        const updateRow = () => {
            const message = argsError(command);
            error.textContent = message || "";
            row.classList.toggle("invalid", Boolean(message));
            label.textContent = message ? "…" : `${index + 1}. ${stepLabel({ cmd: command.cmd, args: cleanArgs(command) })}`;
        };

        const select = commandSelect(command, () => {
            renderLabCommands();
            refreshLab();
        });
        row.append(label, select);
        paramFields(command, () => {
            updateRow();
            refreshLab();
        }).forEach(field => row.appendChild(field));

        // Spostare un comando in su è il modo più rapido per vedere quanto conta l'ordine
        if (index > 0) {
            const up = el("button", "ed-remove lab-move", "↑");
            up.title = "Sposta in su";
            up.onclick = () => {
                [lab.commands[index - 1], lab.commands[index]] = [lab.commands[index], lab.commands[index - 1]];
                renderLabCommands();
                refreshLab();
            };
            row.appendChild(up);
        }
        const remove = el("button", "ed-remove", "✕");
        remove.title = "Rimuovi comando";
        remove.onclick = () => {
            lab.commands.splice(index, 1);
            renderLabCommands();
            refreshLab();
        };
        row.append(remove, error);
        updateRow();
        container.appendChild(row);
    });
}

// Esegue la pipeline fino al primo comando non valido e mostra lo stato dopo ogni comando
function refreshLab() {
    const container = document.getElementById("lab-result");
    if (!container) return;
    container.innerHTML = "";

    const input = parseStdin(lab.inputText);
    const invalidIndex = lab.commands.findIndex(command => argsError(command));
    const valid = invalidIndex === -1 ? lab.commands : lab.commands.slice(0, invalidIndex);
    const steps = valid.map(command => ({ cmd: command.cmd, args: cleanArgs(command) }));
    const result = executePipeline(input, steps);

    container.appendChild(el("code", "manual-shell", buildShellLine(input, steps, " |\n  ")));

    const stage = (title, lines, terminal) => {
        const box = el("div", "lab-stage");
        box.appendChild(el("div", "manual-row-label", title));
        const chips = el("span", "chips");
        renderChips(chips, lines);
        box.appendChild(chips);
        if (terminal.length) {
            box.appendChild(el("div", "stream-terminal", `⚠ Finito sul terminale (stderr): ${terminal.join(", ")}`));
        }
        container.appendChild(box);
    };
    stage("input", normalizeInput(input), []);
    steps.forEach((step, i) => stage(`dopo ${i + 1}. ${stepLabel(step)}`, result.trace[i].lines, result.trace[i].terminal));

    if (invalidIndex !== -1) {
        container.appendChild(el("p", "lab-warning", `Il comando ${invalidIndex + 1} ha un errore: correggilo per proseguire.`));
    } else {
        const final = el("div", "lab-stage lab-final");
        final.appendChild(el("div", "manual-row-label", "output finale"));
        const chips = el("span", "chips");
        renderChips(chips, result.output.map(text => ({ text, fd: 1 })));
        final.appendChild(chips);
        if (result.stderr.length) {
            final.appendChild(el("div", "stream-terminal", `⚠ Sul terminale (stderr): ${result.stderr.join(", ")}`));
        }
        container.appendChild(final);
    }
}
