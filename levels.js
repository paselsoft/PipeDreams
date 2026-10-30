const SLOT_COUNT = 4;

// allowedCommands elenca solo i comandi reali: lo slot vuoto viene aggiunto dal motore in prima posizione.
const levels = [
    {
        id: 1,
        title: "Il Filtro Base",
        mission: "Usa <code>grep</code> per isolare solo i pacchetti validi eliminando i file corrotti (<code>ERR</code>).",
        stdin: ["file1", "ERR:corrotto", "file2", "ERR:corrotto"],
        target: ["file1", "file2"],
        hint: "Inserisci un blocco 'grep -v ERR' per scartare i file con errori.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "ERR", invert: true }, desc: "Scarta gli errori" }
        ]
    },
    {
        id: 2,
        title: "Ordinamento e Duplicati",
        mission: "Pulisci il flusso rimuovendo i doppioni con <code>uniq</code> e ordinando con <code>sort</code>.",
        stdin: ["zebra", "mela", "mela", "cane"],
        target: ["cane", "mela", "zebra"],
        hint: "Prima ordina con 'sort' e poi rimuovi i doppioni con 'uniq'.",
        allowedCommands: [
            { cmd: "sort", desc: "Riordina alfabeticamente" },
            { cmd: "uniq", desc: "Elimina duplicati adiacenti" }
        ]
    },
    {
        id: 3,
        title: "Gestione Stderr",
        mission: "Scarta i pacchetti di errore critici usando <code>2>/dev/null</code>, converti in maiuscolo e ordina.",
        stdin: ["alfa", "CRASH", "beta", "alfa"],
        target: ["ALFA", "BETA"],
        hint: "1) Cestina il CRASH, 2) Converti in maiuscolo, 3) Ordina, 4) Uniq.",
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
        mission: "Ordina, rimuovi duplicati e mantieni solo i primi 2 elementi usando <code>head</code>.",
        stdin: ["gamma", "alfa", "alfa", "beta"],
        target: ["ALFA", "BETA"],
        hint: "Usa 'sort', 'uniq', 'sed' per il maiuscolo e 'head -n 2'.",
        allowedCommands: [
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "upper", desc: "Maiuscolo" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" }
        ]
    },
    {
        id: 5,
        title: "Depurazione Avanzata",
        mission: "Elimina i log di sistema (<code>WARN</code>), metti in maiuscolo, ordina e pulisci.",
        stdin: ["server2", "WARN:low", "server1", "server2", "WARN:low"],
        target: ["SERVER1", "SERVER2"],
        hint: "Pulisci con 'grep -v WARN', poi maiuscolo, sort e uniq.",
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
        mission: "Scarta i <code>FATAL</code>, ordina, rimuovi i doppioni e converti in maiuscolo.",
        stdin: ["nodeB", "FATAL", "nodeA", "nodeA"],
        target: ["NODEA", "NODEB"],
        hint: "Usa i 4 slot per: 1) 2>/dev/null, 2) sort, 3) uniq, 4) sed",
        allowedCommands: [
            { cmd: "devnull", args: { match: "FATAL" }, desc: "Cestina i 'FATAL'" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "upper", desc: "Maiuscolo" }
        ]
    }
];
