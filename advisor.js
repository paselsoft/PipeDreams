// Il consigliere: dopo qualche tentativo sbagliato, il personaggio del livello compare con un
// consiglio mirato. Guarda cosa non va nella tua uscita rispetto a quella attesa (doppioni,
// ordine, numeri ordinati come testo, righe in più o in meno, campi, maiuscole, stderr) e lo
// dice senza svelare la soluzione. Il consiglio è gratis; la «spinta» è il primo aiuto.

const ADVISOR_AFTER_FAILURES = 3;

const sameLines = (a, b) => a.length === b.length && a.every((line, i) => line === b[i]);
const sortedCopy = list => [...list].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
const isNumberish = line => /^\s*-?\d/.test(line);

// Il consiglio per un'esecuzione sbagliata (null se l'esecuzione era giusta)
function diagnoseFailure(lvl, result) {
    const out = result.output;
    const target = lvl.target;
    const expectedErr = lvl.targetStderr || [];
    if (sameLines(out, target) && sameLines(result.stderr, expectedErr)) return null;

    if (sameLines(out, target)) {
        return expectedErr.length && !result.stderr.length
            ? "Lo stdout è perfetto, ma sul terminale doveva comparire anche qualcosa: c'è un comando che ricopia il flusso sullo stderr?"
            : "Lo stdout è perfetto! Ma degli errori sono finiti sul terminale: chi decide dove va lo stderr? Guarda i reindirizzamenti.";
    }
    if (out.length === 0) {
        return "Non esce niente: forse un filtro scarta tutto, o cerca un testo che non c'è. Prova a togliere un comando alla volta.";
    }
    if (sameLines(sortedCopy(out), sortedCopy(target))) {
        // Stesse righe, ordine diverso
        const numeric = target.every(isNumberish) && target.length > 1;
        if (numeric && sameLines(out, sortedCopy(out))) {
            return "Hai le righe giuste, ma stai ordinando i numeri come testo: per sort, 100 viene prima di 9.";
        }
        if (sameLines(out, [...target].reverse())) return "Hai le righe giuste, ma in ordine rovesciato.";
        return "Hai esattamente le righe giuste, ma in un ordine diverso: guarda come vanno ordinate.";
    }
    const outSet = new Set(out);
    const targetSet = new Set(target);
    const sameSet = outSet.size === targetSet.size && [...outSet].every(line => targetSet.has(line));
    if (sameSet && out.length > target.length) {
        return "Ci sono ancora dei doppioni: uniq toglie solo le righe uguali che si toccano.";
    }
    if (sameLines(out.map(line => line.toLowerCase()), target.map(line => line.toLowerCase()))) {
        return "Quasi! Cambiano solo maiuscole e minuscole.";
    }
    if (target.length === 1 && out.length === 1 && /^\d+$/.test(target[0].trim()) && /^\d+$/.test(out[0].trim())) {
        return "Il conteggio non torna: stai contando proprio le righe che servono? Filtra prima di contare.";
    }
    if (out.length === 1 && target.length > 1) {
        return "Esce una riga sola, ma ne servono di più: forse stai contando, o unendo le righe, troppo presto.";
    }
    if (target.every(line => outSet.has(line))) {
        return `Tutte le righe giuste ci sono, più ${out.length - target.length === 1 ? "una" : "qualcuna"} di troppo: serve un filtro o un taglio.`;
    }
    if (out.every(line => targetSet.has(line))) {
        return "Le righe che escono sono giuste, ma ne mancano: forse un filtro scarta troppo, o tagli troppo presto.";
    }
    if (out.length === target.length && target.every((line, i) => line !== "" && out[i].includes(line))) {
        return "Le righe giuste ci sono, ma con dei pezzi in più: forse ti serve un campo solo.";
    }
    if (out.length === target.length && out.every((line, i) => line !== "" && target[i].includes(line))) {
        return "Stai tagliando troppo: alle righe manca qualcosa. Controlla il campo o il separatore.";
    }
    if (result.stderr.length && !expectedErr.length) {
        return "Degli errori finiscono sul terminale: vanno cestinati o portati nella pipe?";
    }
    return "Esegui un comando alla volta e guarda il flusso dopo ogni cella: dove si allontana da quello che ti serve? Con 🧪 LABORATORIO vedi ogni passaggio.";
}

// Chi consiglia: il personaggio che ha dato la missione, altrimenti Marco
function advisorName(lvl) {
    const message = lvl.story || STORY[lvl.id];
    return message && characterByName(message.from) ? message.from : "Marco";
}

// Chiamata a ogni esecuzione sbagliata: alla terza compare il fumetto (una volta per livello);
// se è già aperto, il consiglio si aggiorna sull'ultimo tentativo
function adviseAfterFailure(lvl, result) {
    levelSession.failures = (levelSession.failures || 0) + 1;
    if (settings.advisor === false || lvl.marathon || lvl.type === "quiz") return;
    const box = document.getElementById("advisor");
    const open = !box.hidden;
    if (!open && (levelSession.advisorShown || levelSession.failures < ADVISOR_AFTER_FAILURES)) return;
    const advice = diagnoseFailure(lvl, result);
    if (!advice) return;
    levelSession.advisorShown = true;
    const name = advisorName(lvl);
    setAvatar(document.getElementById("advisor-avatar"), name, "preoccupato", "medium");
    document.getElementById("advisor-from").textContent = `${name}:`;
    document.getElementById("advisor-text").textContent = advice;
    // La spinta è gratis: la si offre solo se non è ancora stata chiesta
    document.getElementById("advisor-nudge").hidden = levelSession.hintTier > 0;
    box.hidden = false;
}

function closeAdvisor() {
    document.getElementById("advisor").hidden = true;
}

function advisorNudge() {
    closeAdvisor();
    if (levelSession.hintTier === 0) showHint();
}
