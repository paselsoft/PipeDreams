// Rendering condiviso tra gioco ed editor

// Disegna una lista di righe come chip; `states` opzionale assegna classi extra (ok/bad/missing)
function renderChips(container, lines, states = []) {
    container.innerHTML = "";
    if (lines.length === 0) {
        const chip = document.createElement("span");
        chip.className = "chip empty";
        chip.textContent = "(vuoto)";
        container.appendChild(chip);
        return;
    }
    lines.forEach((line, i) => {
        const chip = document.createElement("span");
        chip.className = ["chip", line.fd === 2 ? "err" : "", states[i] || ""].join(" ").trim();
        // Le righe vuote (es. prodotte da tr o cut) restano visibili come segnaposto
        if (line.text === "") chip.classList.add("blank");
        chip.textContent = line.text === "" ? "(riga vuota)" : line.text;
        container.appendChild(chip);
    });
}
