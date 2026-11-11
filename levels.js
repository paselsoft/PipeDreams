// Numero di slot predefinito; un livello può cambiarlo con `slots`
const SLOT_COUNT = 4;

// Una riga di stdin è una stringa (stdout) oppure { err: "testo" } (stderr).
// Tipi speciali (vedi solver.js): type "quiz" e "debug" con start, wrong, maxChanges, explain;
// locked blocca alcune celle su un comando.
// nudge è il primo aiuto (dove guardare), hint il secondo (il piano).
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
        nudge: "Guarda bene: le righe da eliminare hanno tutte qualcosa in comune.",
        hint: "Piano: basta un solo comando. Attenzione: grep 'ERR' tiene le righe che contengono ERR; con -v fa l'opposto e le scarta.",
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
        tutor: "uniq toglie solo i doppioni che si toccano: sort li mette uno accanto all'altro. Per questo l'ordine è sort, poi uniq, e mai il contrario.",
        stdin: ["zebra", "mela", "cane", "mela"],
        target: ["cane", "mela", "zebra"],
        nudge: "uniq vede solo i doppioni che si toccano. Le due 'mela' sono vicine?",
        hint: "Piano in 2 passi: 1) metti vicine le righe uguali (sort), 2) togli i doppioni (uniq). Attenzione: uniq elimina solo i duplicati adiacenti, e nell'input le due 'mela' non sono vicine.",
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
        nudge: "Il CRASH non è una riga come le altre: è su stderr, in rosso.",
        hint: "Piano in 4 passi: 1) cestina lo stderr (2>/dev/null), 2) metti tutto in maiuscolo, 3) ordina, 4) togli i doppioni. Attenzione: 2>/dev/null vale per il comando a cui è attaccato e il CRASH nasce dal programma iniziale, quindi va per primo. E sort mette le maiuscole prima: 'Beta' e 'beta' finirebbero lontane, perciò uniforma il maiuscolo prima di ordinare.",
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
        nudge: "Quanti elementi diversi ci sono? E in che ordine devono essere prima di tagliare?",
        hint: "Piano in 3 passi: 1) ordina, 2) togli i doppioni, 3) tieni i primi 2 (head). Attenzione: se tagli prima di togliere i doppioni prendi due 'beta' uguali; tail prende gli ultimi, non i primi.",
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
        nudge: "grep distingue maiuscole e minuscole: come sono scritti gli avvisi nell'input?",
        hint: "Piano in 4 passi: 1) metti tutto in maiuscolo, 2) scarta i WARN, 3) ordina, 4) togli i doppioni. Attenzione: grep distingue maiuscole e minuscole: 'WARN' non trova 'warn:disk' finché il sed non lo rende maiuscolo. Anche 'Server2' e 'server2' diventano uguali solo dopo il sed.",
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
        tutor: "Gli errori viaggiano su stderr e saltano la pipe: grep non li vedrebbe. 2>&1, attaccato al programma, li fa entrare nel flusso come righe normali.",
        stdin: ["job1: ok", { err: "ERR: disco pieno" }, "job2: ok", { err: "ERR: disco pieno" }, { err: "ERR: timeout" }, "job3: ok"],
        target: ["ERR: disco pieno", "ERR: timeout"],
        nudge: "Gli errori ti servono, ma stanno su stderr: grep da solo non li vede.",
        hint: "Piano in 3 passi: 1) porta gli errori nella pipe (2>&1), 2) tieni solo le righe con ERR, 3) togli i doppioni. Attenzione: senza 2>&1 gli errori scavalcano la pipe e grep non li vede. Fra i due 'disco pieno' c'è 'job2: ok': diventano adiacenti solo dopo il grep, quindi uniq va dopo. Non serve ordinare.",
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
        tutor: "Il maiuscolo va fatto prima di ordinare: sort mette le maiuscole prima delle minuscole, quindi con righe miste l'ordine cambierebbe.",
        stdin: ["avvio ok", { err: "fatal: nodeb" }, "backup ok", { err: "FATAL: nodeC" }, "avvio ok", { err: "fatal: nodea" }],
        target: ["FATAL: NODEC", "FATAL: NODEB"],
        nudge: "Gli errori ti servono, quindi non buttarli. E 'fatal' e 'FATAL' non si ordinano vicini.",
        hint: "Piano in 4 passi: 1) porta gli errori nella pipe (2>&1), 2) metti tutto in maiuscolo, 3) ordina in modo decrescente (sort -r), 4) tieni i primi 2. Attenzione: gli errori ti servono, quindi non cestinarli. Prima del maiuscolo 'FATAL: nodeC' e 'fatal: nodeb' finiscono lontane nell'ordinamento; dopo, in ordine decrescente le righe FATAL vengono prima di BACKUP e AVVIO.",
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
        nudge: "'logout' contiene 'log'... ma contiene anche 'login'?",
        hint: "Piano in 2 passi: 1) tieni solo i login, 2) contali (wc -l). Attenzione: 'logout' contiene 'log' ma non 'login', quindi grep 'log' conterebbe anche le uscite. uniq non serve: vanno contati tutti i login, anche quelli ripetuti, e usarlo costa solo uno slot.",
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
        nudge: "Dopo aver tagliato le colonne, la shell sparisce dalla riga.",
        hint: "Piano in 3 passi: 1) tieni le righe con bash, 2) estrai il nome (cut, campo 1), 3) ordina. Attenzione: dopo il cut la shell non c'è più, quindi filtra prima. E nell'ordine dei byte '2' viene prima di ':', quindi 'mario2:' precede 'mario:': ordina i nomi, non le righe intere.",
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
        nudge: "Prima di ordinare i frutti, ogni frutto deve stare su una riga sua.",
        hint: "Piano in 3 passi: 1) metti un frutto per riga (tr ',' '\\n'), 2) ordina, 3) togli i doppioni. Attenzione: se ordini prima di spezzare le righe, ordini le liste, non i frutti. tr -d ',' invece incollerebbe i nomi tra loro.",
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
        tutor: "uniq -c conta solo righe vicine, quindi prima serve sort. Poi sort -rn mette in cima i conteggi più alti: -n confronta i numeri per valore, non come testo.",
        stdin: ["rosso", "blu", "rosso", "verde", "blu", "rosso", "giallo"],
        target: ["      3 rosso", "      2 blu"],
        nudge: "Per contare i voti uguali, devono prima stare vicini.",
        hint: "Piano in 4 passi: 1) raggruppa i voti uguali (sort), 2) contali (uniq -c), 3) ordina dal più votato (sort -rn), 4) tieni i primi 2 (head). Attenzione: uniq -c conta solo le righe adiacenti, quindi raggruppa prima. Dopo sort -rn i più votati sono in cima: tail prenderebbe i meno votati.",
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
        nudge: "Ogni riga inizia con l'orario: cosa succede se ordini le righe intere?",
        hint: "Piano in 6 passi: 1) tieni le GET, finché il metodo è ancora sulla riga, 2) estrai la pagina (cut, campo 3: ora, metodo, pagina), 3-5) la ricetta della classifica: sort, uniq -c, sort -rn, 6) tieni le prime 2. Attenzione: ordinare le righe intere le mette in ordine di orario, non di pagina: il sort va dopo il cut.",
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
        nudge: "Quale regex colpisce solo le password, e non i numeri nei nomi utente?",
        hint: "Piano: basta un solo sed. Attenzione: [0-9]+ colpisce anche i numeri nei nomi utente (mario2, luca7), e [0-9] con g trasforma ogni cifra in un asterisco separato. Scegli la sostituzione che ha 'pass=' nella regex: così cambia solo le password.",
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
        tutor: "uniq -c allinea i numeri con degli spazi davanti: cut -d' ' troverebbe campi vuoti. awk invece salta i gruppi di spazi, quindi $2 è proprio il nome.",
        stdin: ["rosso", "blu", "rosso", "verde", "blu", "rosso", "blu", "giallo", "blu"],
        target: ["blu", "rosso", "verde", "giallo"],
        nudge: "Guarda l'output di uniq -c: quanti spazi ci sono all'inizio della riga?",
        hint: "Piano in 4 passi: 1) raggruppa i voti uguali (sort), 2) contali (uniq -c), 3) ordina dal più votato (sort -rn), 4) tieni solo il nome. Attenzione: dopo uniq -c ogni riga inizia con molti spazi ('      4 blu'): per cut ogni spazio separa un campo e il campo 2 è vuoto; awk invece salta gli spazi e il nome è il campo $2.",
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
        nudge: "In quale dei due formati le date si ordinano già da sole?",
        hint: "Piano in 2 passi: prima ordina, poi riscrivi. Le date AAAA-MM-GG in ordine alfabetico sono già in ordine cronologico, le GG/MM/AAAA no. I tre gruppi della regex catturano anno, mese e giorno, in quest'ordine: per scrivere giorno/mese/anno la sostituzione deve essere \\3/\\2/\\1.",
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
        nudge: "Ordinare le righe intere equivale a ordinare i nomi? Confronta 'mario2:' e 'mario:'.",
        hint: "Piano in 4 passi: 1) tieni solo le righe con bash, finché la shell è ancora sulla riga, 2) estrai il nome con awk -F':' (campo 1), 3) ordina i nomi, 4) uniscili in una riga con paste. Attenzione all'ordine fra 2 e 3: nell'ordine dei byte 'mario2:' viene prima di 'mario:', quindi ordinare le righe intere non dà l'ordine dei nomi.",
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
        nudge: "Le colonne sono allineate con più spazi: quale comando li gestisce bene?",
        hint: "Piano in 6 passi: 1) estrai la pagina: le colonne sono allineate con più spazi, quindi cut non funziona e serve awk (la pagina è il campo $3); 2-4) la ricetta della classifica: sort, uniq -c, sort -rn; 5) riscrivi '3 /home' come 'home=3' con il sed che mette prima il nome (\\2) e poi il numero (\\1); 6) unisci le righe con paste.",
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
    },
    {
        id: 18,
        act: 4,
        title: "Rubrica",
        mission: "La rubrica esportata dal telefono ha righe <code>cognome,nome,telefono</code>. Elenca i contatti come <code>Nome Cognome</code>, in ordine di cognome.",
        tutor: "Con sed -E le parentesi catturano i pezzi della riga: \\1 è il cognome, \\2 il nome. Nella sostituzione li rimetti nell'ordine che vuoi.",
        stdin: ["Verdi,Anna,333111", "# esportato dal telefono", "Bianchi,Luca,333222", "Rossi,Mario,333333"],
        target: ["Luca Bianchi", "Mario Rossi", "Anna Verdi"],
        nudge: "Dopo il sed, la riga inizia con il nome o con il cognome?",
        hint: "Piano in 3 passi: 1) scarta la riga di commento (#), 2) ordina, 3) riscrivi ogni riga con sed. Attenzione: dopo il sed la riga inizia con il nome, quindi ordinando dopo otterresti l'ordine dei nomi (Anna, Luca, Mario). Ordina mentre il cognome è ancora in testa. Nella sostituzione \\2 è il nome e \\1 il cognome.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "#", invert: true }, desc: "Scarta le righe con '#'" },
            { cmd: "sort", desc: "Ordine crescente" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "sed", args: { pattern: "([^,]+),([^,]+),.*", replacement: "\\2 \\1" }, desc: "Riscrivi come \\2 \\1" },
            { cmd: "sed", args: { pattern: "([^,]+),([^,]+),.*", replacement: "\\1 \\2" }, desc: "Riscrivi come \\1 \\2" },
            { cmd: "cut", args: { delim: ",", field: 2 }, desc: "Campo 2 (virgola)" }
        ]
    },
    {
        id: 19,
        act: 4,
        title: "Il Più Grande",
        mission: "Ogni riga è <code>nome punteggio</code>. Trova il punteggio più alto.",
        stdin: ["anna 45", "bruno 300", "eva 8", "dario 120"],
        target: ["300"],
        nudge: "Come testo, '8' viene prima o dopo '300'?",
        hint: "Piano in 3 passi: 1) estrai il punteggio (awk, campo 2), 2) ordinalo per valore numerico, 3) prendi l'ultimo. Attenzione: senza -n i numeri si ordinano come testo, e '8' finisce dopo '300'. Ordinare le righe intere invece le mette in ordine di nome.",
        allowedCommands: [
            { cmd: "awk", args: { field: 1 }, desc: "Campo 1: nome" },
            { cmd: "awk", args: { field: 2 }, desc: "Campo 2: punteggio" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { numeric: true }, desc: "Ordine numerico" },
            { cmd: "head", args: { n: 1 }, desc: "Prendi il primo" },
            { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultimo" }
        ]
    },
    {
        id: 20,
        act: 4,
        title: "Normalizzare",
        slots: 5,
        mission: "Quanti indirizzi email diversi ci sono? Maiuscole e spazi non contano: <code>Anna@Mail.it</code> e <code>anna@mail.it</code> con uno spazio davanti sono lo stesso indirizzo.",
        stdin: ["Anna@Mail.it", "luca@mail.it ", " anna@mail.it", "LUCA@MAIL.IT", "eva@mail.it"],
        target: ["3"],
        nudge: "Per uniq, 'Anna@Mail.it' e ' anna@mail.it' sono righe uguali?",
        hint: "Piano in 5 passi: 1) tutto in minuscolo (tr 'A-Z' 'a-z'), 2) togli gli spazi (tr -d ' '), 3) ordina, 4) togli i doppioni, 5) conta. Attenzione: uniq confronta le righe carattere per carattere, quindi finché restano differenze di maiuscole o spazi due indirizzi uguali sembrano diversi.",
        allowedCommands: [
            { cmd: "tr", args: { from: "A-Z", to: "a-z" }, desc: "Maiuscole → minuscole" },
            { cmd: "tr", args: { delete: " " }, desc: "Elimina gli spazi" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "wc", desc: "Conta le righe" },
            { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" }
        ]
    },
    {
        id: 21,
        act: 4,
        title: "Errori per Tipo",
        slots: 7,
        mission: "Il server scrive gli errori su stderr, nel formato <code>ora ERR tipo</code>. Fai la classifica dei tipi di errore, dal più frequente, con il numero di volte.",
        tutor: "Due trappole insieme: gli errori sono su stderr (serve 2>&1 prima di tutto) e uniq -c vuole le righe già ordinate.",
        stdin: ["10:00 avvio", { err: "10:02 ERR memoria" }, "10:03 job ok", { err: "10:05 ERR rete" }, { err: "10:06 ERR memoria" }, "10:08 job ok", { err: "10:09 ERR disco" }, { err: "10:11 ERR rete" }, { err: "10:12 ERR memoria" }, "10:15 fine"],
        target: ["      3 memoria", "      2 rete", "      1 disco"],
        nudge: "Gli errori sono su stderr, e ogni riga inizia con l'orario.",
        hint: "Piano in 6 passi: 1) porta gli errori nella pipe (2>&1), 2) tieni le righe ERR, 3) estrai il tipo (campo 3), 4-6) la ricetta della classifica: sort, uniq -c, sort -rn. Attenzione: ogni riga inizia con l'orario, quindi ordinare le righe intere le mette in ordine di tempo: estrai il tipo prima di raggruppare.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "grep", args: { pattern: "ERR", invert: true }, desc: "Scarta le righe con 'ERR'" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
        ]
    },
    {
        id: 22,
        act: 4,
        title: "Elenco Pulito",
        slots: 5,
        mission: "Le liste usano il punto e virgola. Crea un'unica riga con tutti i frutti, senza doppioni, in ordine alfabetico e separati da virgole.",
        stdin: ["pere;mele", "uva", "kiwi;pere", "mele;uva"],
        target: ["kiwi,mele,pere,uva"],
        nudge: "Ogni frutto deve stare su una riga sua per essere ordinato; alla fine tutto torna su una riga.",
        hint: "Piano in 4 passi: 1) un frutto per riga (tr ';' '\\n'), 2) ordina, 3) togli i doppioni, 4) unisci con paste -sd','. Attenzione: tr ';' ',' cambia solo il separatore e i doppioni restano dentro le righe; dopo paste resta una riga sola, quindi sort e uniq vanno prima.",
        allowedCommands: [
            { cmd: "tr", args: { from: ";", to: "\n" }, desc: "Punto e virgola → a capo" },
            { cmd: "tr", args: { from: ";", to: "," }, desc: "Punto e virgola → virgola" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "paste", args: { delim: "," }, desc: "Unisci con virgole" },
            { cmd: "paste", args: { delim: ";" }, desc: "Unisci con punto e virgola" }
        ]
    },
    {
        id: 23,
        act: 4,
        title: "Boss Atto IV",
        slots: 7,
        mission: "Dal log del server ricava le pagine che hanno risposto <code>404</code> (non trovata): senza ripetizioni, in ordine alfabetico, in un'unica riga separata da virgole. Gli avvisi su stderr non devono comparire.",
        stdin: ["10:01  GET  /home      200", { err: "WARN cache lenta" }, "10:03  GET  /vecchia   404", "10:04  GET  /prodotti  200", "10:06  GET  /foto      404", { err: "WARN 404 su /favicon.ico" }, "10:09  GET  /vecchia   404", "10:12  GET  /api       404"],
        target: ["/api,/foto,/vecchia"],
        nudge: "Anche un avviso su stderr contiene '404'.",
        hint: "Piano in 6 passi: 1) cestina gli avvisi (2>/dev/null), 2) tieni le righe con 404, 3) estrai la pagina con awk (campo 3: le colonne sono allineate con più spazi), 4) ordina, 5) togli i doppioni, 6) unisci con paste. Attenzione: anche un avviso contiene '404': se unisci lo stderr con 2>&1, grep lo tiene.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "404" }, desc: "Tieni le righe con '404'" },
            { cmd: "grep", args: { pattern: "404", invert: true }, desc: "Scarta le righe con '404'" },
            { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
            { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "paste", args: { delim: "," }, desc: "Unisci con virgole" }
        ]
    },
    {
        id: 24,
        act: 5,
        title: "La Prima Domanda",
        type: "quiz",
        mission: "Tommaso chiede: cosa stampa questa pipeline? Leggi i comandi nelle celle e scegli l'output giusto tra i tre.",
        stdin: ["pera", "mela", "pera", "kiwi", "mela", "pera"],
        target: ["      3 pera"],
        nudge: "Esegui la pipeline nella testa, un comando alla volta: cosa riceve uniq -c?",
        hint: "Simula un passo alla volta: 1) sort mette vicini i frutti uguali, 2) uniq -c li conta, 3) sort -rn mette in cima il più frequente, 4) head -n 1 tiene solo quello.",
        explain: "Il primo sort è fondamentale: senza, uniq -c vede solo righe uguali vicine e conta tutto 1.",
        allowedCommands: [
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
            { cmd: "head", args: { n: 1 }, desc: "Prendi il primo" }
        ],
        start: [1, 2, 3, 4],
        wrong: [
            { steps: [{ cmd: "uniq", args: { count: true } }, { cmd: "sort", args: { numeric: true, reverse: true } }, { cmd: "head", args: { n: 1 } }], why: "Questo sarebbe l'output senza il primo sort: uniq -c vede solo righe uguali vicine, quindi ogni frutto conta 1." },
            { steps: [{ cmd: "sort" }, { cmd: "uniq", args: { count: true } }, { cmd: "sort", args: { numeric: true } }, { cmd: "head", args: { n: 1 } }], why: "Questo sarebbe l'output con sort -n invece di sort -rn: in ordine crescente in cima c'è il meno frequente." }
        ]
    },
    {
        id: 25,
        act: 5,
        title: "Lo Script di Tommaso",
        type: "debug",
        maxChanges: 1,
        mission: "Lo script di Tommaso dovrebbe elencare i server in ordine alfabetico e senza doppioni, ma sbaglia. Puoi cambiare <strong>una sola cella</strong>.",
        stdin: ["mela", "zebra", "mela", "cane", "zebra"],
        target: ["cane", "mela", "zebra"],
        nudge: "Esegui lo script e guarda l'output: dove sono i doppioni?",
        hint: "Esegui lo script così com'è e guarda l'output: restano dei doppioni. uniq c'è già, ma lavora prima che le righe uguali siano vicine. Non puoi spostarlo: puoi solo cambiare o riempire una cella.",
        explain: "uniq prima di sort non vede i doppioni lontani: ne serviva un altro dopo il sort.",
        allowedCommands: [
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "head", args: { n: 3 }, desc: "Prendi i primi 3" }
        ],
        start: [2, 1, 0, 0]
    },
    {
        id: 26,
        act: 5,
        title: "Lo Script del 2009",
        slots: 5,
        locked: { 0: 1 },
        mission: "Il vecchio script di backup inizia sempre con <code>sort -r</code> e quella cella è bloccata. Ottieni comunque i primi 2 nomi in ordine alfabetico, in maiuscolo.",
        stdin: ["luca", "bruno", "Luca", "marco", "anna", "bruno"],
        target: ["ANNA", "BRUNO"],
        nudge: "La cella bloccata ordina al contrario: un altro sort dopo la annulla.",
        hint: "Un sort successivo annulla quello bloccato. Attenzione: 'Luca' con la maiuscola finisce prima delle minuscole, quindi uniforma il maiuscolo prima di ordinare.",
        allowedCommands: [
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "sort", desc: "Ordine crescente" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "upper", desc: "Maiuscolo" },
            { cmd: "head", args: { n: 2 }, desc: "Prendi i primi 2" },
            { cmd: "tail", args: { n: 2 }, desc: "Prendi gli ultimi 2" }
        ]
    },
    {
        id: 27,
        act: 5,
        title: "Quante Righe?",
        type: "quiz",
        mission: "Tommaso chiede: quante righe conta questa pipeline? Attenzione: alcune righe sono su stderr.",
        stdin: ["avvio", { err: "ERR: disco" }, "backup ok", { err: "ERR: rete" }, { err: "ERR: disco" }],
        target: ["3"],
        nudge: "Gli errori sono su stderr: questa pipeline li porta nella pipe?",
        hint: "2>&1 porta gli errori nella pipe; grep tiene le righe con ERR; wc -l le conta.",
        explain: "Grazie a 2>&1 le tre righe di errore entrano nella pipe e grep le può contare.",
        allowedCommands: [
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "wc", desc: "Conta le righe" }
        ],
        start: [1, 2, 3],
        wrong: [
            { steps: [{ cmd: "grep", args: { pattern: "ERR" } }, { cmd: "wc" }], why: "Questo sarebbe l'output senza 2>&1: gli errori vanno dritti al terminale e grep non ne vede nessuno." },
            { steps: [{ cmd: "merge" }, { cmd: "grep", args: { pattern: "ERR", invert: true } }, { cmd: "wc" }], why: "Questo sarebbe l'output con grep -v: conteresti le righe normali, non gli errori." }
        ]
    },
    {
        id: 28,
        act: 5,
        title: "Turno di Notte",
        slots: 6,
        locked: { 0: 1, 5: 6 },
        mission: "Lo script di monitoraggio inizia con <code>2>&1</code> e finisce con <code>wc -l</code>, e quelle celle non si toccano. Usalo per contare i <strong>tipi</strong> di errore diversi.",
        stdin: ["10:01 avvio", { err: "10:02 ERR rete" }, "10:03 ok", { err: "10:05 ERR disco" }, "10:06 ok", { err: "10:07 ERR rete" }, "10:08 ok", { err: "10:09 ERR rete" }],
        target: ["2"],
        nudge: "Tra le due celle bloccate devi contare i tipi di errore, non le righe.",
        hint: "Tra le due celle bloccate: tieni le righe ERR, estrai il tipo (campo 3), ordina, togli i doppioni. Attenzione: non aggiungere 2>/dev/null dopo 2>&1, perché vince l'ultimo reindirizzamento.",
        allowedCommands: [
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
            { cmd: "sort", desc: "Riordina" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "wc", desc: "Conta le righe" },
            { cmd: "devnull", desc: "Cestina lo stderr" }
        ]
    },
    {
        id: 29,
        act: 5,
        title: "Boss Atto V",
        type: "debug",
        maxChanges: 1,
        slots: 6,
        mission: "Lo script di Tommaso per la classifica degli errori va in produzione stasera, ma non stampa niente. Trova il bug: puoi cambiare <strong>una sola cella</strong>.",
        stdin: ["10:00 avvio", { err: "10:02 ERR memoria" }, "10:03 job ok", { err: "10:05 ERR rete" }, { err: "10:06 ERR memoria" }, { err: "10:12 ERR memoria" }, "10:15 fine"],
        target: ["      3 memoria", "      1 rete"],
        nudge: "Esegui lo script: dove finiscono gli errori?",
        hint: "Esegui lo script e guarda dove finiscono gli errori: sul terminale, invece che nella pipe. È il primo comando a decidere la sorte dello stderr.",
        explain: "2>/dev/null buttava via proprio gli errori da contare: serviva 2>&1 per portarli nella pipe.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "grep", args: { pattern: "ERR", invert: true }, desc: "Scarta le righe con 'ERR'" },
            { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" }
        ],
        start: [1, 3, 5, 7, 8, 9]
    },
    {
        id: 30,
        act: 6,
        title: "Log alla Rovescia",
        mission: "Il vecchio server scrive il log partendo dalla riga più recente. Mostra solo le righe dei <code>backup</code>, in ordine cronologico (dalla più vecchia).",
        tutor: "tac rovescia l'ordine delle righe; rev rovescerebbe le lettere di ogni riga. Filtrare prima o dopo tac qui non cambia il risultato, ma filtrare prima lascia meno righe da rovesciare.",
        stdin: ["23:10 spegnimento", "21:45 backup ok", "18:20 copia file", "14:05 backup ok", "11:30 avvio job", "08:15 backup ok", "07:00 accensione"],
        target: ["08:15 backup ok", "14:05 backup ok", "21:45 backup ok"],
        nudge: "Le righe sono già in ordine, solo al contrario.",
        hint: "Piano in 2 passi: tieni le righe di backup (grep) e rovescia l'ordine (tac), in qualsiasi ordine. Attenzione: sort -r ordina, non rovescia.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "backup" }, desc: "Tieni le righe con 'backup'" },
            { cmd: "grep", args: { pattern: "backup", invert: true }, desc: "Scarta le righe con 'backup'" },
            { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "head", args: { n: 3 }, desc: "Prendi le prime 3" }
        ]
    },
    {
        id: 31,
        act: 6,
        title: "Nomi allo Specchio",
        mission: "Il gestionale del 1998 ha esportato i nomi dei server scritti al contrario. Rimettili dritti, in ordine alfabetico e senza doppioni.",
        stdin: ["arbez", "alem", "enac", "arbez", "osro", "alem"],
        target: ["cane", "mela", "orso", "zebra"],
        nudge: "Ogni nome va letto da destra a sinistra; l'ordine delle righe non c'entra.",
        hint: "Piano in 3 passi: 1) raddrizza i nomi (rev), 2) ordina, 3) togli i doppioni. Attenzione: tac rovescia l'ordine delle righe, non le lettere; e se ordini prima di rev, ordini i nomi al contrario.",
        allowedCommands: [
            { cmd: "rev", desc: "Ogni riga al contrario" },
            { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { repeated: true }, desc: "Solo le righe ripetute" }
        ]
    },
    {
        id: 32,
        act: 6,
        title: "Note Spese",
        mission: "Ogni riga è <code>nome,reparto,euro</code>. L'amministrazione vuole le <code>3</code> note spese più alte, dalla più alta, con le righe intere.",
        tutor: "-t',' -k3,3 ordina guardando solo il terzo campo, ma sposta le righe intere: l'importo decide l'ordine, la riga resta completa.",
        stdin: ["anna,vendite,120", "luca,it,95", "eva,legale,1340", "marco,it,410", "sara,vendite,87", "dario,acquisti,560"],
        target: ["eva,legale,1340", "dario,acquisti,560", "marco,it,410"],
        nudge: "L'importo è il terzo campo, e va confrontato come numero.",
        hint: "Piano in 2 passi: 1) ordina sul campo 3 come numero, dal più alto (sort -rn -t',' -k3,3), 2) tieni le prime 3. Attenzione: sort -rn sulla riga intera guarda il nome, che non è un numero.",
        allowedCommands: [
            { cmd: "sort", args: { numeric: true, reverse: true, separator: ",", key: 3 }, desc: "Campo 3, numerico decrescente" },
            { cmd: "sort", args: { reverse: true, separator: ",", key: 3 }, desc: "Campo 3, testo decrescente" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Riga intera, numerico decrescente" },
            { cmd: "sort", args: { separator: ",", key: 2 }, desc: "Per reparto" },
            { cmd: "head", args: { n: 3 }, desc: "Prendi le prime 3" },
            { cmd: "tail", args: { n: 3 }, desc: "Prendi le ultime 3" }
        ]
    },
    {
        id: 33,
        act: 6,
        title: "Quante Volte?",
        mission: "Durante il trasloco ogni job scrive <code>ERR</code> una volta per ogni file perso, anche più volte nella stessa riga. Quanti file abbiamo perso in tutto?",
        stdin: ["job1 ok", "job2 ERR ERR ok", "job3 ERR", "job4 ok", "job5 ERR ERR ERR ERR", "job6 ok"],
        target: ["7"],
        nudge: "Non ti servono le righe con un errore: ti serve ogni singolo errore.",
        hint: "Piano in 2 passi: grep -o 'ERR' stampa una riga per ogni ERR trovato, wc -l le conta. Attenzione: grep senza -o restituisce le righe, e ne conteresti 3.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "ERR" }, desc: "Tieni le righe con 'ERR'" },
            { cmd: "grep", args: { pattern: "ERR", only: true }, desc: "Ogni 'ERR' su una riga" },
            { cmd: "grep", args: { pattern: "ok", invert: true }, desc: "Scarta le righe con 'ok'" },
            { cmd: "wc", desc: "Conta le righe" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
        ]
    },
    {
        id: 34,
        act: 6,
        title: "Badge Doppi",
        mission: "Nel nuovo datacenter si entra con il badge. Ogni riga è <code>badge nome</code>: trova i badge assegnati a <strong>più di una</strong> persona, in ordine alfabetico.",
        tutor: "uniq -d tiene solo le righe ripetute: dopo cut e sort, un badge che compare due volte è proprio un badge assegnato a più persone.",
        stdin: ["B17 anna", "B03 luca", "B21 marco", "B08 eva", "B03 sara", "B17 dario", "B11 irene"],
        target: ["B03", "B17"],
        nudge: "Ti serve solo il badge, e i doppioni devono stare vicini.",
        hint: "Piano in 3 passi: 1) estrai il badge (campo 1), 2) ordina, 3) tieni solo le righe ripetute (uniq -d). Attenzione: uniq senza -d tiene tutti i badge, una volta ciascuno.",
        allowedCommands: [
            { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { repeated: true }, desc: "Solo le righe ripetute" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
        ]
    },
    {
        id: 35,
        act: 6,
        title: "Codici Paese",
        mission: "I codici dei server sono come <code>IT2019042</code>: paese (2 lettere), anno, numero. Elenca i paesi in cui abbiamo server, in ordine alfabetico e senza ripetizioni.",
        stdin: ["IT2019042", "FR2021007", "IT2022118", "DE2018003", "FR2023051", "IT2020009"],
        target: ["DE", "FR", "IT"],
        nudge: "Il paese è sempre nei primi due caratteri, e non c'è un separatore.",
        hint: "Piano in 3 passi: 1) tieni i primi due caratteri (cut -c1-2), 2) ordina, 3) togli i doppioni. Attenzione: senza separatori, cut -d non sa dove tagliare.",
        allowedCommands: [
            { cmd: "cutc", args: { from: 1, to: 2 }, desc: "Caratteri 1-2" },
            { cmd: "cutc", args: { from: 3, to: 6 }, desc: "Caratteri 3-6" },
            { cmd: "cut", args: { delim: "0", field: 1 }, desc: "Campo 1 (separatore '0')" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
        ]
    },
    {
        id: 36,
        act: 6,
        title: "Boss Atto VI",
        slots: 7,
        mission: "🚨 Il disco del vecchio server va svuotato stanotte. Quanti file ci sono per ogni estensione? Mostra <code>uniq -c</code>, dall'estensione più frequente. Attenzione: alcuni nomi hanno più di un punto.",
        stdin: ["vacanze.mare.jpg", "bilancio.2024.pdf", "logo.png", "ferie.jpg", "contratto.v2.pdf", "foto.jpg", "icona.png", "report.finale.pdf", "cena.jpg", "scansione.jpeg"],
        target: ["      4 jpg", "      3 pdf", "      2 png", "      1 jpeg"],
        nudge: "L'estensione è l'ultimo pezzo dopo un punto, ma i punti non sono sempre lo stesso numero.",
        hint: "Il trucco: rev, poi il campo 1 separato da '.', poi di nuovo rev ti dà l'ultimo pezzo. Poi sort, uniq -c, sort -rn. Attenzione: il campo 2 funziona solo con un punto, e i caratteri 1-3 tagliano 'jpeg'.",
        allowedCommands: [
            { cmd: "rev", desc: "Ogni riga al contrario" },
            { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
            { cmd: "cut", args: { delim: ".", field: 1 }, desc: "Campo 1 (.)" },
            { cmd: "cut", args: { delim: ".", field: 2 }, desc: "Campo 2 (.)" },
            { cmd: "cutc", args: { from: 1, to: 3 }, desc: "Caratteri 1-3" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" }
        ]
    },
    {
        id: 37,
        act: 7,
        title: "Lista della Spesa di apt",
        source: "apt list --upgradable",
        slots: 5,
        mission: "Il server Debian ha degli aggiornamenti. Per il registro delle modifiche servono solo i <strong>nomi</strong> dei pacchetti, numerati come <code>1. curl</code>. L'avviso di apt su stderr non deve comparire.",
        stdin: [{ err: "WARNING: apt does not have a stable CLI interface. Use with caution in scripts." }, "Listing...", "curl/noble-updates 8.5.0-2ubuntu10.6 amd64 [upgradable from: 8.5.0-2ubuntu10.5]", "libssl3t64/noble-updates 3.0.13-0ubuntu3.5 amd64 [upgradable from: 3.0.13-0ubuntu3.4]", "openssh-server/noble-updates 1:9.6p1-3ubuntu13.7 amd64 [upgradable from: 1:9.6p1-3ubuntu13.5]", "sudo/noble-updates 1.9.15p5-3ubuntu5.24.04.1 amd64 [upgradable from: 1.9.15p5-3ubuntu5]"],
        target: ["1. curl", "2. libssl3t64", "3. openssh-server", "4. sudo"],
        nudge: "Tre cose da togliere: l'avviso, la riga Listing... e tutto quello che segue la barra.",
        hint: "Piano in 4 passi: 1) cestina l'avviso (2>/dev/null), 2) tieni le righe 'upgradable', 3) il nome è prima della barra (cut -d'/' -f1), 4) numera con nl -w1 -s'. '. Attenzione: nl senza opzioni usa 6 spazi e una tabulazione.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "grep", args: { pattern: "upgradable" }, desc: "Tieni le righe con 'upgradable'" },
            { cmd: "cut", args: { delim: "/", field: 1 }, desc: "Campo 1 (/)" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "nl", args: { width: 1, separator: ". " }, desc: "Numera: 1. 2. 3." },
            { cmd: "nl", desc: "Numera (formato standard)" }
        ]
    },
    {
        id: 38,
        act: 7,
        title: "Arch, Sempre Aggiornata",
        source: "pacman -Qu",
        mission: "Il server Arch elenca gli aggiornamenti come <code>nome vecchia -> nuova</code>. Il monitoraggio vuole solo <strong>quanti</strong> sono (lo stdout), ma tu vuoi vedere sul terminale anche i <strong>nomi</strong>.",
        stdin: ["firefox 131.0.3-1 -> 132.0-1", "linux 6.11.5.arch1-1 -> 6.11.6.arch1-1", "mesa 1:24.2.5-1 -> 1:24.2.6-1", "python 3.12.6-1 -> 3.12.7-1"],
        target: ["4"],
        targetStderr: ["firefox", "linux", "mesa", "python"],
        nudge: "Ti serve un raccordo a T: una copia dei nomi sul terminale, il resto avanti nella pipe.",
        hint: "Piano in 3 passi: 1) tieni il nome (cut, campo 1), 2) tee /dev/stderr ne manda una copia sul terminale, 3) wc -l conta. Attenzione: tee su un file non mostra niente.",
        allowedCommands: [
            { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
            { cmd: "cut", args: { delim: " ", field: 4 }, desc: "Campo 4 (spazio)" },
            { cmd: "tee", args: { file: "/dev/stderr" }, desc: "Copia sul terminale" },
            { cmd: "tee", args: { file: "aggiornamenti.txt" }, desc: "Copia in un file" },
            { cmd: "wc", desc: "Conta le righe" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" }
        ]
    },
    {
        id: 39,
        act: 7,
        title: "Pacchetti Critici",
        source: "rpm -qa --qf '%{NAME}\\n'",
        mission: "Sul server Fedora, quali dei pacchetti <strong>critici</strong> (il file <code>critici.txt</code>) sono installati? Elenco in ordine alfabetico.",
        stdin: ["kernel", "bash", "vim-enhanced", "openssl", "firefox", "sudo", "curl"],
        target: ["openssl", "sudo"],
        nudge: "comm confronta due elenchi, ma solo se sono ordinati.",
        hint: "Piano in 2 passi: 1) ordina l'elenco dei pacchetti installati, 2) comm -12 tiene le righe presenti in entrambi. Attenzione: senza sort, comm avvisa su stderr e il confronto è sbagliato.",
        allowedCommands: [
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
            { cmd: "comm", args: { mode: "12", file: "critici.txt", lines: ["glibc", "openssh", "openssl", "sudo"] }, desc: "In comune con critici.txt" },
            { cmd: "comm", args: { mode: "23", file: "critici.txt", lines: ["glibc", "openssh", "openssl", "sudo"] }, desc: "Solo nell'elenco, non critici" },
            { cmd: "comm", args: { mode: "13", file: "critici.txt", lines: ["glibc", "openssh", "openssl", "sudo"] }, desc: "Critici non installati" },
            { cmd: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 40,
        act: 7,
        title: "Versioni a Confronto",
        source: "dpkg-query -W -f='${Package} ${Version}\\n'",
        mission: "Accanto a ogni pacchetto installato metti l'ultima versione disponibile (il file <code>ultime.txt</code>): ogni riga deve diventare <code>pacchetto installata ultima</code>, in ordine alfabetico.",
        stdin: ["openssl 3.0.13-0ubuntu3.4", "curl 8.5.0-2ubuntu10.4", "vim 2:9.1.0016-1ubuntu7.3", "bash 5.2.21-2ubuntu4"],
        target: ["bash 5.2.21-2ubuntu4 5.2.21-2ubuntu4", "curl 8.5.0-2ubuntu10.4 8.5.0-2ubuntu10.6", "openssl 3.0.13-0ubuntu3.4 3.0.13-0ubuntu3.5", "vim 2:9.1.0016-1ubuntu7.3 2:9.1.0016-1ubuntu7.3"],
        nudge: "join unisce le righe con lo stesso primo campo, se entrambi gli elenchi sono ordinati.",
        hint: "Piano in 2 passi: 1) ordina, 2) join - ultime.txt unisce le righe con lo stesso nome. Attenzione: comm confronta le righe intere, e le versioni sono diverse.",
        allowedCommands: [
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "join", args: { file: "ultime.txt", lines: ["bash 5.2.21-2ubuntu4", "curl 8.5.0-2ubuntu10.6", "openssl 3.0.13-0ubuntu3.5", "vim 2:9.1.0016-1ubuntu7.3"] }, desc: "Unisci con ultime.txt" },
            { cmd: "comm", args: { mode: "12", file: "ultime.txt", lines: ["bash 5.2.21-2ubuntu4", "curl 8.5.0-2ubuntu10.6", "openssl 3.0.13-0ubuntu3.5", "vim 2:9.1.0016-1ubuntu7.3"] }, desc: "In comune con ultime.txt" },
            { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
            { cmd: "tac", desc: "Rovescia l'ordine delle righe" }
        ]
    },
    {
        id: 41,
        act: 7,
        title: "Cosa Manca?",
        type: "quiz",
        mission: "Tommaso chiede: questa pipeline confronta i pacchetti installati con <code>richiesti.txt</code> (git, htop, vim). Cosa stampa?",
        stdin: ["bash", "curl", "vim"],
        target: ["git", "htop"],
        nudge: "-13 nasconde la colonna 1 (solo nello stdin) e la colonna 3 (in comune).",
        hint: "comm -13 lascia solo la colonna 2: le righe che stanno solo nel file. Qui: i pacchetti richiesti non ancora installati.",
        explain: "comm -13 tiene solo quello che è nel file ma non nello stdin: git e htop sono richiesti ma non installati.",
        allowedCommands: [
            { cmd: "comm", args: { mode: "13", file: "richiesti.txt", lines: ["git", "htop", "vim"] }, desc: "Solo in richiesti.txt" }
        ],
        start: [1],
        wrong: [
            { steps: [{ cmd: "comm", args: { mode: "12", file: "richiesti.txt", lines: ["git", "htop", "vim"] } }], why: "Questo sarebbe comm -12: le righe in comune. Con -13 restano invece quelle solo nel file." },
            { steps: [{ cmd: "comm", args: { mode: "23", file: "richiesti.txt", lines: ["git", "htop", "vim"] } }], why: "Questo sarebbe comm -23: le righe solo nello stdin (installati ma non richiesti)." }
        ]
    },
    {
        id: 42,
        act: 7,
        title: "Fedora e il Kernel",
        source: "dnf check-update",
        slots: 6,
        mission: "Quali pacchetti si aggiornano sul server Fedora? Togli il kernel (lo aggiorniamo a parte, con un riavvio) e scrivi i nomi <strong>senza l'architettura</strong> finale (<code>.x86_64</code>, <code>.noarch</code>).",
        stdin: [{ err: "Last metadata expiration check: 0:12:44 ago on Tue 04 Nov 2026 07:10:31 CET." }, "", "curl.x86_64              8.6.0-11.fc40        updates", "kernel.x86_64            6.11.6-200.fc40      updates", "python3.12.x86_64        3.12.7-1.fc40        updates", "python3-pip.noarch       23.3.2-2.fc40        updates"],
        target: ["curl", "python3.12", "python3-pip"],
        nudge: "Il nome è la prima colonna, e l'architettura è l'ultimo pezzo dopo un punto. Attento a python3.12.",
        hint: "Piano in 5 passi: 2>/dev/null, tieni le righe 'updates', scarta il kernel, awk '{print $1}', poi sed -E 's/\\.[a-z0-9_]+$//' toglie l'ultimo punto e quello che segue. Attenzione: cut -d'.' -f1 taglia python3.12.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "grep", args: { pattern: "updates" }, desc: "Tieni le righe con 'updates'" },
            { cmd: "grep", args: { pattern: "kernel", invert: true }, desc: "Scarta le righe con 'kernel'" },
            { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
            { cmd: "sed", args: { pattern: "\\.[a-z0-9_]+$" }, desc: "Togli l'ultimo .xxx" },
            { cmd: "cut", args: { delim: ".", field: 1 }, desc: "Campo 1 (.)" },
            { cmd: "sort", desc: "Ordine alfabetico" }
        ]
    },
    {
        id: 43,
        act: 7,
        title: "Boss Atto VII",
        source: "for s in zebra mela gatto pesca pera; do ssh $s inventario; done",
        slots: 7,
        mission: "🚨 Patch Tuesday! L'inventario di tutti i server è <code>pacchetto server</code>. Quali server hanno almeno un pacchetto in <code>vulnerabili.txt</code>? Elenco ordinato, senza ripetizioni. Il server pera non risponde: il suo errore non deve comparire.",
        stdin: ["bash zebra", "openssh zebra", "xz mela", "curl pesca", { err: "ssh: connect to host pera port 22: Connection timed out" }, "sudo mela", "curl gatto", "bash pesca", "openssh gatto", "xz gatto", "vim mela", "vim pesca"],
        target: ["gatto", "mela", "zebra"],
        nudge: "join unisce l'inventario con le vulnerabilità sul nome del pacchetto; poi resta da tenere il server.",
        hint: "Piano in 6 passi: 2>/dev/null, sort, join - vulnerabili.txt (riga: pacchetto server CVE), awk '{print $2}', sort, uniq. Attenzione: comm confronta righe intere, qui non trova niente.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "merge", desc: "Unisci stderr a stdout" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "join", args: { file: "vulnerabili.txt", lines: ["openssh CVE-2024-6387", "sudo CVE-2023-22809", "xz CVE-2024-3094"] }, desc: "Unisci con vulnerabili.txt" },
            { cmd: "comm", args: { mode: "12", file: "vulnerabili.txt", lines: ["openssh CVE-2024-6387", "sudo CVE-2023-22809", "xz CVE-2024-3094"] }, desc: "In comune con vulnerabili.txt" },
            { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" },
            { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
        ]
},
    {
        id: 44,
        act: 8,
        title: "Chi Mangia la CPU",
        source: "ps aux",
        slots: 5,
        mission: "Sono le 3 di notte e il server web è al 100% di CPU. Trova i <strong>PID</strong> (la seconda colonna) dei processi <code>python3</code>, per fermarli con <code>kill</code>.",
        tutor: "Le colonne di ps sono allineate con gruppi di spazi: per cut ogni spazio è un separatore. tr -s ' ' comprime i gruppi in uno spazio solo, e allora il PID è davvero il campo 2.",
        man: ["tr", "cut"],
        stdin: [
            "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND",
            "root           1  0.0  0.1 167744 13088 ?        Ss   21:04   0:02 /sbin/init",
            "root         612  0.0  0.2 289316 18232 ?        Ssl  21:04   0:00 /usr/sbin/rsyslogd",
            "www-data     812  0.1  0.6 213120 52304 ?        S    21:04   0:12 nginx: worker process",
            "tommaso     4521 98.7 12.4 2954112 1015808 pts/2 R   01:12  41:07 python3 scraper.py",
            "tommaso     4533 97.9 11.8 2898344 968704 pts/3  R    01:13  40:51 python3 scraper.py",
            "backup      5100  0.3  0.1  10512  4096 ?        S    02:00   0:01 rsync -a /home /mnt/nas"
        ],
        target: ["4521", "4533"],
        nudge: "Le colonne di ps sono separate da gruppi di spazi: per cut ogni spazio è un separatore, anche quelli in fila.",
        hint: "Piano in 3 passi: 1) tieni le righe con python3, 2) tr -s ' ' comprime i gruppi di spazi in uno solo, 3) cut -d' ' -f2. Attenzione: senza tr -s, cut -f2 trova il vuoto tra due spazi.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "python3" }, desc: "Tieni le righe con 'python3'" },
            { cmd: "squeeze", args: { set: " " }, desc: "Comprimi gli spazi in fila" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
            { cmd: "sort", args: { numeric: true }, desc: "Ordine numerico" }
        ]
    },
    {
        id: 45,
        act: 8,
        title: "Disco Pieno",
        source: "du -sh /var/*",
        mission: "🚨 Il disco di <code>/var</code> è quasi pieno! Mostrami le <strong>tre cartelle più pesanti</strong>, dalla più grande, con la loro dimensione.",
        tutor: "sort -n legge solo il numero e ignora le unità: per lui 980M è più grande di 2.7G. sort -h sa che G viene dopo M.",
        man: ["sort"],
        stdin: ["4.0K\t/var/backups", "1.3G\t/var/cache", "48K\t/var/crash", "212M\t/var/lib", "4.0K\t/var/local", "2.7G\t/var/log", "980M\t/var/mail", "36K\t/var/tmp"],
        target: ["2.7G\t/var/log", "1.3G\t/var/cache", "980M\t/var/mail"],
        nudge: "du -h scrive le dimensioni con le unità: K, M, G. Per sort -n 980 è più di 2.7.",
        hint: "Piano in 2 passi: sort -hr ordina dalla più grande capendo le unità (G viene dopo M), poi head -n 3. Attenzione: sort -rn mette prima 980M di 2.7G.",
        allowedCommands: [
            { cmd: "sort", args: { human: true, reverse: true }, desc: "Dimensioni, dalla più grande" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numeri, dal più grande" },
            { cmd: "sort", args: { human: true }, desc: "Dimensioni, dalla più piccola" },
            { cmd: "head", args: { n: 3 }, desc: "Prime 3 righe" },
            { cmd: "tail", args: { n: 3 }, desc: "Ultime 3 righe" }
        ]
    },
    {
        id: 46,
        act: 8,
        title: "Due per Regola",
        source: "grep sshd /var/log/auth.log",
        slots: 6,
        mission: "Qualcuno prova a indovinare le password via SSH. Blocca gli IP dei tentativi <strong>falliti</strong>: il firewall vuole <strong>due IP per riga</strong>, in ordine e senza ripetizioni.",
        tutor: "L'IP non è sempre nello stesso campo («invalid user test» sposta tutto): sed lo prende per quello che c'è intorno («from ... port»). Poi xargs -n 2 mette due parole per riga.",
        man: ["xargs", "sed"],
        stdin: [
            "Nov  8 02:14:01 web sshd[811]: Failed password for root from 203.0.113.7 port 52211 ssh2",
            "Nov  8 02:15:22 web sshd[902]: Accepted publickey for marco from 192.0.2.10 port 40022 ssh2",
            "Nov  8 02:16:40 web sshd[930]: Failed password for admin from 198.51.100.23 port 61001 ssh2",
            "Nov  8 02:16:52 web sshd[811]: Failed password for root from 203.0.113.7 port 52213 ssh2",
            "Nov  8 02:17:02 web sshd[931]: Failed password for invalid user test from 203.0.113.99 port 33410 ssh2",
            "Nov  8 02:18:15 web sshd[944]: Failed password for root from 192.0.2.77 port 50120 ssh2"
        ],
        target: ["192.0.2.77 198.51.100.23", "203.0.113.7 203.0.113.99"],
        nudge: "L'IP viene sempre dopo «from», ma non è sempre nella stessa colonna: guarda il tentativo con «invalid user».",
        hint: "Piano in 5 passi: grep 'Failed', sed -E 's/.* from ([0-9.]+) .*/\\1/' tiene l'IP, sort, uniq, poi xargs -n 2 mette due parole per riga. Attenzione: awk '{print $11}' sbaglia con «invalid user test».",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "Failed" }, desc: "Tieni i tentativi falliti" },
            { cmd: "sed", args: { pattern: ".* from ([0-9.]+) .*", replacement: "\\1" }, desc: "Tieni l'IP dopo 'from'" },
            { cmd: "awk", args: { field: 11 }, desc: "Campo 11 di awk" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "xargs", args: { n: 2 }, desc: "Due parole per riga" },
            { cmd: "xargs", desc: "Tutto in una riga" }
        ]
    },
    {
        id: 47,
        act: 8,
        title: "Il Display del Rack",
        source: "cat /etc/motd",
                mission: "Il display del rack mostra <strong>16 caratteri</strong> per riga. Prepara l'avviso: spazi doppi tolti, a capo <strong>solo tra una parola e l'altra</strong> e niente spazio in fondo alle righe.",
        man: ["fold", "tr"],
        stdin: ["Manutenzione  stanotte alle 23:   zebra resta  spento fino alle 6"],
        target: ["Manutenzione", "stanotte alle", "23: zebra resta", "spento fino", "alle 6"],
        nudge: "fold -w spezza a 16 caratteri anche a metà parola; fold -s va a capo dopo l'ultimo spazio, che però resta in fondo alla riga.",
        hint: "Piano in 3 passi: 1) tr -s ' ' toglie gli spazi doppi, 2) fold -s -w 16 va a capo tra le parole, 3) sed -E 's/ $//' toglie lo spazio rimasto in fondo.",
        allowedCommands: [
            { cmd: "squeeze", args: { set: " " }, desc: "Comprimi gli spazi in fila" },
            { cmd: "fold", args: { width: 16 }, desc: "A capo ogni 16 caratteri" },
            { cmd: "fold", args: { width: 16, spaces: true }, desc: "A capo tra le parole (16)" },
            { cmd: "sed", args: { pattern: " $" }, desc: "Togli lo spazio in fondo" },
            { cmd: "cutc", args: { from: 1, to: 16 }, desc: "Primi 16 caratteri" }
        ]
    },
    {
        id: 48,
        act: 8,
        title: "Porte Aperte",
        source: "ss -Htln",
        slots: 7,
        mission: "Il firewall nuovo ha bisogno delle porte in ascolto <strong>raggiungibili da fuori</strong> (non quelle su 127.x), in ordine numerico, senza ripetizioni e <strong>in una riga sola</strong>.",
        tutor: "sed -E 's/.*://' è goloso: .* prende tutto fino all'ultimo «:», quindi funziona anche con [::]:22. cut -d':' -f2 su quell'indirizzo darebbe il vuoto.",
        man: ["xargs"],
        stdin: [
            "LISTEN 0      4096   127.0.0.53%lo:53         0.0.0.0:*",
            "LISTEN 0      511          0.0.0.0:80         0.0.0.0:*",
            "LISTEN 0      128          0.0.0.0:22         0.0.0.0:*",
            "LISTEN 0      511          0.0.0.0:443        0.0.0.0:*",
            "LISTEN 0      128             [::]:22            [::]:*",
            "LISTEN 0      244        127.0.0.1:5432       0.0.0.0:*",
            "LISTEN 0      4096            [::]:8080          [::]:*"
        ],
        target: ["22 80 443 8080"],
        nudge: "La porta è dopo l'ultimo «:» della quarta colonna. Occhio a [::]:22, che di «:» ne ha tre.",
        hint: "Piano in 6 passi: grep -v '127.0.0', awk '{print $4}', sed -E 's/.*://' tiene quello dopo l'ultimo «:», sort -n, uniq, xargs. Attenzione: cut -d':' -f2 su [::]:22 dà il vuoto.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "127.0.0", invert: true }, desc: "Scarta le righe con '127.0.0'" },
            { cmd: "awk", args: { field: 4 }, desc: "Campo 4 di awk" },
            { cmd: "sed", args: { pattern: ".*:" }, desc: "Togli fino all'ultimo ':'" },
            { cmd: "cut", args: { delim: ":", field: 2 }, desc: "Campo 2 (:)" },
            { cmd: "sort", args: { numeric: true }, desc: "Ordine numerico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "xargs", desc: "Tutto in una riga" },
            { cmd: "xargs", args: { n: 2 }, desc: "Due parole per riga" }
        ]
    },
    {
        id: 49,
        act: 8,
        title: "Unità di Misura",
        type: "quiz",
        mission: "Tommaso chiede: cosa stampa questa pipeline sulle dimensioni delle cartelle di <code>/home</code>?",
        stdin: ["900M\tmarco", "1.5G\tgiulia", "20K\ttommaso"],
        target: ["20K\ttommaso", "900M\tmarco", "1.5G\tgiulia"],
        nudge: "Con -h sort guarda prima l'unità (K, M, G) e poi il numero.",
        hint: "sort -h capisce le unità: K viene prima di M, che viene prima di G. Quindi 20K, 900M, 1.5G, dalla più piccola.",
        explain: "sort -h ordina dalla più piccola alla più grande capendo le unità: 20K < 900M < 1.5G. Con -n avrebbe guardato solo i numeri: 1.5 < 20 < 900.",
        allowedCommands: [
            { cmd: "sort", args: { human: true }, desc: "Dimensioni, dalla più piccola" }
        ],
        start: [1],
        wrong: [
            { steps: [{ cmd: "sort", args: { numeric: true } }], why: "Questo è l'ordine di sort -n: guarda solo i numeri (1.5, 20, 900) e ignora le unità." },
            { steps: [{ cmd: "sort", args: { human: true, reverse: true } }], why: "Questo è sort -hr, dalla più grande. Senza -r sort parte dalla più piccola." }
        ]
    },
    {
        id: 50,
        act: 8,
        title: "Boss Atto VIII",
        source: "df -h",
        slots: 7,
        mission: "🚨 Giulia vuole i <strong>punti di montaggio</strong> dei dischi NVMe, dal più grande al più piccolo, <strong>in una riga</strong>, per il rapporto della notte. Niente tmpfs, niente intestazione, e il NAS che non risponde non deve comparire.",
        man: ["sort", "xargs"],
        stdin: [
            { err: "df: /mnt/nas: Stale file handle" },
            "Filesystem      Size  Used Avail Use% Mounted on",
            "tmpfs           1.6G  2.1M  1.6G   1% /run",
            "/dev/nvme0n1p2  450G  301G  127G  71% /",
            "tmpfs           7.8G     0  7.8G   0% /dev/shm",
            "/dev/nvme0n1p1  511M  6.1M  505M   2% /boot/efi",
            "/dev/nvme1n1p1  1.8T  1.2T  540G  69% /srv",
            "/dev/nvme0n1p3   98G   41G   52G  45% /home"
        ],
        target: ["/srv / /home /boot/efi"],
        nudge: "La dimensione è la seconda colonna, scritta con le unità. Per ordinare su una colonna serve un separatore solo, non gruppi di spazi.",
        hint: "Piano in 6 passi: 2>/dev/null, grep '/dev/nvme', tr -s ' ', sort -rh -t' ' -k2,2, cut -d' ' -f6, xargs. Attenzione: grep '/dev/' prende anche /dev/shm, e sort -n mette 511M prima di 1.8T.",
        allowedCommands: [
            { cmd: "devnull", desc: "Cestina lo stderr" },
            { cmd: "grep", args: { pattern: "/dev/nvme" }, desc: "Tieni le righe con '/dev/nvme'" },
            { cmd: "grep", args: { pattern: "/dev/" }, desc: "Tieni le righe con '/dev/'" },
            { cmd: "squeeze", args: { set: " " }, desc: "Comprimi gli spazi in fila" },
            { cmd: "sort", args: { human: true, reverse: true, separator: " ", key: 2 }, desc: "Colonna 2, dalla più grande (-h)" },
            { cmd: "sort", args: { numeric: true, reverse: true, separator: " ", key: 2 }, desc: "Colonna 2, dal numero più grande (-n)" },
            { cmd: "cut", args: { delim: " ", field: 6 }, desc: "Campo 6 (spazio)" },
            { cmd: "xargs", desc: "Tutto in una riga" }
        ]
    },
    {
        id: 51,
        act: 9,
        title: "Il Conto in un Colpo",
        source: "grep sshd /var/log/auth.log",
        slots: 3,
        mission: "Quanti tentativi di accesso <strong>falliti</strong> ci sono stati stamattina? Solo il numero. Nadia giura che basta un comando solo.",
        man: ["grep"],
        stdin: [
            "Nov 10 08:01:12 web sshd[811]: Failed password for root from 203.0.113.7 port 52211 ssh2",
            "Nov 10 08:01:15 web sshd[811]: Failed password for root from 203.0.113.7 port 52213 ssh2",
            "Nov 10 08:02:40 web sshd[902]: Accepted publickey for nadia from 192.0.2.10 port 40022 ssh2",
            "Nov 10 08:03:05 web sshd[930]: Failed password for admin from 198.51.100.23 port 61001 ssh2",
            "Nov 10 08:05:33 web sshd[944]: Accepted password for marco from 192.0.2.12 port 40100 ssh2"
        ],
        target: ["3"],
        nudge: "Nella pagina man di grep c'è un'opzione che, invece delle righe, stampa quante sono.",
        hint: "grep -c 'Failed' conta le righe che contengono il testo: un comando solo, al posto di grep | wc -l.",
        tutor: "grep -c fa grep | wc -l in un colpo solo: conta le righe trovate invece di stamparle. Con -v conta quelle che NON contengono il testo.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "Failed", count: true }, desc: "Conta le righe con 'Failed'" },
            { cmd: "grep", args: { pattern: "Failed" }, desc: "Tieni le righe con 'Failed'" },
            { cmd: "grep", args: { pattern: "Accepted", count: true }, desc: "Conta le righe con 'Accepted'" },
            { cmd: "wc", desc: "Conta le righe" }
        ]
    },
    {
        id: 52,
        act: 9,
        title: "Maiuscole e Minuscole",
        source: "cat /var/log/app.log",
        mission: "Ogni servizio scrive gli avvisi a modo suo: <code>Warning</code>, <code>WARNING</code>, <code>warning</code>. Quali servizi hanno dato un avviso? Solo il nome, una volta, in ordine.",
        man: ["grep"],
        stdin: ["web: Warning disco quasi pieno", "db: WARNING replica in ritardo", "web: richiesta ok", "cache: warning memoria alta", "db: query lenta (warning)", "mail: tutto ok"],
        target: ["cache", "db", "web"],
        nudge: "grep distingue le maiuscole: c'è un'opzione per fargliele ignorare.",
        hint: "Piano in 4 passi: grep -i 'warning', cut -d':' -f1, sort, uniq. Attenzione: grep 'warning' senza -i perde web.",
        tutor: "grep -i (ignore case) tratta Warning, WARNING e warning come lo stesso testo, ma stampa le righe come sono: non le trasforma.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "warning", ignoreCase: true }, desc: "Righe con 'warning', maiuscole o no" },
            { cmd: "grep", args: { pattern: "warning" }, desc: "Righe con 'warning'" },
            { cmd: "grep", args: { pattern: "WARNING" }, desc: "Righe con 'WARNING'" },
            { cmd: "cut", args: { delim: ":", field: 1 }, desc: "Campo 1 (:)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 53,
        act: 9,
        title: "Parole Intere",
        source: "last -n 6",
        slots: 3,
        mission: "Quando si è collegata <code>ann</code>? Tieni le sue righe, e solo le sue: niente anna, joann o hannah.",
        man: ["grep"],
        stdin: [
            "ann      pts/0        192.0.2.30       Mon Nov 10 09:12   still logged in",
            "anna     pts/1        192.0.2.31       Mon Nov 10 09:05 - 09:40  (00:35)",
            "joann    pts/2        192.0.2.44       Mon Nov 10 08:58 - 09:01  (00:03)",
            "hannah   pts/3        192.0.2.52       Mon Nov 10 08:30 - 08:45  (00:15)",
            "ann      pts/1        192.0.2.30       Mon Nov 10 08:10 - 08:55  (00:45)",
            "wtmp begins Sat Nov  1 00:00:01 2026"
        ],
        target: ["ann      pts/0        192.0.2.30       Mon Nov 10 09:12   still logged in", "ann      pts/1        192.0.2.30       Mon Nov 10 08:10 - 08:55  (00:45)"],
        nudge: "grep trova «ann» anche dentro anna, joann e hannah. Nel manuale c'è un'opzione per le parole intere.",
        hint: "grep -w 'ann' tiene solo le righe dove ann è una parola intera. Attenzione: grep 'ann ' con lo spazio prende anche joann.",
        tutor: "grep -w vuole il testo come parola intera: prima e dopo non ci devono essere lettere, cifre o _. Così «ann» non vale dentro «joann».",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "ann", word: true }, desc: "Righe con la parola 'ann'" },
            { cmd: "grep", args: { pattern: "ann" }, desc: "Righe con 'ann'" },
            { cmd: "grep", args: { pattern: "ann " }, desc: "Righe con 'ann '" },
            { cmd: "grep", args: { pattern: "anna", invert: true }, desc: "Scarta le righe con 'anna'" }
        ]
    },
    {
        id: 54,
        act: 9,
        title: "La Prima Pagina",
        source: "cat accessi.csv",
        slots: 3,
        mission: "Il registro è <code>utente,ora,pagina</code>. Per ogni utente tieni <strong>la sua prima riga</strong> della mattina, con gli utenti in ordine di nome.",
        man: ["sort"],
        stdin: ["nadia,08:01,/home", "marco,08:03,/wiki", "nadia,08:05,/ticket", "giulia,08:07,/home", "marco,08:09,/report", "tommaso,08:12,/home", "nadia,08:20,/logout"],
        target: ["giulia,08:07,/home", "marco,08:03,/wiki", "nadia,08:01,/home", "tommaso,08:12,/home"],
        nudge: "sort -u toglie i doppioni; con una chiave (-t -k) per lui sono «uguali» le righe con la stessa chiave.",
        hint: "sort -t',' -k1,1 -u ordina per utente e di ogni utente tiene la prima riga. Attenzione: sort -u da solo guarda la riga intera, e qui sono tutte diverse.",
        tutor: "Con -u e una chiave, sort considera uguali le righe con la stessa chiave e ne tiene una sola: la prima, perché con -u l'ordinamento è stabile e le righe uguali restano nell'ordine in cui arrivano.",
        allowedCommands: [
            { cmd: "sort", args: { unique: true, separator: ",", key: 1 }, desc: "Per utente, una riga ciascuno (-u)" },
            { cmd: "sort", args: { separator: ",", key: 1 }, desc: "Per utente" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "head", args: { n: 4 }, desc: "Prime 4 righe" }
        ]
    },
    {
        id: 55,
        act: 9,
        title: "Una Volta Sola",
        source: "cat pacchetti-server.txt",
        mission: "L'inventario è <code>pacchetto server</code>. Quali pacchetti sono installati su <strong>un solo</strong> server? Solo il nome, in ordine.",
        man: ["uniq"],
        stdin: ["bash zebra", "curl zebra", "vim zebra", "bash mela", "htop mela", "vim mela", "bash gatto", "curl gatto", "nmap gatto", "vim gatto"],
        target: ["htop", "nmap"],
        nudge: "uniq -d tiene i ripetuti. Nella pagina man c'è anche l'opposto.",
        hint: "Piano in 3 passi: cut -d' ' -f1, sort, uniq -u (solo le righe che compaiono una volta). Attenzione: sort -u tiene ogni pacchetto una volta, anche quelli ripetuti.",
        tutor: "uniq -u tiene solo le righe senza doppioni vicini: dopo sort, sono quelle che compaiono una volta sola. -d e -u sono complementari: insieme danno tutto uniq.",
        allowedCommands: [
            { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "uniq", args: { unique: true }, desc: "Solo le righe uniche (-u)" },
            { cmd: "uniq", args: { repeated: true }, desc: "Solo i duplicati (-d)" }
        ]
    },
    {
        id: 56,
        act: 9,
        title: "Più Colonne",
        source: "getent passwd",
        mission: "Per l'audit servono <strong>nome utente e shell</strong>, separati da <code>:</code>, solo per chi può entrare (niente <code>nologin</code>).",
        man: ["cut"],
        stdin: ["root:x:0:0:root:/root:/bin/bash", "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin", "nadia:x:1001:1001:Nadia Russo:/home/nadia:/bin/bash", "tommaso:x:1002:1002:Tommaso:/home/tommaso:/bin/zsh", "backup:x:34:34:backup:/var/backups:/usr/sbin/nologin"],
        target: ["root:/bin/bash", "nadia:/bin/bash", "tommaso:/bin/zsh"],
        nudge: "cut può tenere più campi insieme: li elenchi separati da una virgola.",
        hint: "Piano in 2 passi: grep -v 'nologin', poi cut -d':' -f1,7 (campi 1 e 7, uniti dal separatore).",
        tutor: "cut -f1,7 tiene più campi: escono nell'ordine della riga, uniti dallo stesso separatore. Con -f2- tieni dal campo 2 in poi, con --complement tutto tranne i campi indicati.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "nologin", invert: true }, desc: "Scarta le righe con 'nologin'" },
            { cmd: "cut", args: { delim: ":", fields: "1,7" }, desc: "Campi 1 e 7 (:)" },
            { cmd: "cut", args: { delim: ":", field: 1 }, desc: "Campo 1 (:)" },
            { cmd: "cut", args: { delim: ":", field: 7 }, desc: "Campo 7 (:)" },
            { cmd: "cut", args: { delim: ":", fields: "1-7" }, desc: "Campi da 1 a 7 (:)" }
        ]
    },
    {
        id: 57,
        act: 9,
        title: "Tutto Tranne",
        type: "quiz",
        mission: "Tommaso deve mandare l'elenco degli utenti senza le password (il campo 2). Cosa stampa questa pipeline?",
        stdin: ["nadia,segreta,1001", "marco,1234,1002"],
        target: ["nadia,1001", "marco,1002"],
        nudge: "--complement capovolge la scelta dei campi.",
        hint: "cut --complement -f2 tiene tutti i campi tranne il 2: nome e numero, uniti dalla virgola.",
        explain: "Con --complement cut tiene tutto tranne i campi indicati: senza il campo 2 restano nome e numero, uniti dalla virgola.",
        allowedCommands: [
            { cmd: "cut", args: { delim: ",", field: 2, complement: true }, desc: "Tutto tranne il campo 2" }
        ],
        start: [1],
        wrong: [
            { steps: [{ cmd: "cut", args: { delim: ",", field: 2 } }], why: "Questo è cut -f2 senza --complement: tiene solo le password, l'opposto di quello che serve." },
            { steps: [{ cmd: "cut", args: { delim: ",", fields: "2-" } }], why: "Questo è cut -f2-: dal campo 2 in poi, quindi password comprese." }
        ]
    },
    {
        id: 58,
        act: 9,
        title: "L'SMS di Allarme",
        source: "cat allarme.txt",
        slots: 3,
        mission: "Il gateway SMS accetta al massimo 160 byte. Comprimi gli spazi doppi e dimmi <strong>quanti byte</strong> è il messaggio. Solo il numero.",
        man: ["wc", "tr"],
        stdin: ["ATTENZIONE:   disco /var al 97%,  servizio web   rallentato.", "Reperibile:  Nadia"],
        target: ["74"],
        nudge: "wc conta le righe con -l: nella pagina man ci sono anche parole e byte. E gli a capo contano.",
        hint: "Piano in 2 passi: tr -s ' ' comprime gli spazi, poi wc -c conta i byte (compresi gli a capo in fondo alle righe).",
        tutor: "wc -c conta i byte, non i caratteri: ogni a capo vale 1 byte e una lettera accentata ne vale 2. wc -w conta le parole, wc -l le righe.",
        allowedCommands: [
            { cmd: "squeeze", args: { set: " " }, desc: "Comprimi gli spazi in fila" },
            { cmd: "wcc", desc: "Conta i byte (-c)" },
            { cmd: "wcw", desc: "Conta le parole (-w)" },
            { cmd: "wc", desc: "Conta le righe" }
        ]
    },
    {
        id: 59,
        act: 9,
        title: "Boss Atto IX",
        source: "journalctl -u sshd --since '-7 days' -o cat",
        slots: 6,
        mission: "🚨 Il rapporto settimanale di Nadia: <strong>quanti utenti diversi</strong> hanno sbagliato l'accesso questa settimana? Ogni sistema scrive «failed» a modo suo. Solo il numero.",
        man: ["grep", "sort", "wc"],
        stdin: ["lun sshd: Failed login for marco", "lun sshd: Accepted login for giulia", "mar sshd: FAILED login for nadia", "mer sshd: failed login for marco", "gio sshd: Failed login for root", "gio sshd: Accepted login for nadia", "ven sshd: FAILED LOGIN for root", "sab sshd: failed login for tommaso"],
        target: ["4"],
        nudge: "Tre trappole: le maiuscole, gli utenti che sbagliano più volte e il conteggio di righe invece che di utenti.",
        hint: "Piano in 4 passi: grep -i 'failed', cut -d' ' -f6 (l'utente), sort -u, wc -l. Attenzione: grep -ic conta le righe sbagliate (6), non gli utenti.",
        tutor: "Tre opzioni del manuale insieme: grep -i per le maiuscole, sort -u per contare ogni utente una volta, e niente grep -c: conterebbe i tentativi, non le persone.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "failed", ignoreCase: true }, desc: "Righe con 'failed', maiuscole o no" },
            { cmd: "grep", args: { pattern: "failed", ignoreCase: true, count: true }, desc: "Conta le righe con 'failed' (-ic)" },
            { cmd: "grep", args: { pattern: "Failed" }, desc: "Righe con 'Failed'" },
            { cmd: "cut", args: { delim: " ", field: 6 }, desc: "Campo 6 (spazio)" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "wc", desc: "Conta le righe" },
            { cmd: "wcw", desc: "Conta le parole (-w)" }
        ]
    },
    {
        id: 60,
        act: 10,
        title: "L'Impronta",
        source: "cat server-attivi.txt",
        mission: "Giulia ha firmato l'elenco giusto dei server con <code>md5sum</code>. Rifai l'elenco (in ordine, senza doppioni) e calcolane l'impronta: deve uscire <strong>la stessa</strong>.",
        man: ["md5sum", "sort"],
        stdin: ["zebra", "mela", "gatto", "mela", "pesca", "zebra", "gatto"],
        target: ["8a6103ef5f7b45edc9ae0385add329e8  -"],
        nudge: "L'impronta cambia se cambia anche un solo carattere, l'ordine o una riga in più: prima l'elenco esatto, poi md5sum.",
        hint: "Piano in 2 passi: sort -u (in ordine, senza doppioni), poi md5sum. Anche sort | uniq | md5sum funziona, con un comando in più.",
        tutor: "md5sum calcola un'impronta di tutto quello che riceve: basta una riga in più, un ordine diverso o uno spazio per avere un'impronta completamente diversa. Per questo si usa per controllare che un file non sia cambiato.",
        allowedCommands: [
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", desc: "Rimuovi duplicati" },
            { cmd: "sort", args: { reverse: true }, desc: "Ordine inverso" },
            { cmd: "md5sum", desc: "Impronta MD5" }
        ]
    },
    {
        id: 61,
        act: 10,
        title: "Il File è Cambiato?",
        source: "cat /etc/app/app.conf",
        slots: 3,
        mission: "Ieri sera l'impronta <code>sha256sum</code> della configurazione <strong>senza le righe di commento</strong> era questa. Calcolala di nuovo: se è uguale, le modifiche di Tommaso toccano solo i commenti.",
        man: ["sha256sum", "grep"],
        stdin: ["# modificato da tommaso il 10/11", "porta=8080", "# TODO togliere la riga sotto?", "utente=www", "log=/var/log/app.log"],
        target: ["d138fbbfed241c1b9eb676aa2d22a527a8f6a5184bae64114e7a8434c631040a  -"],
        nudge: "Prima togli le righe di commento, poi calcola l'impronta del resto.",
        hint: "Piano in 2 passi: grep -v '#', poi sha256sum. Attenzione: md5sum dà un'impronta diversa, anche sullo stesso testo.",
        tutor: "sha256sum è come md5sum, ma con un'impronta più lunga e sicura: è quella che le distribuzioni usano per le ISO. Prima del calcolo si possono togliere le righe che non contano (qui i commenti).",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "#", invert: true }, desc: "Scarta le righe con '#'" },
            { cmd: "grep", args: { pattern: "#" }, desc: "Tieni le righe con '#'" },
            { cmd: "sha256sum", desc: "Impronta SHA-256" },
            { cmd: "md5sum", desc: "Impronta MD5" }
        ]
    },
    {
        id: 62,
        act: 10,
        title: "Caratteri Invisibili",
        source: "cut -d: -f1 /etc/passwd",
        slots: 3,
        mission: "Nella lista utenti la riga di <code>admin</code> sembra normale, ma lo script di backup non la trova. Mostra con <code>od -c</code> <strong>solo la riga di admin</strong>, per vedere cosa nasconde.",
        man: ["od", "grep"],
        stdin: ["nadia", "admin\t", "marco", "giulia"],
        target: ["0000000   a   d   m   i   n  \\t  \\n", "0000007"],
        nudge: "od -c mostra ogni byte: anche quelli che a schermo non si vedono, come tabulazioni e spazi in fondo.",
        hint: "Piano in 2 passi: grep 'admin', poi od -c. In fondo alla riga compare \\t: una tabulazione nascosta dopo il nome.",
        tutor: "od -c scrive ogni byte del flusso: le lettere come sono, la tabulazione come \\t, l'a capo come \\n. È il modo per scoprire spazi e caratteri invisibili che rompono gli script.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "admin" }, desc: "Tieni le righe con 'admin'" },
            { cmd: "od", desc: "Mostra ogni carattere (od -c)" },
            { cmd: "head", args: { n: 1 }, desc: "Prima riga" },
            { cmd: "sort", desc: "Ordine alfabetico" }
        ]
    },
    {
        id: 63,
        act: 10,
        title: "Byte per Byte",
        type: "quiz",
        mission: "Tommaso chiede: cosa stampa <code>od -c</code> per la riga <code>a b</code>?",
        stdin: ["a b"],
        target: ["0000000   a       b  \\n", "0000004"],
        nudge: "Ogni byte occupa un campo largo 4; lo spazio è un campo vuoto, l'a capo è \\n. In fondo c'è quanti byte sono, in ottale.",
        hint: "a, spazio, b, a capo: 4 byte. Lo spazio si vede come un campo vuoto, l'a capo come \\n; l'ultima riga è l'offset finale: 0000004.",
        explain: "od -c mostra a, uno spazio (campo vuoto), b e \\n: 4 byte, e l'ultima riga 0000004 è il numero di byte in ottale.",
        allowedCommands: [
            { cmd: "od", desc: "Mostra ogni carattere (od -c)" }
        ],
        start: [1],
        wrong: [
            { steps: [{ cmd: "tr", args: { from: " ", to: "_" } }, { cmd: "od" }], why: "Questo è l'output se lo spazio fosse un _: od -c mostra lo spazio come un campo vuoto, non con un simbolo." },
            { steps: [{ cmd: "wcc" }], why: "Questo è wc -c: conta i 4 byte, ma non li mostra uno per uno." }
        ]
    },
    {
        id: 64,
        act: 10,
        title: "Il Log di Ieri",
        source: "cat /var/log/syslog",
        slots: 3,
        mission: "Quante volte il kernel ha ucciso un processo per mancanza di memoria (<code>OOM</code>) <strong>ieri</strong>? Il log di ieri è compresso in <code>syslog.1.gz</code>. Solo il numero.",
        man: ["zcat", "grep"],
        stdin: ["Nov 10 08:00:01 web systemd[1]: Started backup.service", "Nov 10 08:15:22 web nginx[812]: reload ok", "Nov 10 09:02:10 web cron[501]: job ok"],
        target: ["2"],
        nudge: "Il log di oggi non c'entra: serve quello di ieri, che è compresso. C'è un comando che lo legge già decompresso.",
        hint: "Piano in 2 passi: zcat syslog.1.gz, poi grep -c 'OOM'. Attenzione: grep sul log di oggi dà 0.",
        tutor: "zcat legge un file compresso con gzip e lo manda nella pipe già decompresso, senza creare file. Così i log ruotati (.1.gz, .2.gz) si cercano come quelli normali. Ignora lo stdin.",
        allowedCommands: [
            { cmd: "zcat", args: { file: "syslog.1.gz", lines: ["Nov 09 03:12:44 web kernel: Out of memory: Killed process 4521 (python3)", "Nov 09 03:12:45 web kernel: oom_reaper: reaped process 4521", "Nov 09 07:40:01 web cron[501]: job ok", "Nov 09 22:05:13 web kernel: Out of memory: Killed process 6120 (java) OOM", "Nov 09 22:05:13 web kernel: OOM score adjusted"] }, desc: "Leggi syslog.1.gz decompresso" },
            { cmd: "grep", args: { pattern: "OOM", count: true }, desc: "Conta le righe con 'OOM'" },
            { cmd: "grep", args: { pattern: "OOM", ignoreCase: true, count: true }, desc: "Conta 'OOM', maiuscole o no (-ic)" },
            { cmd: "wc", desc: "Conta le righe" }
        ]
    },
    {
        id: 65,
        act: 10,
        title: "L'Archivio",
        source: "cat /var/log/auth.log",
        slots: 6,
        mission: "Il log di accesso di tre settimane fa è in <code>auth.log.3.xz</code>. Chi sbagliava la password allora? I nomi, in ordine, una volta ciascuno (i log scrivono «failed» come capita).",
        man: ["xzcat", "grep", "sort"],
        stdin: ["lun sshd: Accepted login for nadia", "mar sshd: Failed login for marco"],
        target: ["bruno", "root", "tommaso"],
        nudge: "Il log di oggi non serve: l'archivio è compresso con xz, e c'è un comando per leggerlo. Poi è un lavoro da Atto IX.",
        hint: "Piano in 4 passi: xzcat auth.log.3.xz, grep -i 'failed', cut -d' ' -f6, sort -u.",
        tutor: "zcat, bzcat e xzcat sono la stessa idea per tre compressori diversi (gzip, bzip2, xz): leggono il file e lo mandano decompresso nella pipe. Il resto è lo stesso lavoro di sempre.",
        allowedCommands: [
            { cmd: "xzcat", args: { file: "auth.log.3.xz", lines: ["lun sshd: FAILED login for root", "mar sshd: Accepted login for giulia", "mer sshd: failed login for bruno", "gio sshd: Failed login for root", "ven sshd: failed login for tommaso"] }, desc: "Leggi auth.log.3.xz decompresso" },
            { cmd: "grep", args: { pattern: "failed", ignoreCase: true }, desc: "Righe con 'failed', maiuscole o no" },
            { cmd: "grep", args: { pattern: "Failed" }, desc: "Righe con 'Failed'" },
            { cmd: "cut", args: { delim: " ", field: 6 }, desc: "Campo 6 (spazio)" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "sort", desc: "Ordine alfabetico" }
        ]
    },
    {
        id: 66,
        act: 10,
        title: "Chi Ha Toccato i File?",
        source: "md5sum /etc/app/*.conf",
        mission: "Oggi hai calcolato le impronte dei file di configurazione; in <code>ieri.md5</code> ci sono quelle di ieri (ordinate). Quali file sono <strong>cambiati</strong>? Solo il percorso, in ordine.",
        man: ["md5sum", "comm"],
        stdin: ["0b0d1f2a7c3e4d5f6a7b8c9d0e1f2a3b  /etc/app/app.conf", "5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b  /etc/app/cache.conf", "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d  /etc/app/db.conf", "1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f  /etc/app/mail.conf"],
        target: ["/etc/app/cache.conf", "/etc/app/db.conf"],
        nudge: "Un file è cambiato se la sua riga «impronta  percorso» di oggi non c'è nel file di ieri. comm vuole due elenchi ordinati, e md5sum ordina per nome, non per impronta.",
        hint: "Piano in 3 passi: sort, comm -23 - ieri.md5 (solo le righe di oggi), awk '{print $2}'. Attenzione: fra impronta e percorso ci sono due spazi, quindi cut -d' ' -f2 dà il vuoto.",
        tutor: "md5sum scrive «impronta, due spazi, nome del file». Confrontando le righe di oggi con quelle di ieri, quelle diverse sono i file cambiati: è il principio dei controlli d'integrità come AIDE.",
        allowedCommands: [
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "comm", args: { mode: "23", file: "ieri.md5", lines: ["0b0d1f2a7c3e4d5f6a7b8c9d0e1f2a3b  /etc/app/app.conf", "1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f  /etc/app/mail.conf", "7f7e7d7c7b7a79787776757473727170  /etc/app/cache.conf", "d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9  /etc/app/db.conf"] }, desc: "Solo le righe di oggi (comm -23)" },
            { cmd: "comm", args: { mode: "12", file: "ieri.md5", lines: ["0b0d1f2a7c3e4d5f6a7b8c9d0e1f2a3b  /etc/app/app.conf", "1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f  /etc/app/mail.conf", "7f7e7d7c7b7a79787776757473727170  /etc/app/cache.conf", "d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9  /etc/app/db.conf"] }, desc: "Le righe uguali (comm -12)" },
            { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" }
        ]
    },
    {
        id: 67,
        act: 10,
        title: "Boss Atto X",
        source: "dpkg-query -W -f '${Package} ${Version}\\n'",
        slots: 6,
        mission: "🚨 Il backup di stanotte ha salvato l'elenco dei pacchetti in <code>pacchetti.txt.gz</code>. Giulia ha firmato con <code>md5sum</code> l'elenco giusto: <strong>solo i nomi</strong>, in ordine, senza doppioni. L'elenco nel backup ha la stessa impronta?",
        man: ["zcat", "cut", "sort", "md5sum"],
        stdin: ["bash 5.2.21-2ubuntu4", "curl 8.5.0-2ubuntu10.6", "vim 2:9.1.0016-1ubuntu7.5"],
        target: ["bb219e73a6f4b21b1ee1e8111b0ad646  -"],
        nudge: "L'elenco di oggi (stdin) non c'entra: serve quello del backup, compresso. Poi i nomi, l'ordine, i doppioni e l'impronta.",
        hint: "Piano in 4 passi: zcat pacchetti.txt.gz, cut -d' ' -f1, sort -u, md5sum. Attenzione: sha256sum dà un'impronta diversa da quella di Giulia.",
        tutor: "Il cerchio si chiude: zcat legge il backup compresso, cut e sort -u preparano l'elenco esatto, md5sum lo confronta con l'impronta firmata. Se anche un solo nome mancasse, l'impronta sarebbe diversa.",
        allowedCommands: [
            { cmd: "zcat", args: { file: "pacchetti.txt.gz", lines: ["vim 2:9.1.0016-1ubuntu7.4", "bash 5.2.21-2ubuntu4", "curl 8.5.0-2ubuntu10.5", "openssh-server 1:9.6p1-3ubuntu13.5", "bash 5.2.21-2ubuntu3", "nginx 1.24.0-2ubuntu7.1"] }, desc: "Leggi pacchetti.txt.gz decompresso" },
            { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
            { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "md5sum", desc: "Impronta MD5" },
            { cmd: "sha256sum", desc: "Impronta SHA-256" }
        ]
    },
    {
        id: 68,
        act: 11,
        title: "O l'Uno o l'Altro",
        source: "journalctl -o cat",
        slots: 3,
        mission: "La nuova regola del monitoraggio deve tenere le righe <strong>ERROR</strong> e anche quelle <strong>CRIT</strong>, con un grep solo.",
        man: ["regex", "grep"],
        stdin: ["INFO avvio completato", "ERROR disco pieno su /var", "WARN memoria al 85%", "CRIT database non risponde", "INFO backup ok", "ERROR timeout rete", "error di battitura nel log"],
        target: ["ERROR disco pieno su /var", "CRIT database non risponde", "ERROR timeout rete"],
        nudge: "Con grep normale | è un carattere come gli altri. Con le espressioni estese vuol dire «oppure».",
        hint: "Piano in 1 passo: grep -E 'ERROR|CRIT'. Attenzione: grep 'ERROR|CRIT' senza -E cerca proprio il testo «ERROR|CRIT».",
        tutor: "Con -E il carattere | separa due alternative: la riga passa se contiene l'una o l'altra. Senza -E grep cerca il testo letterale «ERROR|CRIT», che non c'è da nessuna parte.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "ERROR|CRIT" }, desc: "ERROR oppure CRIT (-E)" },
            { cmd: "grep", args: { pattern: "ERROR|CRIT" }, desc: "Il testo 'ERROR|CRIT'" },
            { cmd: "grep", args: { pattern: "ERROR" }, desc: "Righe con 'ERROR'" },
            { cmd: "grep", args: { pattern: "error", ignoreCase: true }, desc: "'error', maiuscole o no" }
        ]
    },
    {
        id: 69,
        act: 11,
        title: "Badge Validi",
        source: "cut -d',' -f2 badge.csv",
        mission: "Un codice badge valido è fatto di <strong>esattamente 6 cifre</strong>, niente altro. Elenca i codici validi, in ordine, una volta ciascuno.",
        man: ["regex", "sort"],
        stdin: ["104523", "10452", "104523", "A04523", "1045230", "200871", "20087l", "200871", "330012"],
        target: ["104523", "200871", "330012"],
        nudge: "Le cifre devono essere 6, né 5 né 7, e la riga non deve contenere altro: serve dire dove inizia e dove finisce.",
        hint: "Piano in 2 passi: grep -E '^[0-9]{6}$' (^ e $ bloccano la riga intera, {6} vuole 6 cifre), poi sort -u.",
        tutor: "^ è l'inizio della riga e $ la fine: insieme dicono «tutta la riga». Senza di loro, [0-9]{6} trova 6 cifre anche dentro 1045230, che ne ha 7. Attenzione al codice 20087l: l'ultima è una elle, non un 1.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "^[0-9]{6}$" }, desc: "Solo 6 cifre, tutta la riga" },
            { cmd: "grepe", args: { pattern: "[0-9]{6}" }, desc: "6 cifre di fila" },
            { cmd: "grepe", args: { pattern: "^[0-9]+$" }, desc: "Solo cifre, quante vuoi" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "sort", desc: "Ordine alfabetico" }
        ]
    },
    {
        id: 70,
        act: 11,
        title: "Gli Indirizzi IP",
        source: "grep sshd /var/log/auth.log",
        mission: "Da quali <strong>indirizzi IP</strong> hanno sbagliato la password? Solo gli indirizzi, in ordine, una volta ciascuno.",
        man: ["regex", "grep"],
        stdin: ["Nov 11 01:10:22 web sshd[700]: Failed password for root from 203.0.113.7 port 52211 ssh2", "Nov 11 01:12:05 web sshd[702]: Accepted publickey for nadia from 10.0.0.21 port 50122 ssh2", "Nov 11 01:13:40 web sshd[704]: Failed password for marco from 10.0.0.30 port 50300 ssh2", "Nov 11 01:15:01 web sshd[706]: Failed password for root from 203.0.113.7 port 52299 ssh2"],
        target: ["10.0.0.30", "203.0.113.7"],
        nudge: "Prima le righe giuste, poi solo il pezzo che ha la forma di un indirizzo: quattro numeri separati da punti veri.",
        hint: "Piano in 3 passi: grep 'Failed', grep -Eo '([0-9]{1,3}\\.){3}[0-9]{1,3}', sort -u. Attenzione: [0-9.]+ prende anche le porte e gli orari.",
        tutor: "([0-9]{1,3}\\.){3}[0-9]{1,3} vuol dire: un numero da 1 a 3 cifre seguito da un punto vero, tre volte, e poi un altro numero. Con -o grep stampa solo quel pezzo. [0-9.]+ invece prende qualunque fila di cifre e punti: porte, ore, pid.",
        allowedCommands: [
            { cmd: "grep", args: { pattern: "Failed" }, desc: "Righe con 'Failed'" },
            { cmd: "grepe", args: { pattern: "([0-9]{1,3}\\.){3}[0-9]{1,3}", only: true }, desc: "Solo gli indirizzi IP (-o)" },
            { cmd: "grepe", args: { pattern: "[0-9.]+", only: true }, desc: "Solo cifre e punti (-o)" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "uniq", desc: "Rimuovi duplicati" }
        ]
    },
    {
        id: 71,
        act: 11,
        title: "Facoltativo",
        type: "quiz",
        mission: "Nadia chiede: cosa stampa <code>grep -E '^colou?r$'</code> su queste quattro righe?",
        stdin: ["color", "colour", "colouur", "colr"],
        target: ["color", "colour"],
        nudge: "? rende facoltativo solo il carattere che ha subito prima: la u può esserci una volta o nessuna.",
        hint: "u? vuol dire «zero o una u»: vanno bene color e colour. colouur ha due u, colr non ha la o.",
        explain: "u? accetta zero o una u: passano color e colour. Con * passerebbe anche colouur, con + colour e colouur; colr non ha la o, che non è facoltativa.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "^colou?r$" }, desc: "u facoltativa (?)" }
        ],
        start: [1],
        wrong: [
            { steps: [{ cmd: "grepe", args: { pattern: "^colou*r$" } }], why: "Questo è u*: zero o più u, quindi passa anche colouur. ? vuol dire al massimo una." },
            { steps: [{ cmd: "grepe", args: { pattern: "^colou+r$" } }], why: "Questo è u+: una o più u, quindi color non passa. ? accetta anche nessuna u." }
        ]
    },
    {
        id: 72,
        act: 11,
        title: "Configurazione Pulita",
        source: "cat /etc/pipeco/app.conf",
        slots: 3,
        mission: "Giulia vuole solo le <strong>righe utili</strong> della configurazione: niente commenti (anche quelli rientrati) e niente righe vuote o fatte solo di spazi.",
        man: ["regex", "grep"],
        stdin: ["# app.conf della Pipe & Co.", "", "porta = 8080", "    # porta vecchia: 80", "utente = pipeco", "   ", "log = /var/log/app#1.log", "\t# fine sezione", "debug = no"],
        target: ["porta = 8080", "utente = pipeco", "log = /var/log/app#1.log", "debug = no"],
        nudge: "Una riga è da scartare se, dopo eventuali spazi all'inizio, arriva un # oppure la fine della riga. Con -v si scartano quelle che corrispondono.",
        hint: "Piano in 1 passo: grep -Ev '^[[:space:]]*(#|$)'. Attenzione: grep -v '#' scarta anche il log app#1.log, che è una riga utile.",
        tutor: "^[[:space:]]* è «dall'inizio, quanti spazi e tabulazioni vuoi», poi (#|$) è «un cancelletto oppure la fine della riga». Così si scartano i commenti rientrati e le righe vuote, ma non un # in mezzo a un valore.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "^[[:space:]]*(#|$)", invert: true }, desc: "Scarta commenti e righe vuote (-v)" },
            { cmd: "grepe", args: { pattern: "^#", invert: true }, desc: "Scarta le righe che iniziano con #" },
            { cmd: "grep", args: { pattern: "#", invert: true }, desc: "Scarta le righe con '#'" },
            { cmd: "grepe", args: { pattern: "^$", invert: true }, desc: "Scarta le righe vuote" }
        ]
    },
    {
        id: 73,
        act: 11,
        title: "Le Date",
        source: "cat ordini.txt",
        slots: 3,
        mission: "Negli appunti degli ordini le date sono scritte come capita. Estrai solo quelle nel formato <code>AAAA-MM-GG</code>, in ordine, una volta ciascuna.",
        man: ["regex", "sort"],
        stdin: ["ordine 51 del 2026-11-03, consegna 2026-11-10", "ordine 52 del 11/11/2026 (da correggere)", "ordine 53 del 2026-11-03, tel 333-123-4567", "ordine 54 del 2026-11-11 qta 12-24"],
        target: ["2026-11-03", "2026-11-10", "2026-11-11"],
        nudge: "Una data è: 4 cifre, trattino, 2 cifre, trattino, 2 cifre. Le classi POSIX per le cifre si scrivono con due parentesi quadre.",
        hint: "Piano in 2 passi: grep -Eo '[[:digit:]]{4}-[[:digit:]]{2}-[[:digit:]]{2}', poi sort -u. Attenzione: [0-9-]+ prende anche il telefono e le quantità.",
        tutor: "[[:digit:]] è la classe POSIX delle cifre, come [0-9]. {4} e {2} contano quante cifre servono, e così 333-123-4567 e 12-24 non hanno la forma giusta. 11/11/2026 usa le barre: non è nel formato richiesto.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "[[:digit:]]{4}-[[:digit:]]{2}-[[:digit:]]{2}", only: true }, desc: "Solo le date AAAA-MM-GG (-o)" },
            { cmd: "grepe", args: { pattern: "[0-9-]+", only: true }, desc: "Solo cifre e trattini (-o)" },
            { cmd: "sort", args: { unique: true }, desc: "Ordina senza doppioni (-u)" },
            { cmd: "sort", desc: "Ordine alfabetico" }
        ]
    },
    {
        id: 74,
        act: 11,
        title: "La Privacy",
        source: "cat pagamenti.log",
        slots: 3,
        mission: "Il log dei pagamenti va mandato all'assistenza, ma senza i numeri delle carte. Tieni solo le righe con un numero di carta (<strong>16 cifre</strong>) e copri le prime 12 cifre con <code>X</code>: si vedono solo le ultime 4.",
        man: ["sed", "regex"],
        stdin: ["10:01 anna carta 4111222233334444 ok", "10:05 marco bonifico 120 euro", "10:07 luca carta 5500111122223333 ok", "10:09 eva ordine 2026111100001", "10:12 eva carta rifiutata"],
        target: ["10:01 anna carta XXXXXXXXXXXX4444 ok", "10:07 luca carta XXXXXXXXXXXX3333 ok"],
        nudge: "Prima le righe con 16 cifre di fila; poi una sostituzione che prende 12 cifre, la prima volta che compaiono.",
        hint: "Piano in 2 passi: grep -E '[[:digit:]]{16}', poi sed -E 's/[[:digit:]]{12}/XXXXXXXXXXXX/'. Attenzione: con [[:digit:]] e g sparirebbero anche gli orari.",
        tutor: "[[:digit:]]{16} trova le righe con almeno 16 cifre di fila: l'ordine di eva ne ha 13 e resta fuori. In sed, [[:digit:]]{12} prende le prime 12 cifre della carta (la corrispondenza più a sinistra), e le ultime 4 restano.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "[[:digit:]]{16}" }, desc: "Righe con 16 cifre di fila" },
            { cmd: "grepe", args: { pattern: "carta" }, desc: "Righe con 'carta'" },
            { cmd: "sed", args: { pattern: "[[:digit:]]{12}", replacement: "XXXXXXXXXXXX" }, desc: "Copri 12 cifre di fila" },
            { cmd: "sed", args: { pattern: "[[:digit:]]", replacement: "X", global: true }, desc: "Copri ogni cifra (g)" }
        ]
    },
    {
        id: 75,
        act: 11,
        title: "Boss Atto XI",
        source: "grep sshd /var/log/auth.log",
        slots: 6,
        mission: "La regola finale dell'allarme: quali IP hanno sbagliato la password <strong>o</strong> provato un utente che non esiste (<code>Invalid user</code>), e quante volte? Conteggio e IP, dal più insistente.",
        man: ["regex", "uniq", "sort"],
        stdin: [
            "Nov 11 02:01:10 web sshd[901]: Failed password for root from 203.0.113.7 port 52211 ssh2",
            "Nov 11 02:01:30 web sshd[902]: Invalid user test from 198.51.100.23 port 40011",
            "Nov 11 02:02:40 web sshd[905]: Accepted publickey for nadia from 10.0.0.21 port 50122 ssh2",
            "Nov 11 02:03:01 web sshd[907]: Failed password for marco from 10.0.0.30 port 50300 ssh2",
            "Nov 11 02:03:12 web sshd[908]: Invalid user admin from 203.0.113.7 port 52213",
            "Nov 11 02:03:19 web sshd[909]: Failed password for invalid user test from 198.51.100.23 port 40013 ssh2",
            "Nov 11 02:04:00 web sshd[910]: Connection closed by 10.0.0.21 port 50122",
            "Nov 11 02:04:20 web sshd[911]: Invalid user oracle from 198.51.100.23 port 40090"
        ],
        target: ["      3 198.51.100.23", "      2 203.0.113.7", "      1 10.0.0.30"],
        nudge: "Due tipi di riga, un grep solo con l'alternativa; poi solo l'indirizzo; poi conta e metti in classifica.",
        hint: "Piano in 5 passi: grep -E 'Failed|Invalid', grep -Eo l'indirizzo IP, sort, uniq -c, sort -rn. Attenzione: con grep 'Failed' perdi gli utenti inesistenti.",
        tutor: "L'alternativa Failed|Invalid tiene i due tipi di attacco con un grep solo; la regex dell'IP con -o lascia solo l'indirizzo (non le porte né gli orari); sort | uniq -c | sort -rn è la classifica dell'Atto II.",
        allowedCommands: [
            { cmd: "grepe", args: { pattern: "Failed|Invalid" }, desc: "Failed oppure Invalid (-E)" },
            { cmd: "grep", args: { pattern: "Failed" }, desc: "Righe con 'Failed'" },
            { cmd: "grepe", args: { pattern: "([0-9]{1,3}\\.){3}[0-9]{1,3}", only: true }, desc: "Solo gli indirizzi IP (-o)" },
            { cmd: "grepe", args: { pattern: "[0-9.]+", only: true }, desc: "Solo cifre e punti (-o)" },
            { cmd: "sort", desc: "Ordine alfabetico" },
            { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati (-c)" },
            { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Ordine numerico inverso" }
        ]
    }
];
