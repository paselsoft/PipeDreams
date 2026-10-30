const SLOT_COUNT = 4;

// Una riga di stdin è una stringa (stdout) oppure { err: "testo" } (stderr).
// allowedCommands elenca solo i comandi reali: lo slot vuoto viene aggiunto dal motore in prima posizione.
// Dopo ogni modifica verifica i livelli con: node tools/validate-levels.js
const levels = [
    {
        id: 1,
        title: "Il Filtro Base",
        mission: "Usa <code>grep</code> per isolare solo i pacchetti validi eliminando i file corrotti (<code>ERR</code>).",
        stdin: ["file1", "ERR:corrotto", "file2", "ERR:corrotto"],
        target: ["file1", "file2"],
        hint: "'grep' tiene le righe che contengono il testo; con '-v' fa l'opposto e le scarta.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "grep", args: { pattern: "ERR", invert: true }, desc: "Scarta le righe con 'ERR'" }
        ]
    },
    {
        id: 2,
        title: "Ordinamento e Duplicati",
        mission: "Pulisci il flusso rimuovendo i doppioni con <code>uniq</code> e ordinando con <code>sort</code>.",
        stdin: ["zebra", "mela", "cane", "mela"],
        target: ["cane", "mela", "zebra"],
        hint: "'uniq' elimina solo i duplicati ADIACENTI: le due 'mela' devono prima finire vicine.",
        allowedCommands: [
            { cmd: "sort", desc: "Riordina alfabeticamente" },
            { cmd: "uniq", desc: "Elimina duplicati adiacenti" }
        ]
    },
    {
        id: 3,
        title: "Gestione Stderr",
        mission: "Il programma scrive un <code>CRASH</code> su stderr, che non passa per la pipe ma sporca il terminale. Cestinalo con <code>2>/dev/null</code>, poi ottieni l'elenco ordinato, in maiuscolo e senza doppioni.",
        stdin: ["alfa", "beta", { err: "CRASH" }, "Beta", "alfa"],
        target: ["ALFA", "BETA"],
        hint: "Un reindirizzamento vale per il comando a cui è attaccato: lo stderr nasce dal programma iniziale, quindi '2>/dev/null' va subito. E 'sort' mette le maiuscole prima delle minuscole.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "upper", desc: "Maiuscolo" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 4,
        title: "Taglio Rapido",
        mission: "Ottieni i primi 2 elementi distinti in ordine alfabetico usando <code>head</code> o <code>tail</code>.",
        stdin: ["delta", "gamma", "beta", "gamma", "beta"],
        target: ["beta", "delta"],
        hint: "Se tagli troppo presto perdi elementi, e se non togli i doppioni prima di tagliare ne prendi due uguali.",
        allowedCommands: [
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" },
            { cmd: "tail", args: { n: 2 }, desc: "Prendi gli ultimi 2" }
        ]
    },
    {
        id: 5,
        title: "Depurazione Avanzata",
        mission: "Elimina i log di sistema (<code>WARN</code>), metti in maiuscolo, ordina e pulisci.",
        stdin: ["server2", "server1", "warn:disk", "Server2", "Server2"],
        target: ["SERVER1", "SERVER2"],
        hint: "'grep' distingue maiuscole e minuscole: 'WARN' non trova 'warn'... finché qualcuno non lo rende maiuscolo.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "WARN", invert: true }, desc: "Scarta i 'WARN'" },
            { cmd: "upper", desc: "Maiuscolo" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 6,
        title: "Unire i Flussi",
        mission: "Ti servono proprio gli errori: con <code>2>&1</code> lo stderr si unisce allo stdout ed entra nella pipe. Estrai l'elenco degli errori senza ripetizioni consecutive.",
        stdin: ["job1: ok", { err: "ERR: disco pieno" }, "job2: ok", { err: "ERR: disco pieno" }, { err: "ERR: timeout" }, "job3: ok"],
        target: ["ERR: disco pieno", "ERR: timeout"],
        hint: "Senza '2>&1' gli errori scavalcano la pipe e 'grep' non li vede. E 'uniq' unisce solo righe adiacenti: cosa c'è in mezzo ai due 'disco pieno'?",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "grep", args: { pattern: "ERR", invert: true }, desc: "Scarta le righe con 'ERR'" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 7,
        title: "Boss Final",
        mission: "Alcuni nodi sono andati in crash e lo segnalano su stderr. Mostra i 2 errori dei nodi con il nome più alto, in ordine decrescente e in maiuscolo. Gli slot sono solo 4: non tutti i comandi servono.",
        stdin: ["avvio ok", { err: "fatal: nodeb" }, "backup ok", { err: "FATAL: nodeC" }, "avvio ok", { err: "fatal: nodea" }],
        target: ["FATAL: NODEC", "FATAL: NODEB"],
        hint: "Gli errori ti servono, quindi non cestinarli. Dopo il maiuscolo, in ordine decrescente 'FATAL' viene prima di 'BACKUP' e 'AVVIO'.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "upper", desc: "Maiuscolo" },
            { cmd: "sort", desc: "Ordine crescente" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" },
            { cmd: "tail", args: { n: 2 }, desc: "Prendi gli ultimi 2" }
        ]
    }
];
