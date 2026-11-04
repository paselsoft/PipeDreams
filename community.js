// Galleria della community: livelli proposti con il link dell'editor e scelti per il gioco.
// Per aggiungerne uno: node tools/add-community-level.js '<link del livello>' 'Autore'
// (convalida il livello come un link condiviso e lo verifica con bash). Dal più recente.
const COMMUNITY_LEVELS = [
    {
        id: "c-conto-alla-rovescia",
        author: "Irene",
        added: "2026-11-04",
        level: {
            title: "Conto alla Rovescia",
            mission: "Il razzo del laboratorio parte tra poco. Fai il conto alla rovescia: solo i numeri, dal <code>10</code> all'<code>1</code>.",
            nudge: "Le righe sono già in fila, solo nel verso sbagliato.",
            hint: "Due comandi: tac rovescia le righe, cut tiene il numero. Attenzione: sort -r ordina come testo, e '9' viene dopo '10'.",
            stdin: ["1 uno", "2 due", "3 tre", "4 quattro", "5 cinque", "6 sei", "7 sette", "8 otto", "9 nove", "10 dieci"],
            target: ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
            allowedCommands: [
                { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
                { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
                { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
                { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
                { cmd: "head", args: { n: 5 }, desc: "Prendi i primi 5" }
            ]
        }
    },
    {
        id: "c-domini-spam",
        author: "Giulia",
        added: "2026-11-04",
        level: {
            title: "Da Dove Arriva lo Spam?",
            mission: "Il filtro antispam ha raccolto questi mittenti. Da quanti <strong>domini diversi</strong> arrivano?",
            nudge: "Il dominio è quello che c'è dopo la chiocciola.",
            hint: "Quattro comandi: cut -d'@' -f2, sort, uniq, wc -l. Attenzione: senza sort, uniq non vede i domini lontani.",
            stdin: ["offerte@promo.biz", "vinci@lotteria.xyz", "info@promo.biz", "capo@azienda.it", "premio@lotteria.xyz", "news@promo.biz", "saldi@sconti.shop"],
            target: ["4"],
            allowedCommands: [
                { cmd: "cut", args: { delim: "@", field: 1 }, desc: "Campo 1 (@)" },
                { cmd: "cut", args: { delim: "@", field: 2 }, desc: "Campo 2 (@)" },
                { cmd: "sort", desc: "Ordine alfabetico" },
                { cmd: "uniq", desc: "Rimuovi duplicati" },
                { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
                { cmd: "wc", desc: "Conta le righe" }
            ]
        }
    },
    {
        id: "c-turni-weekend",
        author: "Marco",
        added: "2026-11-04",
        level: {
            title: "Il Re dei Turni",
            slots: 6,
            mission: "Ogni riga è <code>giorno ora persona</code>. Chi ha fatto più turni di reperibilità nel weekend? Mostra <code>uniq -c</code> del primo in classifica.",
            nudge: "Ti serve solo la persona, poi una classifica.",
            hint: "Piano in 5 passi: estrai la persona (awk campo 3), sort, uniq -c, sort -rn, head -n 1.",
            stdin: ["sab 08:00 marco", "sab 14:00 giulia", "sab 20:00 marco", "dom 08:00 tommaso", "dom 14:00 marco", "dom 20:00 giulia"],
            target: ["      3 marco"],
            allowedCommands: [
                { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                { cmd: "sort", desc: "Ordine alfabetico" },
                { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
                { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
                { cmd: "head", args: { n: 1 }, desc: "Prendi il primo" },
                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultimo" }
            ]
        }
    },
    {
        id: "c-iniziali",
        author: "Tommaso",
        added: "2026-11-04",
        level: {
            title: "Le Iniziali",
            mission: "Sto preparando i badge con le iniziali. Quali <strong>iniziali</strong> servono, in maiuscolo, in ordine alfabetico e senza ripetizioni?",
            nudge: "L'iniziale è il primo carattere del nome.",
            hint: "Quattro comandi: cut -c1, tr 'a-z' 'A-Z', sort, uniq (maiuscolo e iniziale si possono scambiare).",
            stdin: ["marco", "anna", "giulia", "andrea", "tommaso", "matteo", "irene"],
            target: ["A", "G", "I", "M", "T"],
            allowedCommands: [
                { cmd: "cutc", args: { from: 1, to: 1 }, desc: "Carattere 1" },
                { cmd: "cutc", args: { from: 1, to: 2 }, desc: "Caratteri 1-2" },
                { cmd: "tr", args: { from: "a-z", to: "A-Z" }, desc: "Minuscole → maiuscole" },
                { cmd: "sort", desc: "Ordine alfabetico" },
                { cmd: "uniq", desc: "Rimuovi duplicati" },
                { cmd: "uniq", args: { repeated: true }, desc: "Solo le righe ripetute" }
            ]
        }
    },
    {
        id: "c-ricette",
        author: "Irene",
        added: "2026-11-04",
        level: {
            title: "La Torta di Irene",
            mission: "Ogni riga è <code>ingrediente grammi</code>. Elenca solo gli ingredienti, dal più abbondante al meno abbondante.",
            nudge: "Si ordina per il secondo campo, come numero; poi resta solo il nome.",
            hint: "Due comandi: sort -rn -t' ' -k2,2, poi cut -d' ' -f1. Attenzione: sort -rn sulla riga intera guarda il nome.",
            stdin: ["farina 500", "uova 3", "zucchero 200", "burro 100", "latte 250"],
            target: ["farina", "latte", "zucchero", "burro", "uova"],
            allowedCommands: [
                { cmd: "sort", args: { numeric: true, reverse: true, separator: " ", key: 2 }, desc: "Campo 2, numerico decrescente" },
                { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Riga intera, numerico decrescente" },
                { cmd: "sort", args: { reverse: true, separator: " ", key: 2 }, desc: "Campo 2, testo decrescente" },
                { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
                { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" }
            ]
        }
    }
];
