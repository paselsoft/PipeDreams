// Numero di slot predefinito; un livello può cambiarlo con `slots`
const SLOT_COUNT = 4;

// Una riga di stdin è una stringa (stdout) oppure { err: "testo" } (stderr).
// allowedCommands elenca solo i comandi reali: lo slot vuoto viene aggiunto dal motore in prima posizione.
// Dopo ogni modifica verifica i livelli con: node tools/validate-levels.js
const levels = [
    {
        id: 1,
        act: 1,
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
        act: 1,
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
        act: 1,
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
        act: 1,
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
        act: 1,
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
        act: 1,
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
        act: 1,
        title: "Boss Atto I",
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
    },
    {
        id: 8,
        act: 2,
        title: "Contare le Righe",
        mission: "Quanti login ci sono stati in totale? <code>wc -l</code> conta le righe del flusso.",
        stdin: ["login mario", "logout luca", "login anna", "login mario", "logout anna", "login luca"],
        target: ["4"],
        hint: "Prima isola le righe giuste, poi contale. Attenzione: 'logout' contiene 'log' ma non 'login'.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "log" }, desc: "Tieni le righe con 'log'" },
            { cmd: "grep", args: { pattern: "login" }, desc: "Tieni le righe con 'login'" },
            { cmd: "grep", args: { pattern: "login", invert: true }, desc: "Scarta le righe con 'login'" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "wc", desc: "Conta le righe" }
        ]
    },
    {
        id: 9,
        act: 2,
        title: "Tagliare le Colonne",
        mission: "Ogni riga è <code>utente:uid:shell</code>. Elenca in ordine alfabetico gli utenti che usano bash. <code>cut</code> estrae un campo.",
        stdin: ["root:0:/bin/bash", "mario2:1001:/bin/bash", "daemon:1:/usr/sbin/nologin", "mario:1000:/bin/bash", "anna:1002:/bin/zsh"],
        target: ["mario", "mario2", "root"],
        hint: "Dopo il 'cut' la shell non c'è più, quindi filtra prima. E nell'ordine dei byte '2' viene prima di ':': ordinare le righe intere non equivale a ordinare i nomi.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "bash" }, desc: "Tieni le righe con 'bash'" },
            { cmd: "grep", args: { pattern: "bash", invert: true }, desc: "Scarta le righe con 'bash'" },
            { cmd: "cut", args: { delim: ":", field: 1 }, desc: "Campo 1: utente" },
            { cmd: "cut", args: { delim: ":", field: 3 }, desc: "Campo 3: shell" },
            { cmd: "sort", desc: "Ordine crescente" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" }
        ]
    },
    {
        id: 10,
        act: 2,
        title: "Traduzioni",
        mission: "Le liste della spesa sono separate da virgole. Ottieni un frutto per riga, in ordine e senza doppioni. <code>tr</code> sostituisce i caratteri: anche con un a capo (<code>\\n</code>).",
        stdin: ["pera,mela,kiwi", "mela,uva"],
        target: ["kiwi", "mela", "pera", "uva"],
        hint: "Trasformare ogni virgola in un a capo spezza le righe. Se ordini prima di spezzarle, ordini le liste, non i frutti.",
        allowedCommands: [
            { cmd: "tr", args: { from: ",", to: "\n" }, desc: "Virgola → a capo" },
            { cmd: "tr", args: { delete: "," }, desc: "Elimina le virgole" },
            { cmd: "tr", args: { from: "a-z", to: "A-Z" }, desc: "Minuscole → maiuscole" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
        ]
    },
    {
        id: 11,
        act: 2,
        title: "La Classifica",
        slots: 5,
        mission: "Sondaggio sul colore preferito: mostra i 2 colori più votati con il numero di voti, dal più votato. <code>uniq -c</code> conta le ripetizioni.",
        stdin: ["rosso", "blu", "rosso", "verde", "blu", "rosso", "giallo"],
        target: ["      3 rosso", "      2 blu"],
        hint: "'uniq -c' conta solo le righe adiacenti, quindi raggruppa prima. Poi ordina per numero ('-n') dal più grande ('-r').",
        allowedCommands: [
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" },
            { cmd: "tail", args: { n: 2 }, desc: "Prendi gli ultimi 2" }
        ]
    },
    {
        id: 12,
        act: 2,
        title: "Boss Atto II",
        slots: 6,
        mission: "Analizza l'access log (<code>ora metodo pagina esito</code>): mostra le 2 pagine più richieste con <code>GET</code>, con il numero di richieste, dalla più richiesta.",
        stdin: ["10:02 GET /home 200", "10:03 POST /login 302", "10:05 GET /prodotti 404", "10:07 GET /home 200", "10:08 POST /login 401", "10:11 GET /about 200", "10:12 POST /login 302", "10:15 GET /home 304", "10:16 GET /zaino 200", "10:20 GET /prodotti 200"],
        target: ["      3 /home", "      2 /prodotti"],
        hint: "Filtra le GET finché il metodo è ancora sulla riga, poi estrai la pagina (campo 3). Da lì è la ricetta della classifica.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "GET" }, desc: "Tieni le righe con 'GET'" },
            { cmd: "grep", args: { pattern: "GET", invert: true }, desc: "Scarta le righe con 'GET'" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2: metodo" },
            { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3: pagina" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "wc", desc: "Conta le righe" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" },
            { cmd: "tail", args: { n: 2 }, desc: "Prendi gli ultimi 2" }
        ]
    },
    {
        id: 13,
        act: 3,
        title: "Sostituzioni",
        mission: "Nel file di configurazione le password sono in chiaro: sostituiscile con <code>***</code> usando <code>sed -E 's/regex/sostituzione/'</code>, senza toccare i nomi utente.",
        stdin: ["user=mario2 pass=1234", "user=anna pass=98765", "user=luca7 pass=42"],
        target: ["user=mario2 pass=***", "user=anna pass=***", "user=luca7 pass=***"],
        hint: "Una regex troppo generica come [0-9]+ colpisce anche i numeri nei nomi utente: aggancia la sostituzione a 'pass='.",
        allowedCommands: [
            { cmd: "sed", args: { pattern: "[0-9]+", replacement: "***", global: true }, desc: "Ogni numero \u2192 ***" },
            { cmd: "sed", args: { pattern: "[0-9]", replacement: "*", global: true }, desc: "Ogni cifra \u2192 *" },
            { cmd: "sed", args: { pattern: "pass=[0-9]+", replacement: "pass=***" }, desc: "Password \u2192 ***" },
            { cmd: "grep", args: { pattern: "pass" }, desc: "Tieni le righe con 'pass'" },
            { cmd: "sort", desc: "Riordina" }
        ]
    },
    {
        id: 14,
        act: 3,
        title: "Gli Spazi di awk",
        slots: 5,
        mission: "Ordina i colori dal pi\u00f9 votato al meno votato, mostrando solo il nome. <code>awk '{print $2}'</code> stampa il secondo campo, separando sui gruppi di spazi.",
        stdin: ["rosso", "blu", "rosso", "verde", "blu", "rosso", "blu", "giallo", "blu"],
        target: ["blu", "rosso", "verde", "giallo"],
        hint: "Dopo 'uniq -c' le righe iniziano con molti spazi: per cut ogni spazio separa un campo (vuoto), per awk no.",
        allowedCommands: [
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
            { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" }
        ]
    },
    {
        id: 15,
        act: 3,
        title: "Date Europee",
        mission: "Metti i log in ordine cronologico e riscrivi le date come giorno/mese/anno. In <code>sed -E</code> le parentesi catturano gruppi, che riusi con <code>\\1</code>, <code>\\2</code>...",
        stdin: ["2024-03-15 backup", "2023-12-01 aggiornamento", "2024-01-20 riavvio"],
        target: ["01/12/2023 aggiornamento", "20/01/2024 riavvio", "15/03/2024 backup"],
        hint: "Le date AAAA-MM-GG in ordine alfabetico sono anche in ordine cronologico; le GG/MM/AAAA no. Ordina prima di riscriverle.",
        allowedCommands: [
            { cmd: "sed", args: { pattern: "([0-9]+)-([0-9]+)-([0-9]+)", replacement: "\\1/\\2/\\3" }, desc: "Riscrivi come \\1/\\2/\\3" },
            { cmd: "sed", args: { pattern: "([0-9]+)-([0-9]+)-([0-9]+)", replacement: "\\3/\\2/\\1" }, desc: "Riscrivi come \\3/\\2/\\1" },
            { cmd: "sort", desc: "Ordine crescente" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" }
        ]
    },
    {
        id: 16,
        act: 3,
        title: "Incollare le Righe",
        mission: "Crea una riga CSV con gli utenti che usano bash, in ordine alfabetico. <code>paste -sd','</code> unisce tutte le righe in una, separate da virgole.",
        stdin: ["mario2:1003:/bin/bash", "daemon:1:/usr/sbin/nologin", "anna:1001:/bin/bash", "mario:1000:/bin/bash", "www:33:/usr/sbin/nologin", "luca:1002:/bin/bash"],
        target: ["anna,luca,mario,mario2"],
        hint: "awk -F':' sceglie il separatore dei campi. Ordina i nomi, non le righe intere: nell'ordine dei byte 'mario2:' viene prima di 'mario:'.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "bash" }, desc: "Tieni le righe con 'bash'" },
            { cmd: "awk", args: { field: 1, separator: ":" }, desc: "Campo 1: utente" },
            { cmd: "awk", args: { field: 3, separator: ":" }, desc: "Campo 3: shell" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "paste", args: { delim: "," }, desc: "Unisci con virgole" },
            { cmd: "tr", args: { from: ":", to: "," }, desc: "Due punti \u2192 virgola" }
        ]
    },
    {
        id: 17,
        act: 3,
        title: "Boss Atto III",
        slots: 7,
        mission: "Dal log del server ricava una riga riassuntiva <code>pagina=richieste</code>, separate da virgole, dalla pagina pi\u00f9 richiesta alla meno richiesta.",
        stdin: ["10:02  GET  /home      200", "10:05  GET  /prodotti  404", "10:07  GET  /home      304", "10:11  GET  /about     200", "10:16  GET  /prodotti  200", "10:20  GET  /home      200"],
        target: ["home=3,prodotti=2,about=1"],
        hint: "Colonne allineate con pi\u00f9 spazi: serve awk. Poi la ricetta della classifica; infine sed trasforma '      3 /home' in 'home=3' e paste unisce le righe.",
        allowedCommands: [
            { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
            { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" },
            { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "sed", args: { pattern: " *([0-9]+) /(.*)", replacement: "\\1=\\2" }, desc: "Riscrivi come numero=pagina" },
            { cmd: "sed", args: { pattern: " *([0-9]+) /(.*)", replacement: "\\2=\\1" }, desc: "Riscrivi come pagina=numero" },
            { cmd: "paste", args: { delim: "," }, desc: "Unisci con virgole" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" }
        ]
    }
];
