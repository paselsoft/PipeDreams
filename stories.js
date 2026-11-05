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
    }
];
