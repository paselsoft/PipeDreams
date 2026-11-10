// Tutor: spiega passo passo una pipeline che risolve un livello. Per ogni comando dice cosa fa
// (con ogni opzione), mostra le righe prima e dopo, cosa va sul terminale, e cosa succederebbe
// togliendo quel comando (calcolato con il motore). Solo logica, senza interfaccia: la usa
// tutor-view.js e la verifica tools/check-tutor.js su tutti i livelli.

// Un carattere o un testo come lo si legge in una frase: lo spazio e l'a capo hanno un nome
function tutorChar(text) {
    if (text === " ") return "lo spazio";
    if (text === "\t") return "la tabulazione";
    if (text === "\n") return "l'a capo";
    return `«${String(text).replace(/\n/g, "\\n").replace(/\t/g, "\\t")}»`;
}

// Descrizione di uno step: what = cosa fa in una frase, options = una spiegazione per opzione
function describeStep(step) {
    const a = step.args || {};
    const options = [];
    const add = (flag, text) => options.push({ flag, text });
    let what;
    switch (step.cmd) {
        case "grep":
            if (a.only) {
                what = `stampa solo il testo ${tutorChar(a.pattern)}, una riga per ogni volta che compare (anche più volte nella stessa riga).`;
                add("-o", "al posto della riga intera stampa solo il pezzo trovato");
            } else if (a.invert) {
                what = `scarta le righe che contengono ${tutorChar(a.pattern)} e lascia passare tutte le altre.`;
                add("-v", "inverte la scelta: tiene le righe che NON contengono il testo");
            } else {
                what = `tiene solo le righe che contengono ${tutorChar(a.pattern)}, in qualunque punto della riga.`;
            }
            if (a.count) {
                what = `conta le righe che ${a.invert ? "NON contengono" : "contengono"} ${tutorChar(a.pattern)}: al posto delle righe esce un numero solo.`;
                add("-c", "stampa quante righe ha trovato, invece delle righe (come grep | wc -l)");
            }
            if (a.ignoreCase) add("-i", "maiuscole e minuscole contano allo stesso modo: trova anche le varianti in maiuscolo");
            if (a.word) add("-w", "solo parole intere: il testo non vale se è attaccato a lettere, cifre o _");
            break;
        case "sort": {
            const how = a.human ? "per dimensione, capendo le unità K, M, G"
                : a.numeric ? "per valore numerico" : "carattere per carattere (cifre, poi maiuscole, poi minuscole)";
            const where = a.key ? ` guardando solo il campo ${a.key} (campi separati da ${tutorChar(a.separator)})` : "";
            const order = a.numeric || a.human ? (a.reverse ? "dal più grande al più piccolo" : "dal più piccolo al più grande")
                : (a.reverse ? "in ordine inverso" : "in ordine crescente");
            what = `riordina le righe ${how}${where}, ${order}. Le righe restano intere.`;
            if (a.numeric) add("-n", "confronta i numeri per valore: 9 viene prima di 10 (come testo sarebbe il contrario)");
            if (a.human) add("-h", "legge le dimensioni con le unità: 900M viene prima di 1.5G");
            if (a.reverse) add("-r", "ordine inverso: dal più grande o dall'ultimo");
            if (a.key) add(`-t'${a.separator}' -k${a.key},${a.key}`, `divide la riga su ${tutorChar(a.separator)} e ordina solo in base al campo ${a.key}`);
            if (a.unique) {
                what += a.key ? ` Con -u, di ogni gruppo con lo stesso campo ${a.key} resta solo la prima riga.` : " Con -u le righe uguali restano una volta sola.";
                add("-u", a.key ? "senza doppioni della chiave: tiene la prima riga di ogni chiave" : "senza doppioni, come sort | uniq");
            }
            break;
        }
        case "uniq":
            what = a.unique ? "tiene solo le righe che NON hanno doppioni vicini: quelle ripetute spariscono del tutto."
                : a.repeated ? "tiene solo le righe che si ripetono, una volta ciascuna."
                : a.count ? "raggruppa le righe uguali vicine in una sola e scrive davanti quante erano."
                : "toglie le righe uguali a quella subito sopra: restano una volta sola.";
            what += " Confronta solo righe vicine: per questo di solito viene dopo sort.";
            if (a.count) add("-c", "scrive davanti a ogni riga quante volte compariva, allineato a destra con degli spazi");
            if (a.repeated) add("-d", "tiene solo le righe ripetute");
            if (a.unique) add("-u", "tiene solo le righe uniche (l'opposto di -d)");
            break;
        case "tac":
            what = "rovescia l'ordine delle righe: l'ultima diventa la prima.";
            break;
        case "rev":
            what = "rovescia i caratteri di ogni riga: «abc» diventa «cba». L'ordine delle righe non cambia.";
            break;
        case "upper":
            what = "trasforma ogni riga in maiuscolo (con sed: s/.*/\\U&/ prende tutta la riga e la riscrive in maiuscolo).";
            break;
        case "head":
            what = `tiene solo le prime ${a.n} righe e scarta le altre.`;
            add(`-n ${a.n}`, "quante righe tenere dall'inizio");
            break;
        case "tail":
            what = `tiene solo le ultime ${a.n} righe e scarta le altre.`;
            add(`-n ${a.n}`, "quante righe tenere dalla fine");
            break;
        case "wc":
            what = "conta le righe: tutto il flusso diventa un solo numero.";
            add("-l", "conta le righe (non le parole né i caratteri)");
            break;
        case "wcw":
            what = "conta le parole: i pezzi separati da spazi, tabulazioni e a capo. Tutto il flusso diventa un solo numero.";
            add("-w", "conta le parole (gli spazi in più non contano)");
            break;
        case "wcc":
            what = "conta i byte: tutto il flusso diventa un solo numero. Ogni a capo in fondo alla riga vale 1 byte, una lettera accentata 2.";
            add("-c", "conta i byte, a capo compresi");
            break;
        case "cut": {
            const list = a.fields || a.field;
            const which = a.fields ? `i campi ${a.fields}` : `il campo ${a.field}`;
            what = a.complement
                ? `divide ogni riga su ${tutorChar(a.delim)} e tiene tutti i campi tranne ${which}, uniti di nuovo da ${tutorChar(a.delim)}.`
                : a.fields ? `divide ogni riga su ${tutorChar(a.delim)} e tiene ${which}, nell'ordine della riga e uniti da ${tutorChar(a.delim)}.`
                : `divide ogni riga su ${tutorChar(a.delim)} e tiene solo il campo ${a.field}.`;
            what += " Ogni separatore conta: due in fila fanno un campo vuoto.";
            add(`-d'${a.delim}'`, `il carattere che separa i campi: ${tutorChar(a.delim)}`);
            add(`-f${list}`, a.fields ? "l'elenco dei campi: con la virgola più campi, con il trattino un intervallo (2- = dal 2 in poi)" : `il campo da tenere: il ${a.field}°`);
            if (a.complement) add("--complement", "capovolge la scelta: tiene i campi NON indicati");
            break;
        }
        case "cutc":
            what = a.from === a.to ? `tiene solo il carattere in posizione ${a.from} di ogni riga.`
                : `tiene solo i caratteri dalla posizione ${a.from} alla ${a.to} di ogni riga.`;
            add(`-c${a.from}${a.to !== a.from ? `-${a.to}` : ""}`, "le posizioni dei caratteri da tenere, contando da 1");
            break;
        case "tr":
            if (a.delete) {
                what = `cancella da ogni riga i caratteri ${tutorChar(a.delete)}${a.delete.includes("-") ? " (il trattino indica un intervallo, es. 0-9)" : ""}.`;
                add("-d", "cancella invece di sostituire");
            } else {
                what = `sostituisce ogni carattere di ${tutorChar(a.from)} con quello nella stessa posizione di ${tutorChar(a.to)}.`;
                if (a.to.includes("\n")) what += " Un carattere che diventa a capo spezza la riga in più righe.";
            }
            break;
        case "squeeze":
            what = `comprime i gruppi dello stesso carattere tra ${tutorChar(a.set)} in uno solo: tre spazi in fila diventano uno.`;
            add("-s", "squeeze: comprime le ripetizioni");
            break;
        case "sed":
            if (a.replacement) {
                what = `cerca in ogni riga il testo che corrisponde all'espressione /${a.pattern}/ e lo sostituisce con ${tutorChar(a.replacement)}.`;
                if (/\\[1-9]/.test(a.replacement)) what += " \\1, \\2… sono i pezzi catturati tra parentesi nell'espressione.";
                if (a.replacement.includes("&")) what += " & è tutto il testo trovato.";
            } else {
                what = `cancella da ogni riga il testo che corrisponde all'espressione /${a.pattern}/.`;
            }
            add("-E", "espressioni regolari estese: ( ), +, ? senza barre rovesciate");
            if (a.global) add("g", "sostituisce tutte le volte nella riga, non solo la prima");
            break;
        case "awk":
            what = a.separator ? `divide ogni riga su ${tutorChar(a.separator)} e stampa il campo ${a.field}.`
                : `stampa il campo ${a.field} di ogni riga. Senza -F i campi sono separati da gruppi di spazi, e gli spazi all'inizio non contano.`;
            if (a.separator) add(`-F'${a.separator}'`, `il separatore dei campi: ${tutorChar(a.separator)}`);
            add(`{print $${a.field}}`, `stampa il ${a.field}° campo`);
            break;
        case "comm": {
            const keep = { 12: "solo le righe presenti in entrambi", 23: "solo le righe che stanno nello stdin e non nel file", 13: "solo le righe che stanno nel file e non nello stdin" }[a.mode];
            what = `confronta lo stdin con ${a.file} (tutti e due ordinati) e tiene ${keep}.`;
            add(`-${a.mode}`, "nasconde le colonne indicate: 1 = solo nello stdin, 2 = solo nel file, 3 = in comune");
            break;
        }
        case "join":
            what = `unisce le righe dello stdin con quelle di ${a.file} che hanno lo stesso primo campo${a.separator ? ` (campi separati da ${tutorChar(a.separator)})` : ""}. Tutti e due devono essere ordinati.`;
            if (a.separator) add(`-t'${a.separator}'`, "il carattere che separa i campi");
            break;
        case "nl":
            what = `numera le righe${a.all ? ", anche quelle vuote" : " (senza -ba quelle vuote restano senza numero)"}.`;
            if (a.all) add("-ba", "numera tutte le righe");
            if (a.width) add(`-w${a.width}`, `numeri larghi ${a.width} caratteri (senza: 6, allineati a destra)`);
            if (a.separator) add(`-s'${a.separator}'`, `fra numero e riga mette ${tutorChar(a.separator)} (senza: una tabulazione)`);
            break;
        case "tee":
            what = a.file === "/dev/stderr"
                ? "lascia passare il flusso e intanto ne manda una copia sul terminale (stderr): la vedi, ma non entra nella pipe."
                : `lascia passare il flusso e intanto ne salva una copia nel file ${a.file}.`;
            break;
        case "fold":
            what = `va a capo nelle righe più lunghe di ${a.width} caratteri${a.spaces ? ", solo dopo uno spazio: le parole restano intere" : ", anche a metà parola"}.`;
            add(`-w ${a.width}`, "la larghezza massima della riga");
            if (a.spaces) add("-s", "va a capo dopo l'ultimo spazio (che resta in fondo alla riga)");
            break;
        case "xargs":
            what = a.n ? `rimette le parole in fila, ${a.n} per riga: le righe vuote e gli spazi in più spariscono.`
                : "rimette tutte le parole in una sola riga, separate da uno spazio.";
            if (a.n) add(`-n ${a.n}`, `al massimo ${a.n} parole per volta, quindi per riga`);
            break;
        case "paste":
            what = `unisce tutte le righe in una sola, separate da ${tutorChar(a.delim)}.`;
            add("-s", "unisce le righe del flusso una dopo l'altra");
            add(`-d'${a.delim}'`, `il carattere da mettere fra le righe: ${tutorChar(a.delim)}`);
            break;
        case "devnull":
            what = "manda lo stderr del comando a cui è attaccato in /dev/null: le righe di errore spariscono e non arrivano al terminale.";
            break;
        case "merge":
            what = "unisce lo stderr allo stdout: gli errori entrano nella pipe come righe normali, e i comandi dopo li vedono.";
            break;
        default:
            what = "applica il comando a ogni riga.";
    }
    return { label: stepLabel(step), what, options };
}

const tutorSameLines = (a, b) => a.length === b.length && a.every((line, i) => line === b[i]);
const tutorSorted = list => [...list].sort();

// Cosa succederebbe senza un comando, in una frase (r = risultato della pipeline senza)
function withoutSentence(lvl, r) {
    const out = r.output;
    const target = lvl.target;
    const expectedErr = lvl.targetStderr || [];
    if (isSolved(lvl, r)) return "Senza questo comando il livello sarebbe risolto lo stesso: qui non serve.";
    if (tutorSameLines(out, target)) return "Senza, lo stdout sarebbe giusto, ma lo stderr non andrebbe dove serve.";
    if (r.stderr.length > expectedErr.length) return "Senza, degli errori finirebbero sul terminale.";
    if (!out.length) return "Senza, non uscirebbe niente.";
    if (out.every(line => line === "")) return "Senza, uscirebbero solo righe vuote: i comandi dopo non troverebbero quello che cercano.";
    if (tutorSameLines(tutorSorted(out), tutorSorted(target))) return "Senza, le righe sarebbero quelle giuste ma in un altro ordine.";
    if (new Set(out).size < out.length && new Set(target).size === target.length) return "Senza, resterebbero dei doppioni.";
    if (out.length > target.length) return `Senza, uscirebbero ${out.length} righe invece di ${target.length}.`;
    if (out.length < target.length) return `Senza, uscirebbero solo ${out.length} ${out.length === 1 ? "riga" : "righe"} invece di ${target.length}.`;
    return "Senza, le righe sarebbero diverse da quelle che servono.";
}

// Lezione completa: un passo per comando, più obiettivo e risultato.
// steps: la pipeline da spiegare (quella del giocatore, o la soluzione di riferimento)
function tutorLesson(lvl, steps) {
    const result = executePipeline(lvl.stdin, steps);
    let before = visibleLines(initialState(lvl.stdin));
    let terminalBefore = [];
    const passes = [];
    steps.forEach((step, i) => {
        if (step.cmd === null) return;
        const { lines, terminal } = result.trace[i];
        const without = executePipeline(lvl.stdin, steps.filter((_, j) => j !== i));
        passes.push({
            ...describeStep(step),
            cmd: step.cmd,
            redirect: Boolean(COMMANDS[step.cmd].redirect),
            before,
            after: lines,
            toTerminal: terminal.slice(terminalBefore.length),
            without: { output: without.output, stderr: without.stderr, solved: isSolved(lvl, without), sentence: withoutSentence(lvl, without) }
        });
        before = lines;
        terminalBefore = terminal;
    });
    return {
        title: lvl.title,
        insight: lvl.tutor || lvl.explain || lvl.hint || "",
        pipeline: pipelineText(steps),
        input: visibleLines(initialState(lvl.stdin)),
        output: result.output,
        stderr: result.stderr,
        solved: isSolved(lvl, result),
        passes
    };
}

// Pipeline da spiegare per un livello risolto, quando non c'è quella del giocatore
function tutorStepsFor(lvl) {
    return referenceSolution(lvl).filter(step => step && step.cmd !== null);
}
