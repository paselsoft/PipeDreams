// Casi a puntate: gialli divisi in capitoli. Ogni capitolo ha un racconto, uno o più enigmi
// (livelli "componi" con lo stdout atteso nascosto: il risultato è l'indizio da scoprire) e una
// domanda di deduzione. Si sbloccano un capitolo alla volta; release (AAAA-MM-GG) facoltativa
// rimanda un capitolo a una data. requiresAct: atto della campagna da completare prima.
// Dopo ogni modifica: node tools/check-stories.js
const STORIES = [
    {
        id: "server-fantasma",
        title: "Il server fantasma",
        synopsis: "Ogni notte, alle 3:14 precise, spariscono dei backup dal server gufo. Nessuno era in ufficio. Un fantasma?",
        requiresAct: 3,
        epilogue: "Marco spegne il vecchio portatile in magazzino, Giulia disattiva l'account di Bruno e chiama Bruno per raccontargli tutto. Lui ride: «Quello script! Dovevo toglierlo quando è arrivato il nuovo sistema di backup.» Da quella notte, alle 3:14, sul server gufo non succede più niente. Il fantasma era solo una riga dimenticata in un crontab.",
        chapters: [
            {
                id: "le-3-14",
                title: "Le 3:14",
                from: "Giulia",
                text: "Da una settimana, ogni mattina, mancano dei backup sul server gufo. Il registro dice che spariscono sempre alle 3:14, quando in ufficio non c'è nessuno. Ho estratto il log degli accessi ssh: comincia da lì.",
                puzzles: [
                    {
                        id: "chi",
                        clue: "Chi entra alle 03:14",
                        level: {
                            title: "Accessi Notturni",
                            source: "grep sshd /var/log/auth.log",
                            mission: "Chi entra con successo nel server alle <code>03:14</code>? Ottieni il nome utente, <strong>una volta sola</strong>.",
                            nudge: "Le righe delle 03:14 hanno tutte la stessa forma: conta i campi fino al nome.",
                            hint: "Tieni le righe con 03:14, poi il nome è il campo 9 (awk '{print $9}'), poi togli le ripetizioni (uniq, oppure head -n 1).",
                            stdin: [
                                "Nov 01 22:10:03 gufo sshd: Accepted password for marco from 10.0.0.12",
                                "Nov 02 03:14:01 gufo sshd: Accepted publickey for bruno from 10.0.0.42",
                                "Nov 02 09:00:12 gufo sshd: Accepted password for giulia from 10.0.0.15",
                                "Nov 02 09:30:40 gufo sshd: Failed password for root from 203.0.113.7",
                                "Nov 03 03:14:02 gufo sshd: Accepted publickey for bruno from 10.0.0.42",
                                "Nov 03 10:11:00 gufo sshd: Accepted password for tommaso from 10.0.0.20",
                                "Nov 04 03:14:01 gufo sshd: Accepted publickey for bruno from 10.0.0.42"
                            ],
                            target: ["bruno"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "03:14" }, desc: "Tieni le righe con '03:14'" },
                                { cmd: "grep", args: { pattern: "Failed" }, desc: "Tieni le righe con 'Failed'" },
                                { cmd: "awk", args: { field: 9 }, desc: "Campo 9 di awk" },
                                { cmd: "awk", args: { field: 11 }, desc: "Campo 11 di awk" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" },
                                { cmd: "wc", desc: "Conta le righe" }
                            ]
                        }
                    },
                    {
                        id: "da-dove",
                        clue: "Da quale indirizzo",
                        level: {
                            title: "Da Dove?",
                            source: "grep sshd /var/log/auth.log",
                            mission: "E da quale <strong>indirizzo IP</strong> arrivano gli accessi delle <code>03:14</code>? Una riga sola.",
                            nudge: "L'indirizzo è l'ultimo campo della riga.",
                            hint: "Tieni le righe con 03:14, poi l'indirizzo è il campo 11 di awk, poi togli le ripetizioni.",
                            stdin: [
                                "Nov 01 22:10:03 gufo sshd: Accepted password for marco from 10.0.0.12",
                                "Nov 02 03:14:01 gufo sshd: Accepted publickey for bruno from 10.0.0.42",
                                "Nov 02 09:00:12 gufo sshd: Accepted password for giulia from 10.0.0.15",
                                "Nov 02 09:30:40 gufo sshd: Failed password for root from 203.0.113.7",
                                "Nov 03 03:14:02 gufo sshd: Accepted publickey for bruno from 10.0.0.42",
                                "Nov 03 10:11:00 gufo sshd: Accepted password for tommaso from 10.0.0.20",
                                "Nov 04 03:14:01 gufo sshd: Accepted publickey for bruno from 10.0.0.42"
                            ],
                            target: ["10.0.0.42"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "03:14" }, desc: "Tieni le righe con '03:14'" },
                                { cmd: "grep", args: { pattern: "Failed" }, desc: "Tieni le righe con 'Failed'" },
                                { cmd: "awk", args: { field: 9 }, desc: "Campo 9 di awk" },
                                { cmd: "awk", args: { field: 11 }, desc: "Campo 11 di awk" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" },
                                { cmd: "sort", desc: "Ordine alfabetico" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Bruno ha lasciato la Pipe & Co. a settembre. Cosa ti dicono gli indizi?",
                    options: [
                        "Qualcuno usa ancora l'account di Bruno, sempre alla stessa ora e dallo stesso indirizzo interno",
                        "Bruno entra da internet con una password rubata",
                        "È root che entra di nascosto ogni notte",
                        "Sono gli accessi di Tommaso, che lavora di notte"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "10.0.0.42 è un indirizzo interno, non di internet; e l'accesso è con chiave, non con password.",
                        "root ha solo un tentativo fallito, di giorno e da internet.",
                        "Tommaso entra alle 10:11, dal suo indirizzo 10.0.0.20."
                    ],
                    explain: "Stesso utente, stessa ora quasi al secondo, stesso indirizzo interno: sembra più un automatismo che una persona."
                }
            },
            {
                id: "cosa-sparisce",
                title: "Cosa sparisce",
                from: "Marco",
                text: "Ho attivato il registro delle cancellazioni del server gufo. Stanotte alle 3:14 il fantasma è tornato. Vediamo cosa ha cancellato, e quanto.",
                puzzles: [
                    {
                        id: "quanti",
                        clue: "File cancellati alle 03:14",
                        level: {
                            title: "Quanti File?",
                            source: "ausearch -k cancellazioni",
                            mission: "Quanti file sono stati cancellati alle <code>03:14</code>?",
                            nudge: "Ogni cancellazione è una riga.",
                            hint: "Tieni le righe con 03:14 e contale (wc -l).",
                            stdin: [
                                "09:12:00 rm /home/tommaso/tmp/prova.txt",
                                "03:14:05 rm /srv/backup/backup-2026-10-29.tar",
                                "03:14:05 rm /srv/backup/backup-2026-10-30.tar",
                                "11:40:31 rm /var/log/vecchio.log",
                                "03:14:06 rm /srv/backup/backup-2026-10-31.tar",
                                "03:14:06 rm /srv/backup/backup-2026-11-01.tar",
                                "16:02:10 rm /home/giulia/bozza-slide.odp"
                            ],
                            target: ["4"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "03:14" }, desc: "Tieni le righe con '03:14'" },
                                { cmd: "grep", args: { pattern: "03:14", invert: true }, desc: "Scarta le righe con '03:14'" },
                                { cmd: "wc", desc: "Conta le righe" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" },
                                { cmd: "head", args: { n: 2 }, desc: "Prendi le prime 2" }
                            ]
                        }
                    },
                    {
                        id: "quali",
                        clue: "Tipo di file cancellati alle 03:14",
                        level: {
                            title: "Che File Sono?",
                            source: "ausearch -k cancellazioni",
                            mission: "Che <strong>tipo</strong> di file sparisce alle <code>03:14</code>? Ottieni l'estensione, una volta sola.",
                            nudge: "L'estensione è dopo il punto, e i nomi delle 03:14 hanno un punto solo.",
                            hint: "Tieni le righe con 03:14, poi il campo 2 separato dal punto (cut -d'.' -f2), poi togli le ripetizioni.",
                            stdin: [
                                "09:12:00 rm /home/tommaso/tmp/prova.txt",
                                "03:14:05 rm /srv/backup/backup-2026-10-29.tar",
                                "03:14:05 rm /srv/backup/backup-2026-10-30.tar",
                                "11:40:31 rm /var/log/vecchio.log",
                                "03:14:06 rm /srv/backup/backup-2026-10-31.tar",
                                "03:14:06 rm /srv/backup/backup-2026-11-01.tar",
                                "16:02:10 rm /home/giulia/bozza-slide.odp"
                            ],
                            target: ["tar"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "03:14" }, desc: "Tieni le righe con '03:14'" },
                                { cmd: "cut", args: { delim: ".", field: 2 }, desc: "Campo 2 (.)" },
                                { cmd: "cut", args: { delim: "/", field: 3 }, desc: "Campo 3 (/)" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" },
                                { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Cosa cancella il fantasma?",
                    options: [
                        "Solo i backup .tar della cartella /srv/backup, sempre di notte",
                        "File a caso in tutto il disco",
                        "I file personali di Tommaso e Giulia",
                        "I vecchi log del sistema"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Alle 03:14 sparisce un solo tipo di file, tutti nella stessa cartella: non è un caso.",
                        "Quelle cancellazioni sono di giorno: le hanno fatte loro, lavorando.",
                        "Il log è stato cancellato alle 11:40, non alle 03:14."
                    ],
                    explain: "Il fantasma è preciso: cancella i backup .tar di /srv/backup, e nient'altro. Sembra proprio uno script di pulizia."
                }
            },
            {
                id: "indirizzo",
                title: "L'indirizzo 10.0.0.42",
                from: "Marco",
                text: "10.0.0.42 è un indirizzo della nostra rete, ma non è di nessun PC che conosco. Il server DHCP sa a chi l'ha dato, e l'inventario dice dove sta ogni macchina.",
                puzzles: [
                    {
                        id: "macchina",
                        clue: "Macchina con l'indirizzo 10.0.0.42",
                        level: {
                            title: "Chi Ha il .42?",
                            source: "cat /var/lib/dhcp/dhcpd.leases",
                            mission: "Quale <strong>macchina</strong> ha l'indirizzo <code>10.0.0.42</code>? Solo il nome.",
                            nudge: "Ogni riga è lease, indirizzo, nome.",
                            hint: "Tieni la riga con 10.0.0.42, poi il nome è il campo 3 (awk '{print $3}').",
                            stdin: [
                                "lease 10.0.0.12 pc-marco",
                                "lease 10.0.0.15 pc-giulia",
                                "lease 10.0.0.20 pc-tommaso",
                                "lease 10.0.0.42 portatile-bruno",
                                "lease 10.0.0.43 stampante-2p"
                            ],
                            target: ["portatile-bruno"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "10.0.0.42" }, desc: "Tieni le righe con '10.0.0.42'" },
                                { cmd: "grep", args: { pattern: "pc-" }, desc: "Tieni le righe con 'pc-'" },
                                { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" },
                                { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" }
                            ]
                        }
                    },
                    {
                        id: "dove",
                        clue: "Dove si trova e com'è",
                        level: {
                            title: "Dov'è?",
                            source: "cat inventario.csv",
                            mission: "L'inventario è <code>nome;stanza;stato</code>. Dove si trova <code>portatile-bruno</code>, e in che stato è? Ottieni <code>stanza stato</code>, separati da uno spazio.",
                            nudge: "Tieni la riga giusta, poi togli il nome e cambia il separatore.",
                            hint: "Tieni la riga di portatile-bruno, togli il nome con sed -E 's/^[^;]*;//', poi cambia ; in spazio con tr ';' ' '.",
                            stdin: [
                                "pc-marco;ufficio-1;acceso",
                                "pc-giulia;ufficio-2;acceso",
                                "pc-tommaso;ufficio-1;spento",
                                "portatile-bruno;magazzino;acceso",
                                "stampante-2p;corridoio;acceso"
                            ],
                            target: ["magazzino acceso"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "portatile-bruno" }, desc: "Tieni le righe con 'portatile-bruno'" },
                                { cmd: "grep", args: { pattern: "acceso" }, desc: "Tieni le righe con 'acceso'" },
                                { cmd: "sed", args: { pattern: "^[^;]*;" }, desc: "Togli il primo campo" },
                                { cmd: "cut", args: { delim: ";", field: 2 }, desc: "Campo 2 (;)" },
                                { cmd: "tr", args: { from: ";", to: " " }, desc: "; → spazio" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Bruno se n'è andato a settembre. Che ci fa il suo portatile in rete alle 3:14?",
                    options: [
                        "È rimasto acceso in magazzino, e qualcosa su di lui si collega da solo al server gufo",
                        "Bruno entra di nascosto in magazzino ogni notte",
                        "È la stampante del secondo piano che si spaccia per lui",
                        "Qualcuno l'ha rubato e lo usa da fuori"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Gli accessi sono alle 3:14 al secondo, ogni notte: una persona non sarebbe così precisa.",
                        "La stampante ha un altro indirizzo, 10.0.0.43.",
                        "L'inventario dice che è in magazzino, acceso."
                    ],
                    explain: "Un portatile dimenticato acceso, con l'account di Bruno, che si collega ogni notte alla stessa ora: un'attività programmata."
                }
            },
            {
                id: "crontab",
                title: "La riga dimenticata",
                from: "Tommaso",
                text: "Sono sceso in magazzino e ho trovato il portatile, acceso, sotto una pila di scatoloni! Ho copiato il crontab di Bruno e lo script che lancia. Ti mando tutto.",
                puzzles: [
                    {
                        id: "comando",
                        clue: "Comando che parte alle 3:14",
                        level: {
                            title: "Ogni Notte alle 3:14",
                            source: "crontab -l",
                            mission: "In un crontab i primi cinque campi sono minuto, ora, giorno, mese, giorno della settimana. Quale <strong>comando</strong> parte ogni notte alle 3:14? Tieni la riga senza i cinque campi dell'orario.",
                            nudge: "Le 3:14 in un crontab si scrivono 14 3. Poi resta da togliere l'inizio della riga.",
                            hint: "Tieni la riga con '14 3 ', poi togli l'orario con sed -E 's/^14 3 \\* \\* \\* //'. Attenzione: awk '{print $6}' ti dà solo la prima parola del comando.",
                            stdin: [
                                "# m h dom mon dow comando",
                                "0 9 * * 1 /home/bruno/report-settimanale.sh",
                                "14 3 * * * ssh gufo /home/bruno/pulizia.sh",
                                "30 18 * * 5 /home/bruno/backup-personale.sh"
                            ],
                            target: ["ssh gufo /home/bruno/pulizia.sh"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "14 3 " }, desc: "Tieni le righe con '14 3 '" },
                                { cmd: "grep", args: { pattern: "#", invert: true }, desc: "Scarta i commenti" },
                                { cmd: "sed", args: { pattern: "^14 3 \\* \\* \\* " }, desc: "Togli l'orario 14 3 * * *" },
                                { cmd: "awk", args: { field: 6 }, desc: "Campo 6 di awk" },
                                { cmd: "cut", args: { delim: " ", field: 6 }, desc: "Campo 6 (spazio)" }
                            ]
                        }
                    },
                    {
                        id: "commenti",
                        clue: "Commenti dello script pulizia.sh",
                        level: {
                            title: "Lo Script",
                            source: "cat /home/bruno/pulizia.sh",
                            mission: "Leggi i <strong>commenti</strong> dello script: le righe che iniziano con <code># </code> (cancelletto e spazio), senza il cancelletto e lo spazio iniziali.",
                            nudge: "La prima riga, #!/bin/bash, non è un commento: dopo il cancelletto non c'è uno spazio.",
                            hint: "Tieni le righe con '# ', poi togli '# ' all'inizio con sed -E 's/^# //'.",
                            stdin: [
                                "#!/bin/bash",
                                "# pulizia dei vecchi backup - Bruno, marzo 2023",
                                "# TODO: togliere quando arriva il nuovo sistema di backup",
                                "cd /srv/backup",
                                "rm -f backup-*.tar",
                                "echo fatto >> /tmp/pulizia.log"
                            ],
                            target: ["pulizia dei vecchi backup - Bruno, marzo 2023", "TODO: togliere quando arriva il nuovo sistema di backup"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "# " }, desc: "Tieni le righe con '# '" },
                                { cmd: "grep", args: { pattern: "#" }, desc: "Tieni le righe con '#'" },
                                { cmd: "sed", args: { pattern: "^# " }, desc: "Togli '# ' iniziale" },
                                { cmd: "tr", args: { delete: "#" }, desc: "Cancella i #" },
                                { cmd: "head", args: { n: 2 }, desc: "Prendi le prime 2" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Allora, perché spariscono i backup?",
                    options: [
                        "Uno script di pulizia del 2023, da togliere con il nuovo sistema di backup, è rimasto nel crontab del portatile di Bruno, che è ancora acceso",
                        "Bruno si vendica dell'azienda cancellando i backup",
                        "Tommaso ha lanciato per sbaglio rm -f su /srv/backup",
                        "Un attacco da internet ha installato lo script"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Lo script è del marzo 2023, quando Bruno lavorava ancora qui, e il commento dice che andava tolto.",
                        "Tommaso entra di giorno, e le cancellazioni sono alle 3:14 ogni notte.",
                        "Lo script è nella home di Bruno da marzo 2023 e parte da un portatile interno."
                    ],
                    explain: "Nessun fantasma: un'attività programmata dimenticata. Il nuovo sistema di backup è arrivato, ma nessuno ha tolto la vecchia pulizia."
                }
            },
            {
                id: "caso-chiuso",
                title: "Caso chiuso",
                from: "Giulia",
                text: "Ieri sera Marco ha spento il portatile. Prima di chiudere il caso voglio una conferma dai log di stanotte, e poi il rapporto per la direzione.",
                puzzles: [
                    {
                        id: "conferma",
                        clue: "Accessi delle 03:14 dopo lo spegnimento",
                        level: {
                            title: "Stanotte",
                            source: "grep sshd /var/log/auth.log",
                            mission: "Nel log di stanotte, quanti accessi ci sono stati alle <code>03:14</code>?",
                            nudge: "Conta solo le righe delle 03:14.",
                            hint: "Tieni le righe con 03:14 e contale: se il fantasma è sparito, il risultato è 0.",
                            stdin: [
                                "Nov 05 08:55:10 gufo sshd: Accepted password for giulia from 10.0.0.15",
                                "Nov 05 09:02:44 gufo sshd: Accepted password for marco from 10.0.0.12",
                                "Nov 05 09:31:07 gufo sshd: Accepted password for tommaso from 10.0.0.20"
                            ],
                            target: ["0"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "03:14" }, desc: "Tieni le righe con '03:14'" },
                                { cmd: "grep", args: { pattern: "Accepted" }, desc: "Tieni le righe con 'Accepted'" },
                                { cmd: "wc", desc: "Conta le righe" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Quale rapporto mandi alla direzione? Rileggi il taccuino: un solo rapporto è giusto in ogni dettaglio.",
                    options: [
                        "L'account di Bruno, da 10.0.0.42 (il suo vecchio portatile, acceso in magazzino), lanciava ogni notte pulizia.sh dal crontab, che cancella i backup .tar di /srv/backup. Soluzione: portatile spento, account disattivato.",
                        "L'account di Bruno, da 10.0.0.42 (il suo vecchio portatile, acceso in magazzino), lanciava ogni notte pulizia.sh dal crontab, che cancella i vecchi log di sistema. Soluzione: portatile spento, account disattivato.",
                        "L'account di Bruno, da 10.0.0.20 (il PC di Tommaso), lanciava ogni notte pulizia.sh dal crontab, che cancella i backup .tar di /srv/backup. Soluzione: PC di Tommaso formattato.",
                        "Bruno entrava ogni notte da internet con la password di root e cancellava i backup .tar di /srv/backup. Soluzione: cambiare la password di root."
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Capitolo 2: alle 03:14 spariscono i backup .tar, non i log.",
                        "Capitolo 3: 10.0.0.42 è portatile-bruno, non il PC di Tommaso (10.0.0.20).",
                        "Capitoli 1 e 4: l'accesso era interno, con chiave, e partiva da uno script, non da una persona."
                    ],
                    explain: "Ogni dettaglio torna: chi (cap. 1), cosa (cap. 2), da dove (cap. 3), come (cap. 4) e la conferma di stanotte. Caso chiuso!"
                }
            }
        ]
    }
];
