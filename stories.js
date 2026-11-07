// Casi a puntate: gialli divisi in capitoli. Ogni capitolo ha un racconto, uno o più enigmi
// (livelli "componi" con lo stdout atteso nascosto: il risultato è l'indizio da scoprire) e una
// domanda di deduzione. Si sbloccano un capitolo alla volta; release (AAAA-MM-GG) facoltativa
// rimanda un capitolo a una data. requiresAct: atto della campagna da completare prima.
// question.focus: gli indizi ("capitolo/enigma") che contano per la risposta; question.hint: il
// primo aiuto della deduzione (il secondo elimina una risposta sbagliata).
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
                    explain: "Stesso utente, stessa ora quasi al secondo, stesso indirizzo interno: sembra più un automatismo che una persona.",
                    focus: ["le-3-14/chi", "le-3-14/da-dove"],
                    hint: "Gli indirizzi 10.x sono della rete interna, non di internet. E una persona entrerebbe ogni notte alla stessa ora, quasi allo stesso secondo?"
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
                    explain: "Il fantasma è preciso: cancella i backup .tar di /srv/backup, e nient'altro. Sembra proprio uno script di pulizia.",
                    focus: ["cosa-sparisce/quali"],
                    hint: "Se il fantasma cancellasse a caso, alle 03:14 troveresti estensioni diverse. Quante ne hai trovate?"
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
                    explain: "Un portatile dimenticato acceso, con l'account di Bruno, che si collega ogni notte alla stessa ora: un'attività programmata.",
                    focus: ["indirizzo/dove"],
                    hint: "Dove si trova il portatile, e in che stato è? Chi ci va, in magazzino, alle tre di notte?"
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
                    explain: "Nessun fantasma: un'attività programmata dimenticata. Il nuovo sistema di backup è arrivato, ma nessuno ha tolto la vecchia pulizia.",
                    focus: ["crontab/comando", "crontab/commenti"],
                    hint: "Leggi i commenti dello script: chi l'ha scritto, quando, e cosa dice il TODO? E da dove parte il comando delle 3:14?"
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
                    explain: "Ogni dettaglio torna: chi (cap. 1), cosa (cap. 2), da dove (cap. 3), come (cap. 4) e la conferma di stanotte. Caso chiuso!",
                    focus: ["le-3-14/da-dove", "cosa-sparisce/quali", "indirizzo/macchina"],
                    hint: "I rapporti sono quasi uguali: ognuno sbagliato ha un solo dettaglio falso. Controlla l'indirizzo (cap. 1 e 3) e il tipo di file (cap. 2)."
                }
            }
        ]
    },
    {
        id: "messaggio-nascosto",
        title: "Il messaggio nascosto",
        synopsis: "La newsletter di stanotte è partita con un testo illeggibile, scritto allo specchio. Uno scherzo, un sabotaggio… o qualcuno che chiede aiuto?",
        requiresAct: 6,
        epilogue: "Alle 8:01 Marco apre la sala server con la vecchia chiave di metallo. Irene esce stropicciata, con una tazza vuota in mano: «Il filtro della newsletter blocca le modifiche dell'ultimo minuto con parole come AIUTO. Ho dovuto nasconderla.» Il firmware 2.3 della porta viene ritirato, e da allora in sala server c'è sempre una chiave appesa accanto alla porta. E una pizza, il venerdì.",
        chapters: [
            {
                id: "testo",
                title: "Testo allo specchio",
                from: "Giulia",
                text: "Stamattina mezza azienda mi ha scritto: la newsletter è arrivata incomprensibile. Il programma di invio non segnala errori. Ecco il testo, così com'è partito.",
                puzzles: [
                    {
                        id: "raddrizza",
                        clue: "Il testo raddrizzato",
                        level: {
                            title: "Raddrizza il Testo",
                            source: "cat newsletter-4-novembre.txt",
                            mission: "Rimetti la newsletter come doveva essere: ogni riga leggibile, e le righe nell'ordine giusto (il saluto «Aggiornamenti…» per primo).",
                            nudge: "Il testo è rovesciato due volte: dentro ogni riga, e nell'ordine delle righe.",
                            hint: "rev raddrizza le lettere di ogni riga, tac rimette le righe in ordine. Servono tutti e due, in qualsiasi ordine.",
                            stdin: [".11 el ortne asnem alled inidrO", ".orucis la onos aro pukcab i ittuT", "?emeisni eraiggetsef rep azzip anU", ".eneb anoiznuf retnecatad ovoun lI", ".oC & epiP allad itnemanroiggA"],
                            target: ["Aggiornamenti dalla Pipe & Co.", "Il nuovo datacenter funziona bene.", "Una pizza per festeggiare insieme?", "Tutti i backup ora sono al sicuro.", "Ordini della mensa entro le 11."],
                            allowedCommands: [
                                { cmd: "rev", desc: "Ogni riga al contrario" },
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
                                { cmd: "cutc", args: { from: 1, to: 1 }, desc: "Carattere 1" }
                            ]
                        }
                    },
                    {
                        id: "iniziali",
                        clue: "Le iniziali delle righe, dall'alto",
                        level: {
                            title: "Le Iniziali",
                            source: "cat newsletter-4-novembre.txt",
                            mission: "Nelle newsletter scherzose a volte le iniziali delle righe formano una parola. Ottieni la <strong>prima lettera</strong> di ogni riga del testo raddrizzato, dall'alto in basso.",
                            nudge: "Prima raddrizza, poi prendi un carattere solo.",
                            hint: "rev e tac raddrizzano il testo, cut -c1 tiene la prima lettera.",
                            stdin: [".11 el ortne asnem alled inidrO", ".orucis la onos aro pukcab i ittuT", "?emeisni eraiggetsef rep azzip anU", ".eneb anoiznuf retnecatad ovoun lI", ".oC & epiP allad itnemanroiggA"],
                            target: ["A", "I", "U", "T", "O"],
                            allowedCommands: [
                                { cmd: "rev", desc: "Ogni riga al contrario" },
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
                                { cmd: "cutc", args: { from: 1, to: 1 }, desc: "Carattere 1" },
                                { cmd: "cutc", args: { from: 1, to: 2 }, desc: "Caratteri 1-2" },
                                { cmd: "sort", desc: "Ordine alfabetico" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Allora, cosa dice la newsletter?",
                    options: [
                        "Le iniziali delle righe formano AIUTO: qualcuno ha nascosto una richiesta di aiuto",
                        "È solo un errore di impaginazione del programma di invio",
                        "È un attacco informatico che chiede un riscatto",
                        "Le iniziali formano TUTTO: nessun messaggio, solo un caso"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Un errore di impaginazione non scriverebbe anche ogni riga allo specchio: è stato fatto apposta.",
                        "Nel testo raddrizzato non c'è nessuna richiesta di soldi: è la solita newsletter.",
                        "Rileggi le iniziali dall'alto: A, I, U, T, O."
                    ],
                    explain: "A-I-U-T-O: qualcuno ha nascosto una richiesta di aiuto nella newsletter, e l'ha anche scritta allo specchio.",
                    focus: ["testo/iniziali"],
                    hint: "Leggi le iniziali dall'alto in basso, tutte di seguito."
                }
            },
            {
                id: "chi-ha-scritto",
                title: "Chi l'ha scritto",
                from: "Marco",
                text: "Il modello della newsletter tiene un registro di chi lo modifica: nome, ora e parte cambiata. Ieri l'hanno toccato in tanti. Vediamo chi è arrivato per ultimo.",
                puzzles: [
                    {
                        id: "ultimo",
                        clue: "Ultima persona a modificare il modello",
                        level: {
                            title: "L'Ultima Modifica",
                            source: "cat modifiche-modello.csv",
                            mission: "Ogni riga è <code>nome,ora,parte</code>, tutte di ieri. Chi ha modificato il modello <strong>per ultimo</strong>? Solo il nome.",
                            nudge: "Bisogna ordinare per ora, non per nome.",
                            hint: "sort -t',' -k2,2 ordina sull'ora; poi tieni l'ultima riga (tail -n 1) e il nome (cut -d',' -f1).",
                            stdin: ["tommaso,12:10,link", "marco,17:20,titolo", "giulia,18:05,immagine", "irene,23:41,testo", "marco,09:02,data"],
                            target: ["irene"],
                            allowedCommands: [
                                { cmd: "sort", args: { separator: ",", key: 2 }, desc: "Per ora (campo 2)" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" },
                                { cmd: "cut", args: { delim: ",", field: 1 }, desc: "Campo 1 (,)" },
                                { cmd: "cut", args: { delim: ",", field: 3 }, desc: "Campo 3 (,)" }
                            ]
                        }
                    },
                    {
                        id: "ora",
                        clue: "Ora e parte della modifica di Irene",
                        level: {
                            title: "A Che Ora?",
                            source: "cat modifiche-modello.csv",
                            mission: "A che ora ha modificato il modello Irene, e quale parte? Ottieni <code>ora parte</code>, separati da uno spazio.",
                            nudge: "Tieni la sua riga, togli il nome e cambia il separatore.",
                            hint: "Tieni la riga di irene, togli il nome con sed -E 's/^[^,]*,//', poi la virgola diventa spazio con tr ',' ' '.",
                            stdin: ["tommaso,12:10,link", "marco,17:20,titolo", "giulia,18:05,immagine", "irene,23:41,testo", "marco,09:02,data"],
                            target: ["23:41 testo"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "irene" }, desc: "Tieni le righe con 'irene'" },
                                { cmd: "sed", args: { pattern: "^[^,]*," }, desc: "Togli il primo campo" },
                                { cmd: "cut", args: { delim: ",", field: 2 }, desc: "Campo 2 (,)" },
                                { cmd: "tr", args: { from: ",", to: " " }, desc: ", → spazio" },
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Chi ha nascosto AIUTO nella newsletter, e quando?",
                    options: [
                        "Irene, alle 23:41, modificando il testo del modello",
                        "Marco, alle 17:20, cambiando il titolo",
                        "Tommaso, a mezzogiorno, cambiando il link",
                        "Nessuno: l'ha rovinata il programma di invio, di notte"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Marco ha cambiato il titolo, e il titolo è rimasto normale. E dopo di lui ci sono altre modifiche.",
                        "Il link non c'entra con il testo allo specchio, e Tommaso ha lavorato a mezzogiorno.",
                        "Il registro mostra una modifica umana al testo, alle 23:41."
                    ],
                    explain: "L'ultima modifica è di Irene, alle 23:41, proprio sul testo. Ma cosa ci faceva in ufficio a quell'ora?",
                    focus: ["chi-ha-scritto/ultimo", "chi-ha-scritto/ora"],
                    hint: "Chi ha toccato il testo, e a che ora? Le altre modifiche sono di giorno."
                }
            },
            {
                id: "porta",
                title: "La porta",
                from: "Tommaso",
                text: "Irene stamattina non risponde al telefono, ma il suo badge risulta in sala server da ieri sera! La porta della sala ha un registro di entrate e uscite, e c'è l'elenco dei badge.",
                puzzles: [
                    {
                        id: "negate",
                        clue: "Uscite negate al badge B21",
                        level: {
                            title: "Uscite Negate",
                            source: "cat /var/log/porta-sala-server.log",
                            mission: "Quante volte la porta ha <strong>negato l'uscita</strong> al badge <code>B21</code>?",
                            nudge: "Servono due condizioni insieme: uscita negata, e badge B21.",
                            hint: "Due grep di fila (NEGATA e B21, in qualsiasi ordine), poi wc -l. Attenzione: anche un altro badge ha avuto un'uscita negata.",
                            stdin: ["23:28 ENTRATA badge=B21", "23:35 USCITA NEGATA badge=B21", "23:36 USCITA NEGATA badge=B21", "23:44 USCITA NEGATA badge=B21", "23:51 USCITA NEGATA badge=B21", "07:56 ENTRATA badge=B07", "07:59 USCITA NEGATA badge=B07"],
                            target: ["4"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "NEGATA" }, desc: "Tieni le righe con 'NEGATA'" },
                                { cmd: "grep", args: { pattern: "B21" }, desc: "Tieni le righe con 'B21'" },
                                { cmd: "grep", args: { pattern: "ENTRATA" }, desc: "Tieni le righe con 'ENTRATA'" },
                                { cmd: "wc", desc: "Conta le righe" },
                                { cmd: "uniq", args: { repeated: true }, desc: "Solo le righe ripetute" }
                            ]
                        }
                    },
                    {
                        id: "badge",
                        clue: "Proprietario del badge B21",
                        level: {
                            title: "Di Chi È?",
                            source: "cat badge.txt",
                            mission: "Di chi è il badge <code>B21</code>? Solo il nome.",
                            nudge: "Ogni riga è badge e nome.",
                            hint: "Tieni la riga con B21, poi il nome è il campo 2 (awk).",
                            stdin: ["B07 marco", "B15 giulia", "B21 irene", "B30 tommaso"],
                            target: ["irene"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "B21" }, desc: "Tieni le righe con 'B21'" },
                                { cmd: "grep", args: { pattern: "B07" }, desc: "Tieni le righe con 'B07'" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                                { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" },
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Perché Irene ha usato proprio la newsletter?",
                    options: [
                        "Era chiusa nella sala server: la porta rifiutava il suo badge in uscita, e la newsletter era l'unico modo di farsi sentire",
                        "Voleva fare uno scherzo ai colleghi prima del weekend",
                        "Era arrabbiata con Giulia e voleva rovinarle la newsletter",
                        "Il suo badge era rotto da giorni e non riusciva nemmeno a entrare"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Uno scherzo non spiega quattro tentativi di uscire in mezz'ora, a mezzanotte.",
                        "Il testo è la solita newsletter, solo nascosto: non c'è niente contro Giulia.",
                        "Alle 23:28 il badge B21 è entrato senza problemi: è l'uscita che non funziona."
                    ],
                    explain: "Irene è entrata alle 23:28 e da lì non è più potuta uscire: la porta le negava l'uscita. In sala server il telefono non prende, ma c'è un terminale.",
                    focus: ["porta/negate", "porta/badge"],
                    hint: "Il badge B21 entra senza problemi alle 23:28. E dopo?"
                }
            },
            {
                id: "caso-chiuso",
                title: "Caso chiuso",
                from: "Giulia",
                text: "Marco sta andando ad aprire la sala server con la chiave di metallo. Intanto ho preso il registro di sistema della porta: è dal più recente al più vecchio. Poi scriviamo il rapporto per la direzione.",
                puzzles: [
                    {
                        id: "firmware",
                        clue: "Le prime righe della notte",
                        level: {
                            title: "Cosa È Successo alle 22",
                            source: "journalctl -u porta -r",
                            mission: "Il registro parte dalla riga più recente. Mostra le <strong>prime 2 righe</strong> della serata, in ordine cronologico (dalla più vecchia).",
                            nudge: "Le righe più vecchie sono in fondo: rovesciale, oppure prendi la fine e poi rovesciala.",
                            hint: "tac rimette il registro in ordine cronologico, head -n 2 tiene le prime due. Funziona anche tail -n 2 seguito da tac.",
                            stdin: ["08:00 firmware 2.2 ripristinato", "07:59 ERRORE lettura badge in uscita", "23:51 ERRORE lettura badge in uscita", "23:44 ERRORE lettura badge in uscita", "23:36 ERRORE lettura badge in uscita", "23:35 ERRORE lettura badge in uscita", "22:04 firmware 2.3 installato", "22:00 aggiornamento firmware avviato"],
                            target: ["22:00 aggiornamento firmware avviato", "22:04 firmware 2.3 installato"],
                            allowedCommands: [
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "head", args: { n: 2 }, desc: "Prendi le prime 2" },
                                { cmd: "tail", args: { n: 2 }, desc: "Prendi le ultime 2" },
                                { cmd: "grep", args: { pattern: "ERRORE" }, desc: "Tieni le righe con 'ERRORE'" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Quale rapporto mandi alla direzione? Un solo rapporto è giusto in ogni dettaglio.",
                    options: [
                        "Alle 22:04 la porta ha installato il firmware 2.3, che non legge i badge in uscita. Irene (badge B21) è rimasta chiusa in sala server e alle 23:41 ha scritto AIUTO nella newsletter, con le iniziali e il testo allo specchio.",
                        "Alle 22:04 la porta ha installato il firmware 2.2, che non legge i badge in uscita. Irene (badge B21) è rimasta chiusa in sala server e alle 23:41 ha scritto AIUTO nella newsletter, con le iniziali e il testo allo specchio.",
                        "Alle 22:04 la porta ha installato il firmware 2.3, che non legge i badge in uscita. Irene (badge B07) è rimasta chiusa in sala server e alle 23:41 ha scritto AIUTO nella newsletter, con le iniziali e il testo allo specchio.",
                        "Alle 22:04 la porta ha installato il firmware 2.3, che non legge i badge in uscita. Irene (badge B21) è rimasta chiusa in sala server e alle 17:20 ha scritto TUTTO nella newsletter, con le iniziali e il testo allo specchio."
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Capitolo 4: alle 22:04 si installa il 2.3; il 2.2 è quello ripristinato stamattina.",
                        "Capitolo 3: il badge di Irene è B21. B07 è di Marco.",
                        "Capitoli 1 e 2: la parola è AIUTO, e la modifica di Irene è delle 23:41."
                    ],
                    explain: "Firmware 2.3 alle 22:04, badge B21 bloccato in uscita, modifica delle 23:41, AIUTO nelle iniziali: ogni dettaglio torna. Caso chiuso!",
                    focus: ["testo/iniziali", "chi-ha-scritto/ora", "porta/badge", "caso-chiuso/firmware"],
                    hint: "I rapporti differiscono per un solo dettaglio: la versione del firmware (cap. 4), il badge (cap. 3), l'ora e la parola (cap. 1 e 2)."
                }
            }
        ]
    },
    {
        id: "pacchetto-avvelenato",
        title: "Il pacchetto avvelenato",
        synopsis: "Le ventole dei server girano al massimo e nessuno sa perché. Qualcosa sta consumando tutta la CPU, e non è un programma che conosciamo.",
        requiresAct: 7,
        epilogue: "Marco rimuove fast-json-tools da zebra, gatto e mela, e Giulia cancella il mirror «veloce» dalle sorgenti di apt. Si scopre che l'aveva aggiunto un vecchio script di installazione copiato da un forum. Da quel giorno alla Pipe & Co. vale una regola nuova: solo repository ufficiali, e ogni pacchetto nuovo passa da comm contro l'elenco approvato. Le ventole tornano a sussurrare.",
        chapters: [
            {
                id: "cpu",
                title: "Le ventole",
                from: "Marco",
                text: "Il server zebra sembra un aspirapolvere: ventole al massimo da stamattina. Ti mando l'elenco dei processi con la CPU che usano: utente, PID, percentuale di CPU, nome.",
                puzzles: [
                    {
                        id: "processo",
                        clue: "Il processo che usa più CPU",
                        level: {
                            title: "Chi Consuma?",
                            source: "ps -eo user,pid,pcpu,comm --no-headers",
                            mission: "Ogni riga è <code>utente pid cpu nome</code>. Quale processo usa <strong>più CPU</strong>? Solo il nome.",
                            nudge: "Ordina sulla colonna della CPU, come numero, dal più grande.",
                            hint: "sort -rn -t' ' -k3,3 mette in cima chi usa più CPU; head -n 1 e awk '{print $4}' tengono il nome.",
                            stdin: ["root 1 0.0 systemd", "www-data 812 2.1 nginx", "postgres 903 5.4 postgres", "nobody 4242 98.7 sysupd", "marco 5120 1.2 bash", "root 77 0.3 sshd"],
                            target: ["sysupd"],
                            allowedCommands: [
                                { cmd: "sort", args: { numeric: true, reverse: true, separator: " ", key: 3 }, desc: "CPU, dal più grande" },
                                { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Riga intera, numerico decrescente" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" },
                                { cmd: "awk", args: { field: 4 }, desc: "Campo 4 di awk" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" }
                            ]
                        }
                    },
                    {
                        id: "utente",
                        clue: "Utente e CPU di sysupd",
                        level: {
                            title: "Con Quale Utente?",
                            source: "ps -eo user,pid,pcpu,comm --no-headers",
                            mission: "Con quale <strong>utente</strong> gira <code>sysupd</code>, e quanta CPU usa? Ottieni <code>utente cpu</code>.",
                            nudge: "Tieni la sua riga e togli il PID.",
                            hint: "grep 'sysupd', poi sed -E 's/ [0-9]+ / /' toglie il PID e sed -E 's/ [a-z]+$//' toglie il nome finale.",
                            stdin: ["root 1 0.0 systemd", "www-data 812 2.1 nginx", "postgres 903 5.4 postgres", "nobody 4242 98.7 sysupd", "marco 5120 1.2 bash", "root 77 0.3 sshd"],
                            target: ["nobody 98.7"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "sysupd" }, desc: "Tieni le righe con 'sysupd'" },
                                { cmd: "sed", args: { pattern: " [0-9]+ ", replacement: " " }, desc: "Togli il PID" },
                                { cmd: "sed", args: { pattern: " [a-z]+$" }, desc: "Togli il nome finale" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                                { cmd: "nl", args: { width: 1, separator: ". " }, desc: "Numera: 1. 2. 3." }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Cosa c'è che non va su zebra?",
                    options: [
                        "Un programma sconosciuto, sysupd, usa quasi tutta la CPU con l'utente nobody, che di solito non fa girare niente",
                        "postgres sta facendo un backup pesante, come ogni mattina",
                        "nginx è sotto attacco e usa tutta la CPU",
                        "È solo systemd che aggiorna il sistema"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "postgres usa il 5,4%: normale. Chi usa quasi tutto è un altro processo.",
                        "nginx è al 2,1%: tranquillo.",
                        "systemd è allo 0,0%, e sysupd non è un programma di systemd."
                    ],
                    explain: "sysupd usa il 98,7% della CPU con l'utente nobody: un nome che sembra di sistema, ma nessuno l'ha mai visto. Sembra un minatore di criptovalute.",
                    focus: ["cpu/processo", "cpu/utente"],
                    hint: "Quale processo ha un nome che non conosci, e quanta CPU usa rispetto agli altri?"
                }
            },
            {
                id: "origine",
                title: "Da dove arriva",
                from: "Tommaso",
                text: "Ho chiesto a dpkg a quale pacchetto appartengono i programmi in /usr/bin. Se sysupd è stato installato da un pacchetto, lo scopriamo qui.",
                puzzles: [
                    {
                        id: "pacchetto",
                        clue: "Il pacchetto che installa sysupd",
                        level: {
                            title: "Di Chi È sysupd?",
                            source: "dpkg -S /usr/bin/*",
                            mission: "Ogni riga è <code>pacchetto: file</code>. Quale <strong>pacchetto</strong> ha installato <code>sysupd</code>?",
                            nudge: "Il nome del pacchetto è prima dei due punti.",
                            hint: "grep 'sysupd', poi cut -d':' -f1.",
                            stdin: ["coreutils: /usr/bin/sort", "curl: /usr/bin/curl", "fast-json-tools: /usr/bin/fjson", "fast-json-tools: /usr/bin/sysupd", "nginx-core: /usr/sbin/nginx", "vim: /usr/bin/vim"],
                            target: ["fast-json-tools"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "sysupd" }, desc: "Tieni le righe con 'sysupd'" },
                                { cmd: "cut", args: { delim: ":", field: 1 }, desc: "Campo 1 (:)" },
                                { cmd: "cut", args: { delim: "/", field: 4 }, desc: "Campo 4 (/)" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "uniq", args: { repeated: true }, desc: "Solo le righe ripetute" }
                            ]
                        }
                    },
                    {
                        id: "file",
                        clue: "I file di fast-json-tools",
                        level: {
                            title: "Cosa Installa?",
                            source: "dpkg -S /usr/bin/*",
                            mission: "Elenca, <strong>numerati</strong> come <code>1. /usr/bin/...</code>, tutti i file installati da <code>fast-json-tools</code>.",
                            nudge: "Tieni le righe del pacchetto, poi il percorso, poi i numeri.",
                            hint: "grep 'fast-json-tools', awk '{print $2}' per il percorso, nl -w1 -s'. ' per numerare.",
                            stdin: ["coreutils: /usr/bin/sort", "curl: /usr/bin/curl", "fast-json-tools: /usr/bin/fjson", "fast-json-tools: /usr/bin/sysupd", "nginx-core: /usr/sbin/nginx", "vim: /usr/bin/vim"],
                            target: ["1. /usr/bin/fjson", "2. /usr/bin/sysupd"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "fast-json-tools" }, desc: "Tieni le righe con 'fast-json-tools'" },
                                { cmd: "awk", args: { field: 2 }, desc: "Campo 2 di awk" },
                                { cmd: "nl", args: { width: 1, separator: ". " }, desc: "Numera: 1. 2. 3." },
                                { cmd: "nl", desc: "Numera (formato standard)" },
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Cosa sospetti di fast-json-tools?",
                    options: [
                        "Oltre al suo programma per il JSON (fjson) installa anche sysupd, che con il JSON non c'entra niente: il pacchetto è stato manomesso",
                        "È un pacchetto di sistema indispensabile, come coreutils",
                        "sysupd è un componente normale di nginx",
                        "Il pacchetto è innocente: sysupd l'ha scritto qualcuno a mano"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "coreutils installa sort e gli altri comandi base; fast-json-tools è un'utilità per il JSON.",
                        "dpkg dice che nginx installa /usr/sbin/nginx, e sysupd appartiene a un altro pacchetto.",
                        "dpkg dice proprio che sysupd l'ha installato fast-json-tools."
                    ],
                    explain: "Un'utilità per il JSON non ha bisogno di un processo che giri in sottofondo e consumi tutta la CPU: il pacchetto è avvelenato.",
                    focus: ["origine/pacchetto", "origine/file"],
                    hint: "Un pacchetto per il JSON dovrebbe installare solo programmi per il JSON. Quanti file installa, e quali?"
                }
            },
            {
                id: "sorgente",
                title: "Il mirror veloce",
                from: "Giulia",
                text: "fast-json-tools non è nei pacchetti che approviamo. Ho l'elenco dei pacchetti installati su zebra, la lista di quelli ufficiali e le sorgenti da cui apt li ha scaricati.",
                puzzles: [
                    {
                        id: "estranei",
                        clue: "Pacchetti installati fuori dall'elenco ufficiale",
                        level: {
                            title: "Fuori Lista",
                            source: "apt list --installed",
                            mission: "Quali pacchetti installati su zebra <strong>non</strong> sono in <code>ufficiali.txt</code>?",
                            nudge: "comm confronta due elenchi ordinati; ti servono le righe che stanno solo nel primo.",
                            hint: "sort, poi comm -23 - ufficiali.txt (solo nello stdin).",
                            stdin: ["vim", "curl", "fast-json-tools", "nginx-core", "coreutils", "postgresql"],
                            target: ["fast-json-tools"],
                            allowedCommands: [
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "comm", args: { mode: "23", file: "ufficiali.txt", lines: ["coreutils", "curl", "nginx-core", "postgresql", "vim"] }, desc: "Solo nell'elenco, non ufficiali" },
                                { cmd: "comm", args: { mode: "12", file: "ufficiali.txt", lines: ["coreutils", "curl", "nginx-core", "postgresql", "vim"] }, desc: "In comune con ufficiali.txt" },
                                { cmd: "comm", args: { mode: "13", file: "ufficiali.txt", lines: ["coreutils", "curl", "nginx-core", "postgresql", "vim"] }, desc: "Solo in ufficiali.txt" },
                                { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" }
                            ]
                        }
                    },
                    {
                        id: "mirror",
                        clue: "Versione e sorgente di fast-json-tools",
                        level: {
                            title: "Da Quale Sorgente?",
                            source: "dpkg-query -W -f='${Package} ${Version}\\n'",
                            mission: "Metti accanto a ogni pacchetto la sorgente da cui è arrivato (<code>sorgenti.txt</code>) e tieni solo la riga di <code>fast-json-tools</code>: <code>pacchetto versione sorgente</code>.",
                            nudge: "join unisce le righe con lo stesso nome, se gli elenchi sono ordinati.",
                            hint: "join - sorgenti.txt unisce le righe con lo stesso nome; grep 'fast-json-tools' tiene quella giusta. Se fai prima il grep resta una riga sola, già ordinata; altrimenti serve sort prima di join.",
                            stdin: ["vim 2:9.1.0016-1", "fast-json-tools 2.4.1", "curl 8.5.0-2", "coreutils 9.4-3"],
                            target: ["fast-json-tools 2.4.1 mirror-veloce.example.com"],
                            allowedCommands: [
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "join", args: { file: "sorgenti.txt", lines: ["coreutils deb.debian.org", "curl deb.debian.org", "fast-json-tools mirror-veloce.example.com", "vim deb.debian.org"] }, desc: "Unisci con sorgenti.txt" },
                                { cmd: "grep", args: { pattern: "fast-json-tools" }, desc: "Tieni le righe con 'fast-json-tools'" },
                                { cmd: "grep", args: { pattern: "debian" }, desc: "Tieni le righe con 'debian'" },
                                { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Come è arrivato fast-json-tools su zebra?",
                    options: [
                        "Da un mirror non ufficiale, mirror-veloce.example.com, aggiunto alle sorgenti di apt: non è nell'elenco dei pacchetti approvati",
                        "Dai repository ufficiali di Debian, come tutti gli altri pacchetti",
                        "L'ha compilato Marco a mano dal codice sorgente",
                        "Era già installato con il sistema operativo"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Gli altri pacchetti vengono da deb.debian.org; fast-json-tools no.",
                        "dpkg lo conosce come pacchetto, con una sorgente: non è stato compilato a mano.",
                        "Non è nell'elenco ufficiale, che comprende i pacchetti del sistema."
                    ],
                    explain: "Il pacchetto avvelenato viene da un mirror «veloce» che non è di Debian: qualcuno l'ha aggiunto alle sorgenti di apt.",
                    focus: ["sorgente/estranei", "sorgente/mirror"],
                    hint: "Da dove vengono gli altri pacchetti? E fast-json-tools?"
                }
            },
            {
                id: "diffusione",
                title: "Quanti server",
                from: "Giulia",
                text: "Se il mirror è nelle sorgenti di zebra, potrebbe esserlo anche altrove. Ecco l'inventario dei pacchetti di tutti i server. Al monitoraggio basta il numero dei server colpiti, ma io voglio vedere anche i nomi mentre la pipeline lavora.",
                puzzles: [
                    {
                        id: "server",
                        clue: "Server con fast-json-tools (stdout: quanti; stderr: quali)",
                        level: {
                            title: "Su Quali Server?",
                            source: "for s in zebra mela gatto pesca; do ssh $s inventario; done",
                            mission: "Ogni riga è <code>server pacchetto</code>. Allo stdout serve <strong>quanti</strong> server hanno <code>fast-json-tools</code>; sul terminale devono comparire i loro <strong>nomi</strong>, in ordine alfabetico.",
                            nudge: "Un raccordo a T: i nomi sul terminale, il conteggio nella pipe.",
                            hint: "grep 'fast-json-tools', awk '{print $1}', sort, tee /dev/stderr, wc -l.",
                            stdin: ["zebra nginx-core", "zebra fast-json-tools", "mela postgresql", "gatto fast-json-tools", "gatto vim", "pesca curl", "mela fast-json-tools", "pesca vim"],
                            target: ["3"],
                            targetStderr: ["gatto", "mela", "zebra"],
                            slots: 6,
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "fast-json-tools" }, desc: "Tieni le righe con 'fast-json-tools'" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "tee", args: { file: "/dev/stderr" }, desc: "Copia sul terminale" },
                                { cmd: "tee", args: { file: "colpiti.txt" }, desc: "Copia in un file" },
                                { cmd: "wc", desc: "Conta le righe" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Quale rapporto mandi alla direzione? Un solo rapporto è giusto in ogni dettaglio.",
                    options: [
                        "Il pacchetto fast-json-tools, scaricato dal mirror non ufficiale mirror-veloce.example.com, installa sysupd, che usa il 98,7% della CPU con l'utente nobody. È su 3 server: gatto, mela e zebra.",
                        "Il pacchetto fast-json-tools, scaricato dai repository ufficiali di Debian, installa sysupd, che usa il 98,7% della CPU con l'utente nobody. È su 3 server: gatto, mela e zebra.",
                        "Il pacchetto fast-json-tools, scaricato dal mirror non ufficiale mirror-veloce.example.com, installa sysupd, che usa il 98,7% della CPU con l'utente root. È su 3 server: gatto, mela e zebra.",
                        "Il pacchetto fast-json-tools, scaricato dal mirror non ufficiale mirror-veloce.example.com, installa sysupd, che usa il 98,7% della CPU con l'utente nobody. È su 2 server: gatto e pesca."
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Capitolo 3: fast-json-tools viene da mirror-veloce.example.com, non da deb.debian.org.",
                        "Capitolo 1: sysupd gira con l'utente nobody.",
                        "Capitolo 4: i server colpiti sono gatto, mela e zebra; pesca non ha il pacchetto."
                    ],
                    explain: "Pacchetto, sorgente, processo, utente e server: ogni dettaglio torna. Caso chiuso!",
                    focus: ["cpu/utente", "sorgente/mirror", "diffusione/server"],
                    hint: "I rapporti differiscono per un dettaglio: la sorgente (cap. 3), l'utente (cap. 1) o i server (cap. 4)."
                }
            }
        ]
    },
    {
        id: "caffe-scomparso",
        title: "Il caffè scomparso",
        synopsis: "Ogni mattina mancano capsule dalla macchinetta del caffè, e sono sempre quelle al ginseng. In ufficio iniziano i sospetti…",
        requiresAct: 2,
        epilogue: "Giulia chiama l'azienda dei distributori: «La calibrazione serale usa davvero quattro capsule?» «Certo, è nel contratto!» Da quel giorno Elena porta le sue capsule di prova, Marco smette di guardare storto i colleghi alla macchinetta e Tommaso scopre che il ginseng gli piace. Il caso più dolce della Pipe & Co. è chiuso.",
        chapters: [
            {
                id: "capsule",
                title: "Le capsule",
                from: "Marco",
                text: "Terza mattina di fila: mancano capsule di ginseng! La macchinetta registra ogni caffè con l'ora e il badge di chi lo prende. Ecco il registro di ieri.",
                puzzles: [
                    {
                        id: "badge",
                        clue: "Il badge che ha preso più capsule",
                        level: {
                            title: "Chi Beve di Più?",
                            source: "cat registro-macchinetta.log",
                            slots: 6,
                            mission: "Ogni riga è <code>ora badge bevanda</code>. Quale badge ha preso <strong>più</strong> capsule? Mostra <code>uniq -c</code> del primo in classifica.",
                            nudge: "Ti serve solo il badge, poi una classifica.",
                            hint: "cut -d' ' -f2, sort, uniq -c, sort -rn, head -n 1.",
                            stdin: ["08:15 B07 espresso", "08:20 B15 cappuccino", "09:02 B50 espresso", "10:30 B07 espresso", "13:10 B21 orzo", "14:45 B15 cappuccino", "21:05 B42 ginseng", "21:06 B50 espresso", "21:07 B42 ginseng", "21:09 B42 ginseng", "21:12 B42 ginseng"],
                            target: ["      4 B42"],
                            allowedCommands: [
                                { cmd: "cut", args: { delim: " ", field: 2 }, desc: "Campo 2 (spazio)" },
                                { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
                                { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" },
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" }
                            ]
                        }
                    },
                    {
                        id: "bevanda",
                        clue: "Cosa prende il badge B42",
                        level: {
                            title: "Che Cosa?",
                            source: "cat registro-macchinetta.log",
                            mission: "Che bevanda prende il badge <code>B42</code>? Una riga sola.",
                            nudge: "Tieni le sue righe, poi la bevanda.",
                            hint: "grep 'B42', cut -d' ' -f3, uniq.",
                            stdin: ["08:15 B07 espresso", "08:20 B15 cappuccino", "09:02 B50 espresso", "10:30 B07 espresso", "13:10 B21 orzo", "14:45 B15 cappuccino", "21:05 B42 ginseng", "21:06 B50 espresso", "21:07 B42 ginseng", "21:09 B42 ginseng", "21:12 B42 ginseng"],
                            target: ["ginseng"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "B42" }, desc: "Tieni le righe con 'B42'" },
                                { cmd: "grep", args: { pattern: "espresso" }, desc: "Tieni le righe con 'espresso'" },
                                { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
                                { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" },
                                { cmd: "wc", desc: "Conta le righe" }
                            ]
                        }
                    },
                    {
                        id: "orari",
                        clue: "Orari del badge B42",
                        level: {
                            title: "Quando?",
                            source: "cat registro-macchinetta.log",
                            mission: "A che ore il badge <code>B42</code> ha preso le capsule? Solo gli orari, nell'ordine del registro.",
                            nudge: "L'ora è il primo campo.",
                            hint: "grep 'B42', poi cut -d' ' -f1.",
                            stdin: ["08:15 B07 espresso", "08:20 B15 cappuccino", "09:02 B50 espresso", "10:30 B07 espresso", "13:10 B21 orzo", "14:45 B15 cappuccino", "21:05 B42 ginseng", "21:06 B50 espresso", "21:07 B42 ginseng", "21:09 B42 ginseng", "21:12 B42 ginseng"],
                            target: ["21:05", "21:07", "21:09", "21:12"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "B42" }, desc: "Tieni le righe con 'B42'" },
                                { cmd: "grep", args: { pattern: "ginseng", invert: true }, desc: "Scarta le righe con 'ginseng'" },
                                { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
                                { cmd: "cut", args: { delim: ":", field: 1 }, desc: "Campo 1 (:)" },
                                { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Cosa succede alle capsule?",
                    options: [
                        "Il badge B42 prende quattro ginseng in sette minuti, alle nove di sera, quando l'ufficio è vuoto",
                        "Marco (B07) beve troppi espressi e fa sparire anche il ginseng",
                        "Le capsule sono difettose e la macchinetta ne butta via una ogni tanto",
                        "Qualcuno prende un ginseng ogni ora, tutto il giorno"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "B07 ha preso due espressi, di mattina: nessun ginseng. E anche B50, che beve espresso a tutte le ore, non c'entra.",
                        "Il registro ha un badge per ogni capsula: nessuna è stata buttata.",
                        "I ginseng sono tutti tra le 21:05 e le 21:12."
                    ],
                    explain: "Quattro ginseng in sette minuti, sempre lo stesso badge, a ufficio chiuso. Ma di chi è B42?",
                    focus: ["capsule/badge", "capsule/bevanda", "capsule/orari"],
                    hint: "Chi ha preso più capsule, quali, e a che ora?"
                }
            },
            {
                id: "b42",
                title: "Il badge B42",
                from: "Giulia",
                text: "Nell'elenco dei badge dei dipendenti B42 non c'è. Alla reception però tengono un registro dei badge prestati agli ospiti. Proviamo lì.",
                puzzles: [
                    {
                        id: "tipo",
                        clue: "Tipo del badge B42",
                        level: {
                            title: "Che Badge È?",
                            source: "cat badge.csv",
                            mission: "L'elenco è <code>badge:tipo:intestatario</code>. Di che <strong>tipo</strong> è il badge <code>B42</code>?",
                            nudge: "I campi sono separati dai due punti.",
                            hint: "grep 'B42', poi cut -d':' -f2.",
                            stdin: ["B07:dipendente:marco", "B15:dipendente:giulia", "B21:dipendente:irene", "B30:dipendente:tommaso", "B42:ospite:reception", "B43:ospite:reception"],
                            target: ["ospite"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "B42" }, desc: "Tieni le righe con 'B42'" },
                                { cmd: "grep", args: { pattern: "ospite" }, desc: "Tieni le righe con 'ospite'" },
                                { cmd: "cut", args: { delim: ":", field: 2 }, desc: "Campo 2 (:)" },
                                { cmd: "cut", args: { delim: ":", field: 3 }, desc: "Campo 3 (:)" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" }
                            ]
                        }
                    },
                    {
                        id: "prestito",
                        clue: "A chi era prestato B42 ieri",
                        level: {
                            title: "Il Prestito",
                            source: "cat prestiti-reception.txt",
                            mission: "Il registro della reception è <code>giorno badge nome motivo</code>. A chi era prestato il badge <code>B42</code> <strong>ieri</strong> (<code>06/11</code>)? Solo il nome.",
                            nudge: "Servono due condizioni: il badge e il giorno.",
                            hint: "Due grep (B42 e 06/11, in qualsiasi ordine), poi cut -d' ' -f3.",
                            stdin: ["05/11 B43 paolo corriere", "05/11 B42 elena distributori", "06/11 B43 sara consulenza", "06/11 B42 elena distributori", "07/11 B42 marta pulizie"],
                            target: ["elena"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "B42" }, desc: "Tieni le righe con 'B42'" },
                                { cmd: "grep", args: { pattern: "06/11" }, desc: "Tieni le righe con '06/11'" },
                                { cmd: "cut", args: { delim: " ", field: 3 }, desc: "Campo 3 (spazio)" },
                                { cmd: "cut", args: { delim: " ", field: 4 }, desc: "Campo 4 (spazio)" },
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Chi aveva il badge B42 ieri sera?",
                    options: [
                        "Elena, dell'azienda che gestisce i distributori: un badge da ospite prestato dalla reception",
                        "Tommaso, che ha perso il suo badge",
                        "Marta delle pulizie",
                        "Nessuno: è un badge clonato"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Il badge di Tommaso è B30, e B42 è un badge da ospite.",
                        "Marta ha avuto B42 oggi (07/11), non ieri.",
                        "B42 è nell'elenco dei badge, e il registro dice a chi è stato prestato."
                    ],
                    explain: "Ieri B42 era di Elena, dell'azienda dei distributori. Cosa ci fa la tecnica della macchinetta con quattro ginseng?",
                    focus: ["b42/tipo", "b42/prestito"],
                    hint: "Il motivo del prestito, nel registro della reception, dice molto."
                }
            },
            {
                id: "manutenzione",
                title: "La manutenzione",
                from: "Tommaso",
                text: "La macchinetta ha anche un registro tecnico! L'ho scaricato dal pannello di servizio. Ci sono parole in maiuscolo dappertutto.",
                puzzles: [
                    {
                        id: "test",
                        clue: "Capsule usate per i test",
                        level: {
                            title: "Quanti Test?",
                            source: "cat registro-tecnico.log",
                            mission: "Quante capsule ha usato la macchinetta per i <strong>test</strong> durante la manutenzione?",
                            nudge: "Ogni test è una riga con TEST.",
                            hint: "grep 'TEST', poi wc -l.",
                            stdin: ["21:03 MANUTENZIONE avvio", "21:05 TEST capsula ginseng ok", "21:07 TEST capsula ginseng ok", "21:09 TEST capsula ginseng ok", "21:12 TEST capsula ginseng ok", "21:14 MANUTENZIONE COMPLETATA: CALIBRAZIONE OK"],
                            target: ["4"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "TEST" }, desc: "Tieni le righe con 'TEST'" },
                                { cmd: "grep", args: { pattern: "MANUTENZIONE" }, desc: "Tieni le righe con 'MANUTENZIONE'" },
                                { cmd: "wc", desc: "Conta le righe" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" }
                            ]
                        }
                    },
                    {
                        id: "esito",
                        clue: "L'ultimo messaggio della manutenzione",
                        level: {
                            title: "Senza Urlare",
                            source: "cat registro-tecnico.log",
                            mission: "Qual è l'<strong>ultimo</strong> messaggio del registro? Ottienilo tutto in minuscolo.",
                            nudge: "L'ultima riga, poi le maiuscole diventano minuscole.",
                            hint: "tail -n 1, poi tr 'A-Z' 'a-z'.",
                            stdin: ["21:03 MANUTENZIONE avvio", "21:05 TEST capsula ginseng ok", "21:07 TEST capsula ginseng ok", "21:09 TEST capsula ginseng ok", "21:12 TEST capsula ginseng ok", "21:14 MANUTENZIONE COMPLETATA: CALIBRAZIONE OK"],
                            target: ["21:14 manutenzione completata: calibrazione ok"],
                            allowedCommands: [
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" },
                                { cmd: "tr", args: { from: "A-Z", to: "a-z" }, desc: "Maiuscole → minuscole" },
                                { cmd: "tr", args: { from: "a-z", to: "A-Z" }, desc: "Minuscole → maiuscole" },
                                { cmd: "grep", args: { pattern: "TEST" }, desc: "Tieni le righe con 'TEST'" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Perché spariscono le capsule di ginseng?",
                    options: [
                        "Ogni sera Elena fa la manutenzione della macchinetta, e per calibrarla usa quattro capsule di ginseng",
                        "Elena si porta a casa le capsule di nascosto",
                        "La macchinetta è rotta e sbaglia a contare le capsule",
                        "I test usano capsule di espresso, non di ginseng"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Il registro tecnico dice che le quattro capsule sono state usate nei test, alla stessa ora dei ginseng.",
                        "L'ultimo messaggio dice che la calibrazione è andata bene.",
                        "Ogni riga TEST dice: capsula ginseng."
                    ],
                    explain: "Quattro test, quattro capsule di ginseng, dalle 21:05 alle 21:12: nessun ladro, solo una calibrazione.",
                    focus: ["capsule/orari", "manutenzione/test", "manutenzione/esito"],
                    hint: "Confronta gli orari dei test con quelli dei ginseng del primo capitolo."
                }
            },
            {
                id: "caso-chiuso",
                title: "Caso chiuso",
                from: "Giulia",
                text: "Prima di scrivere all'azienda dei distributori voglio essere sicura che succeda tutte le sere. Ho il registro dei ginseng di tutta la settimana.",
                puzzles: [
                    {
                        id: "settimana",
                        clue: "Ginseng serali, giorno per giorno",
                        level: {
                            title: "Tutte le Sere?",
                            source: "grep ginseng registro-settimana.log",
                            mission: "Ogni riga è <code>giorno ora badge</code>. Quante capsule di ginseng sono state prese <strong>la sera</strong> (alle 21) di ogni giorno? Mostra <code>uniq -c</code> per giorno, nell'ordine della settimana.",
                            nudge: "Tieni le righe delle 21, poi il giorno, poi conta.",
                            hint: "grep ' 21:', cut -d' ' -f1, uniq -c. Le righe sono già in ordine di giorno: non ordinare, o i giorni finirebbero in ordine alfabetico.",
                            stdin: ["lun 10:12 B15", "lun 21:04 B42", "lun 21:06 B42", "lun 21:08 B42", "lun 21:11 B42", "mar 21:05 B42", "mar 21:07 B42", "mar 21:10 B42", "mar 21:12 B42", "mer 16:30 B21", "mer 21:05 B42", "mer 21:07 B42", "mer 21:09 B42", "mer 21:12 B42"],
                            target: ["      4 lun", "      4 mar", "      4 mer"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: " 21:" }, desc: "Tieni le righe con ' 21:'" },
                                { cmd: "grep", args: { pattern: "B42", invert: true }, desc: "Scarta le righe con 'B42'" },
                                { cmd: "cut", args: { delim: " ", field: 1 }, desc: "Campo 1 (spazio)" },
                                { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
                                { cmd: "sort", desc: "Ordine alfabetico" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Quale messaggio mandi all'azienda dei distributori? Uno solo è giusto in ogni dettaglio.",
                    options: [
                        "Ogni sera alle 21 la vostra tecnica Elena (badge ospite B42) calibra la macchinetta e usa 4 capsule di ginseng nostre. Potete usare capsule di prova vostre?",
                        "Ogni sera alle 21 la vostra tecnica Elena (badge ospite B42) calibra la macchinetta e usa 4 capsule di espresso nostre. Potete usare capsule di prova vostre?",
                        "Ogni sera alle 21 la vostra tecnica Marta (badge ospite B42) calibra la macchinetta e usa 4 capsule di ginseng nostre. Potete usare capsule di prova vostre?",
                        "Ogni sera alle 21 la vostra tecnica Elena (badge ospite B42) calibra la macchinetta e usa 2 capsule di ginseng nostre. Potete usare capsule di prova vostre?"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Capitoli 1 e 3: le capsule dei test sono di ginseng.",
                        "Capitolo 2: ieri B42 era di Elena; Marta l'ha avuto oggi, per le pulizie.",
                        "Capitoli 3 e 4: i test sono quattro, tutte le sere."
                    ],
                    explain: "Ginseng, quattro capsule, tutte le sere alle 21, la tecnica Elena con il badge B42: il mistero del caffè è risolto!",
                    focus: ["capsule/bevanda", "b42/prestito", "manutenzione/test", "caso-chiuso/settimana"],
                    hint: "I messaggi cambiano un solo dettaglio: la bevanda, il nome o il numero di capsule."
                }
            }
        ]
    },
    {
        id: "ultimo-commit",
        title: "L'ultimo commit",
        synopsis: "Ieri mattina, dopo un rilascio, il negozio online ha iniziato a rispondere «500 Internal Server Error». Nessuno ammette di aver toccato niente.",
        requiresAct: 7,
        epilogue: "Tommaso, rosso come un pomodoro, corregge i prezzi e aggiunge un test che rifiuta le virgole. Giulia non lo sgrida: «Il punto decimale l'hanno inventato per farci litigare.» Marco aggiunge al rilascio un controllo con grep: se un prezzo ha la virgola, il deploy si ferma. Il negozio torna a vendere mouse e webcam, e la Pipe & Co. ha un nuovo detto: «Prima di committare, grep la virgola.»",
        chapters: [
            {
                id: "errori",
                title: "Errore 500",
                from: "Giulia",
                text: "I clienti scrivono che il negozio non funziona: carrello e catalogo si rompono. Ecco il log del server web di ieri mattina: ora, metodo, pagina, codice di risposta.",
                puzzles: [
                    {
                        id: "pagine",
                        clue: "Pagine che rispondono 500",
                        level: {
                            title: "Pagine Rotte",
                            source: "cat /var/log/nginx/access.log",
                            mission: "Ogni riga è <code>ora metodo pagina codice</code>. Quali pagine hanno risposto <code>500</code>? Senza ripetizioni, in ordine alfabetico.",
                            nudge: "Il codice è in fondo alla riga; la pagina è il terzo campo.",
                            hint: "grep ' 500', awk '{print $3}', sort, uniq.",
                            stdin: ["10:15 GET /home 200", "10:31 GET /prodotti 200", "10:42 GET /prodotti 500", "10:43 POST /carrello 500", "10:44 GET /home 200", "10:46 GET /prodotti 500", "10:50 GET /contatti 200", "10:52 POST /carrello 500"],
                            target: ["/carrello", "/prodotti"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: " 500" }, desc: "Tieni le righe con ' 500'" },
                                { cmd: "grep", args: { pattern: " 200" }, desc: "Tieni le righe con ' 200'" },
                                { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" }
                            ]
                        }
                    },
                    {
                        id: "inizio",
                        clue: "Ora del primo errore 500",
                        level: {
                            title: "Da Quando?",
                            source: "cat /var/log/nginx/access.log",
                            mission: "A che ora è comparso il <strong>primo</strong> errore <code>500</code>? Solo l'ora.",
                            nudge: "Il log è in ordine di tempo: il primo errore è il primo che trovi.",
                            hint: "grep ' 500', head -n 1, awk '{print $1}'.",
                            stdin: ["10:15 GET /home 200", "10:31 GET /prodotti 200", "10:42 GET /prodotti 500", "10:43 POST /carrello 500", "10:44 GET /home 200", "10:46 GET /prodotti 500", "10:50 GET /contatti 200", "10:52 POST /carrello 500"],
                            target: ["10:42"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: " 500" }, desc: "Tieni le righe con ' 500'" },
                                { cmd: "head", args: { n: 1 }, desc: "Prendi la prima" },
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                                { cmd: "awk", args: { field: 4 }, desc: "Campo 4 di awk" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Cosa sai finora del guasto?",
                    options: [
                        "Dalle 10:42 si rompono le pagine dei prodotti e del carrello: la home e i contatti funzionano",
                        "Il server è spento: non risponde nessuna pagina",
                        "Si è rotta solo la home, dalle 10:15",
                        "Gli errori sono casuali, su tutte le pagine"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "La home risponde 200 anche alle 10:44: il server è acceso.",
                        "La home risponde sempre 200.",
                        "Gli errori sono solo su /prodotti e /carrello, e solo dalle 10:42."
                    ],
                    explain: "Due pagine che hanno a che fare con i prezzi, rotte dalle 10:42. Cos'è successo poco prima?",
                    focus: ["errori/pagine", "errori/inizio"],
                    hint: "Quali pagine danno errore, e da che ora? Le altre pagine come rispondono?"
                }
            },
            {
                id: "rilascio",
                title: "Il rilascio delle 10:41",
                from: "Marco",
                text: "Il server di deploy registra ogni versione messa online, con l'ora e il codice del commit. E da git ho preso l'elenco dei commit di ieri: codice, autore, messaggio.",
                puzzles: [
                    {
                        id: "commit",
                        clue: "Commit messo online alle 10:41",
                        level: {
                            title: "Online alle 10:41",
                            source: "cat deploy.log",
                            mission: "Ogni riga è <code>ora deploy commit</code>. Quale commit è andato online alle <code>10:41</code>, un minuto prima del primo errore?",
                            nudge: "Tieni la riga dell'ora giusta, poi il codice del commit.",
                            hint: "grep '10:41', awk '{print $3}'.",
                            stdin: ["09:16 deploy 4f5e6d7", "10:41 deploy a1b2c3d", "11:30 deploy 9c8b7a6"],
                            target: ["a1b2c3d"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "10:41" }, desc: "Tieni le righe con '10:41'" },
                                { cmd: "grep", args: { pattern: "09:16" }, desc: "Tieni le righe con '09:16'" },
                                { cmd: "awk", args: { field: 3 }, desc: "Campo 3 di awk" },
                                { cmd: "awk", args: { field: 1 }, desc: "Campo 1 di awk" },
                                { cmd: "tail", args: { n: 1 }, desc: "Prendi l'ultima" }
                            ]
                        }
                    },
                    {
                        id: "autore",
                        clue: "Il commit delle 10:41 con autore e messaggio",
                        level: {
                            title: "Chi e Cosa?",
                            source: "git log --format='%h %an %s'",
                            mission: "Unisci l'elenco dei commit con le ore di deploy (<code>ore-deploy.txt</code>) e tieni solo la riga delle <code>10:41</code>: <code>commit autore messaggio ora</code>.",
                            nudge: "join unisce le righe con lo stesso codice di commit, se gli elenchi sono ordinati.",
                            hint: "sort, join - ore-deploy.txt, grep '10:41'.",
                            stdin: ["9c8b7a6 giulia nuove-immagini", "a1b2c3d tommaso aggiorna-prezzi", "4f5e6d7 marco correggi-footer", "77aa310 irene ottimizza-query"],
                            target: ["a1b2c3d tommaso aggiorna-prezzi 10:41"],
                            allowedCommands: [
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "join", args: { file: "ore-deploy.txt", lines: ["4f5e6d7 09:16", "9c8b7a6 11:30", "a1b2c3d 10:41"] }, desc: "Unisci con ore-deploy.txt" },
                                { cmd: "comm", args: { mode: "12", file: "ore-deploy.txt", lines: ["4f5e6d7 09:16", "9c8b7a6 11:30", "a1b2c3d 10:41"] }, desc: "In comune con ore-deploy.txt" },
                                { cmd: "grep", args: { pattern: "10:41" }, desc: "Tieni le righe con '10:41'" },
                                { cmd: "tac", desc: "Rovescia l'ordine delle righe" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Quale modifica è sospetta?",
                    options: [
                        "Il commit a1b2c3d di Tommaso, «aggiorna-prezzi», online alle 10:41: un minuto dopo le pagine con i prezzi si rompono",
                        "Il commit 9c8b7a6 di Giulia, «nuove-immagini»",
                        "Il commit 77aa310 di Irene, «ottimizza-query»",
                        "Il commit 4f5e6d7 di Marco, «correggi-footer», delle 9:16"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "È andato online alle 11:30, quando gli errori c'erano già da un'ora.",
                        "Non è in ore-deploy.txt: quel commit non è mai andato online.",
                        "Alle 9:16 è andato online, ma fino alle 10:42 il negozio ha funzionato."
                    ],
                    explain: "«aggiorna-prezzi» va online alle 10:41, e alle 10:42 si rompono proprio prodotti e carrello.",
                    focus: ["errori/inizio", "rilascio/commit", "rilascio/autore"],
                    hint: "Quale commit è andato online subito prima del primo errore?"
                }
            },
            {
                id: "diff",
                title: "Il diff",
                from: "Tommaso",
                text: "Sì, a1b2c3d è mio… ho solo aggiornato i prezzi del catalogo, giuro! Ecco il diff: le righe con - sono quelle vecchie, quelle con + le nuove.",
                puzzles: [
                    {
                        id: "mouse",
                        clue: "Il prezzo del mouse, prima e dopo",
                        level: {
                            title: "Il Mouse",
                            source: "git show a1b2c3d",
                            mission: "Mostra le righe del diff che riguardano il <code>mouse</code>, <strong>numerate</strong> come <code>1. ...</code>.",
                            nudge: "Prima filtra, poi numera.",
                            hint: "grep 'mouse', poi nl -w1 -s'. '.",
                            stdin: ["- mouse;19.90", "+ mouse;19,90", "- tastiera;49.90", "+ tastiera;47.90", "- cavo;4,50", "+ cavo;4.50", "- monitor;199.00", "+ monitor;189,00", "- webcam;59.90", "+ webcam;54,90"],
                            target: ["1. - mouse;19.90", "2. + mouse;19,90"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "mouse" }, desc: "Tieni le righe con 'mouse'" },
                                { cmd: "grep", args: { pattern: "+" }, desc: "Tieni le righe con '+'" },
                                { cmd: "nl", args: { width: 1, separator: ". " }, desc: "Numera: 1. 2. 3." },
                                { cmd: "nl", desc: "Numera (formato standard)" },
                                { cmd: "sort", desc: "Ordine alfabetico" }
                            ]
                        }
                    },
                    {
                        id: "virgole",
                        clue: "Righe nuove con la virgola",
                        level: {
                            title: "Punti e Virgole",
                            source: "git show a1b2c3d",
                            mission: "Quante righe <strong>nuove</strong> (quelle con <code>+</code>) hanno il prezzo scritto con la virgola?",
                            nudge: "Due condizioni: riga nuova, e una virgola. Attenzione: anche una riga vecchia ha la virgola.",
                            hint: "grep '+', grep ',', wc -l.",
                            stdin: ["- mouse;19.90", "+ mouse;19,90", "- tastiera;49.90", "+ tastiera;47.90", "- cavo;4,50", "+ cavo;4.50", "- monitor;199.00", "+ monitor;189,00", "- webcam;59.90", "+ webcam;54,90"],
                            target: ["3"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "+" }, desc: "Tieni le righe con '+'" },
                                { cmd: "grep", args: { pattern: "," }, desc: "Tieni le righe con ','" },
                                { cmd: "grep", args: { pattern: "cavo", invert: true }, desc: "Scarta le righe con 'cavo'" },
                                { cmd: "wc", desc: "Conta le righe" },
                                { cmd: "uniq", desc: "Rimuovi duplicati" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Cosa c'è di sbagliato nel commit di Tommaso?",
                    options: [
                        "Ha scritto alcuni prezzi con la virgola, all'italiana: il programma del negozio si aspetta il punto decimale",
                        "Ha cancellato dei prodotti dal catalogo",
                        "Ha alzato tutti i prezzi",
                        "Ha sbagliato solo il prezzo della tastiera"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Ogni riga tolta (-) ha la sua riga nuova (+): nessun prodotto è sparito.",
                        "Il mouse resta a 19,90 e gli altri scendono: nessun aumento.",
                        "Tastiera e cavo hanno il punto: sono proprio le righe giuste (il cavo, anzi, prima aveva la virgola)."
                    ],
                    explain: "19.90 diventa 19,90: per una persona è lo stesso prezzo, per il programma del negozio non è più un numero.",
                    focus: ["diff/mouse", "diff/virgole"],
                    hint: "Confronta la riga vecchia e quella nuova del mouse, carattere per carattere."
                }
            },
            {
                id: "catalogo",
                title: "Quali prodotti",
                from: "Giulia",
                text: "Devo avvisare il reparto vendite. Dal catalogo online di adesso mi serve sapere quanti prodotti hanno il prezzo sbagliato, e vedere i loro nomi.",
                puzzles: [
                    {
                        id: "prodotti",
                        clue: "Prodotti con la virgola (stdout: quanti; stderr: quali)",
                        level: {
                            title: "Il Catalogo",
                            source: "curl -s https://negozio.example/catalogo.csv",
                            slots: 5,
                            mission: "Ogni riga è <code>nome;prezzo</code>. Allo stdout serve <strong>quanti</strong> prezzi hanno la virgola; sul terminale (stderr) i <strong>nomi</strong> di quei prodotti, in ordine alfabetico.",
                            nudge: "Un raccordo a T: i nomi sul terminale, il conteggio nella pipe.",
                            hint: "grep ',', cut -d';' -f1, sort, tee /dev/stderr, wc -l.",
                            stdin: ["mouse;19,90", "tastiera;47.90", "monitor;189,00", "cavo;4.50", "webcam;54,90", "cuffie;29.90"],
                            target: ["3"],
                            targetStderr: ["monitor", "mouse", "webcam"],
                            allowedCommands: [
                                { cmd: "grep", args: { pattern: "," }, desc: "Tieni le righe con ','" },
                                { cmd: "cut", args: { delim: ";", field: 1 }, desc: "Campo 1 (;)" },
                                { cmd: "sort", desc: "Ordine alfabetico" },
                                { cmd: "tee", args: { file: "/dev/stderr" }, desc: "Copia sul terminale" },
                                { cmd: "tee", args: { file: "sbagliati.txt" }, desc: "Copia in un file" },
                                { cmd: "wc", desc: "Conta le righe" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Perché si rompono proprio prodotti e carrello, e non la home?",
                    options: [
                        "Sono le pagine che leggono i prezzi: con la virgola il prezzo di monitor, mouse e webcam non è più un numero e il programma va in errore",
                        "La home è in cache e non si aggiorna mai",
                        "Il carrello ha un bug da sempre, non c'entra il commit",
                        "Sono le pagine più visitate, e il server non regge il traffico"
                    ],
                    answer: 0,
                    why: [
                        "",
                        "La home semplicemente non mostra prezzi: non le serve leggerli.",
                        "Prima delle 10:42 il carrello funzionava.",
                        "Il traffico è basso, e gli errori iniziano esattamente dopo il rilascio."
                    ],
                    explain: "Le pagine che leggono i prezzi trovano tre prezzi che non sono numeri: errore 500.",
                    focus: ["errori/pagine", "catalogo/prodotti"],
                    hint: "Cosa hanno in comune le pagine rotte, rispetto a home e contatti?"
                }
            },
            {
                id: "caso-chiuso",
                title: "Caso chiuso",
                from: "Marco",
                text: "Ho preparato la correzione per il catalogo: cambiare la virgola in punto. Nel file la virgola compare solo nei prezzi sbagliati, quindi si può fare in un colpo solo. Controlliamo il risultato prima di rimetterlo online.",
                puzzles: [
                    {
                        id: "correzione",
                        clue: "Il catalogo corretto",
                        level: {
                            title: "La Correzione",
                            source: "curl -s https://negozio.example/catalogo.csv",
                            mission: "Correggi il catalogo: ogni virgola diventa un punto. Lascia tutte le righe, nello stesso ordine.",
                            nudge: "Un carattere da cambiare con un altro, ovunque.",
                            hint: "tr ',' '.' cambia ogni virgola in un punto, su tutte le righe.",
                            stdin: ["mouse;19,90", "tastiera;47.90", "monitor;189,00", "cavo;4.50", "webcam;54,90", "cuffie;29.90"],
                            target: ["mouse;19.90", "tastiera;47.90", "monitor;189.00", "cavo;4.50", "webcam;54.90", "cuffie;29.90"],
                            allowedCommands: [
                                { cmd: "tr", args: { from: ",", to: "." }, desc: ", → ." },
                                { cmd: "tr", args: { from: ".", to: "," }, desc: ". → ," },
                                { cmd: "grep", args: { pattern: "," }, desc: "Tieni le righe con ','" },
                                { cmd: "sort", desc: "Ordine alfabetico" }
                            ]
                        }
                    }
                ],
                question: {
                    text: "Quale rapporto mandi alla direzione? Uno solo è giusto in ogni dettaglio.",
                    options: [
                        "Alle 10:41 è andato online il commit a1b2c3d (aggiorna-prezzi) di Tommaso: 3 prezzi scritti con la virgola (monitor, mouse, webcam) hanno rotto /prodotti e /carrello dalle 10:42. Corretti cambiando la virgola in punto.",
                        "Alle 10:41 è andato online il commit 9c8b7a6 (aggiorna-prezzi) di Tommaso: 3 prezzi scritti con la virgola (monitor, mouse, webcam) hanno rotto /prodotti e /carrello dalle 10:42. Corretti cambiando la virgola in punto.",
                        "Alle 10:41 è andato online il commit a1b2c3d (aggiorna-prezzi) di Tommaso: 4 prezzi scritti con la virgola (monitor, mouse, webcam, tastiera) hanno rotto /prodotti e /carrello dalle 10:42. Corretti cambiando la virgola in punto.",
                        "Alle 10:41 è andato online il commit a1b2c3d (aggiorna-prezzi) di Tommaso: 3 prezzi scritti con la virgola (monitor, mouse, webcam) hanno rotto /home e /contatti dalle 10:42. Corretti cambiando la virgola in punto."
                    ],
                    answer: 0,
                    why: [
                        "",
                        "Capitolo 2: alle 10:41 è andato online a1b2c3d; 9c8b7a6 è di Giulia, delle 11:30.",
                        "Capitoli 3 e 4: le virgole sono 3; la tastiera ha il punto.",
                        "Capitolo 1: home e contatti hanno sempre risposto 200."
                    ],
                    explain: "Commit, ora, prezzi, prodotti e pagine: ogni dettaglio torna. Caso chiuso!",
                    focus: ["errori/pagine", "rilascio/autore", "diff/virgole", "catalogo/prodotti"],
                    hint: "I rapporti cambiano un dettaglio: il codice del commit, quanti prezzi o quali pagine."
                }
            }
        ]
    }
];
