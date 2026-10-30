const SLOT_COUNT = 4;

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
        mission: "Cestina i <code>CRASH</code> con <code>2>/dev/null</code> e ottieni l'elenco ordinato, in maiuscolo e senza doppioni.",
        stdin: ["alfa", "beta", "CRASH", "Beta", "alfa"],
        target: ["ALFA", "BETA"],
        hint: "'sort' mette le maiuscole prima delle minuscole: 'Beta' e 'beta' finiscono lontane. Uniforma il maiuscolo prima di ordinare.",
        allowedCommands: [
            { cmd: "devnull", args: { match: "CRASH" }, desc: "Cestina i 'CRASH'" },
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
        title: "Boss Final",
        mission: "Estrai i 2 nodi con il nome più alto, in ordine decrescente, in maiuscolo e senza doppioni. Gli slot sono solo 4: non tutti i comandi servono.",
        stdin: ["NodeB", "nodeA", "nodeC", "FATAL", "nodeA", "nodeC"],
        target: ["NODEC", "NODEB"],
        hint: "Ti serve davvero cestinare i FATAL? Pensa a dove finiscono dopo un 'sort -r' e a cosa lascia fuori 'head'.",
        allowedCommands: [
            { cmd: "devnull", args: { match: "FATAL" }, desc: "Cestina i 'FATAL'" },
            { cmd: "upper", desc: "Maiuscolo" },
            { cmd: "sort", desc: "Ordine crescente" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" },
            { cmd: "tail", args: { n: 2 }, desc: "Prendi gli ultimi 2" }
        ]
    }
];
