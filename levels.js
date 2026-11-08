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
    }
];
