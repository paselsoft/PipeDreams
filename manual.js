// Manuale dei comandi. Gli esempi non contengono l'output: il gioco lo calcola con il motore
// (executePipeline) e tools/check-shell.js verifica che coincida con bash.
// cmds elenca le chiavi di COMMANDS spiegate dalla scheda: servono a mostrare in cima
// le schede dei comandi disponibili nel livello corrente.
// Gli esempi usano dati diversi dai livelli, per insegnare il comando senza svelare le soluzioni.
const MANUAL = [
    {
        id: "pipe",
        name: "|",
        cmds: [],
        summary: "Collega i comandi: l'output di uno diventa l'input del successivo.",
        syntax: "comando1 | comando2 | comando3",
        description: "La pipe passa lo stdout di un comando allo stdin del successivo. In Pipe Dreams ogni slot è un comando della catena, e gli slot vuoti vengono saltati. Lo stderr non attraversa la pipe: va dritto al terminale.",
        examples: [
            { title: "Due comandi in fila", input: ["pera", "mela", "pera"], steps: [{ cmd: "sort" }, { cmd: "uniq" }] },
            { title: "L'ordine conta", input: ["pera", "mela", "pera"], steps: [{ cmd: "uniq" }, { cmd: "sort" }],
              note: "Stessi comandi, ordine inverso: uniq lavora prima che le due 'pera' siano vicine." },
            { title: "Lo stderr salta la pipe", input: ["casa", { err: "errore: disco" }, "cane"], steps: [{ cmd: "grep", args: { pattern: "a" } }],
              note: "grep non vede la riga di errore: finisce sul terminale (riga rossa)." }
        ],
        traps: ["L'ordine dei comandi cambia il risultato: prova sempre a chiederti cosa riceve ogni slot."]
    },
    {
        id: "grep",
        name: "grep",
        cmds: ["grep"],
        summary: "Tiene (o con -v scarta) le righe che contengono un testo.",
        syntax: "grep [-v] 'testo'",
        description: "Legge le righe una per una e tiene solo quelle che contengono il testo indicato, in qualunque punto della riga.",
        options: [
            { flag: "-v", text: "inverte la selezione: tiene le righe che NON contengono il testo" },
            { flag: "-o", text: "stampa solo il testo trovato, una riga per ogni volta che compare (anche più volte nella stessa riga)" }
        ],
        examples: [
            { title: "Tenere le righe", input: ["gatto", "cane", "topo", "ratto"], steps: [{ cmd: "grep", args: { pattern: "at" } }] },
            { title: "Scartare le righe", input: ["gatto", "cane", "topo", "ratto"], steps: [{ cmd: "grep", args: { pattern: "at", invert: true } }] },
            { title: "Maiuscole e minuscole contano", input: ["Mario", "marco", "MARTA"], steps: [{ cmd: "grep", args: { pattern: "mar" } }],
              note: "Solo 'marco' contiene esattamente 'mar' minuscolo." },
            { title: "Basta una parte della riga", input: ["login anna", "logout anna", "blog"], steps: [{ cmd: "grep", args: { pattern: "log" } }],
              note: "'log' è contenuto anche in 'logout' e 'blog'." },
            { title: "Contare le occorrenze con -o", input: ["banana", "ananas", "kiwi"], steps: [{ cmd: "grep", args: { pattern: "an", only: true } }, { cmd: "wc" }],
              note: "grep -o stampa 'an' per ogni volta che compare: 2 in banana, 2 in ananas. wc -l le conta tutte, non le righe." }
        ],
        traps: [
            "Distingue maiuscole e minuscole: per trovare 'warn' e 'WARN' insieme, prima uniformale.",
            "Cerca un pezzo di testo, non una parola intera: 'log' trova anche 'logout'.",
            "grep | wc -l conta le righe che contengono il testo; grep -o | wc -l conta quante volte compare."
        ]
    },
    {
        id: "sort",
        name: "sort",
        cmds: ["sort"],
        summary: "Ordina le righe (alfabetico, numerico, crescente o decrescente).",
        syntax: "sort [-r] [-n] [-t'X' -kN,N]",
        description: "Riordina le righe. Senza opzioni confronta i caratteri uno per uno nell'ordine dei byte: le cifre vengono prima delle maiuscole, che vengono prima delle minuscole.",
        options: [
            { flag: "-r", text: "ordine inverso (decrescente)" },
            { flag: "-n", text: "ordina per valore numerico del numero all'inizio della riga (o della chiave)" },
            { flag: "-t'X' -kN,N", text: "ordina in base al solo campo N, con i campi separati dal carattere X" }
        ],
        examples: [
            { title: "Ordine alfabetico", input: ["pera", "banana", "mela"], steps: [{ cmd: "sort" }] },
            { title: "Le maiuscole vengono prima", input: ["banana", "Mela", "ananas"], steps: [{ cmd: "sort" }] },
            { title: "Numeri ordinati come testo", input: ["10", "9", "100"], steps: [{ cmd: "sort" }],
              note: "Come testo '10' viene prima di '9', perché '1' viene prima di '9'." },
            { title: "Numeri ordinati per valore", input: ["10", "9", "100"], steps: [{ cmd: "sort", args: { numeric: true } }] },
            { title: "Dal più grande", input: ["5 anna", "12 luca", "8 eva"], steps: [{ cmd: "sort", args: { numeric: true, reverse: true } }] },
            { title: "Ordinare per un campo", input: ["anna,roma,30", "luca,bari,25", "eva,asti,41"], steps: [{ cmd: "sort", args: { separator: ",", key: 2 } }],
              note: "Le righe restano intere, ma l'ordine dipende solo dalla città (campo 2)." },
            { title: "Per un campo numerico", input: ["anna,roma,30", "luca,bari,5", "eva,asti,41"], steps: [{ cmd: "sort", args: { separator: ",", key: 3, numeric: true, reverse: true } }] }
        ],
        traps: [
            "Con -k scrivi sempre N,N: -k2 da solo vuol dire 'dal campo 2 fino a fine riga'.",
            "Senza -n i numeri si ordinano come testo: '10' prima di '9'.",
            "Ordina la riga intera: se ti interessa un solo campo, estrailo prima (cut, awk).",
            "Mette vicine le righe uguali: è il passo che serve prima di uniq."
        ]
    },
    {
        id: "uniq",
        name: "uniq",
        cmds: ["uniq"],
        summary: "Rimuove le righe uguali consecutive; con -c le conta, con -d tiene solo i doppioni.",
        syntax: "uniq [-c] [-d]",
        description: "Quando più righe uguali sono una dopo l'altra, ne tiene una sola. Le righe uguali ma lontane non vengono toccate.",
        options: [
            { flag: "-c", text: "antepone a ogni riga quante volte si ripeteva (allineato a destra con spazi)" },
            { flag: "-d", text: "tiene solo le righe ripetute, una volta ciascuna" }
        ],
        examples: [
            { title: "Doppioni vicini", input: ["a", "a", "b", "b", "b"], steps: [{ cmd: "uniq" }] },
            { title: "Doppioni lontani: non li vede", input: ["a", "b", "a"], steps: [{ cmd: "uniq" }] },
            { title: "Prima sort, poi uniq", input: ["a", "b", "a"], steps: [{ cmd: "sort" }, { cmd: "uniq" }] },
            { title: "Contare le ripetizioni", input: ["b", "a", "b", "a", "a"], steps: [{ cmd: "sort" }, { cmd: "uniq", args: { count: true } }],
              note: "Il numero è allineato a destra con molti spazi: conta per cut e awk." },
            { title: "Solo i doppioni", input: ["luca", "anna", "luca", "eva"], steps: [{ cmd: "sort" }, { cmd: "uniq", args: { repeated: true } }],
              note: "Solo 'luca' compare più di una volta." }
        ],
        traps: [
            "Funziona solo su righe adiacenti: quasi sempre serve un sort prima.",
            "uniq -c lascia spazi all'inizio della riga: per estrarre i campi usa awk, non cut."
        ]
    },
    {
        id: "headtail",
        name: "head / tail",
        cmds: ["head", "tail"],
        summary: "Tengono le prime (head) o le ultime (tail) N righe.",
        syntax: "head -n N   /   tail -n N",
        description: "head tiene le prime N righe del flusso, tail le ultime N. Non riordinano nulla: prendono le righe nell'ordine in cui arrivano.",
        options: [{ flag: "-n N", text: "quante righe tenere" }],
        examples: [
            { title: "Le prime due", input: ["uno", "due", "tre", "quattro"], steps: [{ cmd: "head", args: { n: 2 } }] },
            { title: "Le ultime due", input: ["uno", "due", "tre", "quattro"], steps: [{ cmd: "tail", args: { n: 2 } }] },
            { title: "Il primo in classifica", input: ["5 anna", "12 luca", "8 eva"], steps: [{ cmd: "sort", args: { numeric: true, reverse: true } }, { cmd: "head", args: { n: 1 } }] }
        ],
        traps: [
            "Tagliano nell'ordine attuale: per 'i più grandi' o 'i primi in ordine alfabetico' ordina prima.",
            "Se tagli prima di togliere i doppioni, puoi ritrovarti righe uguali."
        ]
    },
    {
        id: "tacrev",
        name: "tac / rev",
        cmds: ["tac", "rev"],
        summary: "tac rovescia l'ordine delle righe, rev i caratteri di ogni riga.",
        syntax: "tac   /   rev",
        description: "tac (cat al contrario) restituisce le righe dall'ultima alla prima, senza ordinarle. rev lascia le righe al loro posto ma scrive ogni riga da destra a sinistra.",
        examples: [
            { title: "Dall'ultima alla prima", input: ["primo", "secondo", "terzo"], steps: [{ cmd: "tac" }] },
            { title: "tac non è sort -r", input: ["b", "c", "a"], steps: [{ cmd: "tac" }],
              note: "sort -r darebbe c, b, a: tac rovescia l'ordine di arrivo, non ordina." },
            { title: "Ogni riga al contrario", input: ["roma", "anna"], steps: [{ cmd: "rev" }],
              note: "'anna' è palindroma: al contrario resta uguale." },
            { title: "L'ultimo pezzo di ogni riga", input: ["foto.vacanze.jpg", "note.txt"], steps: [{ cmd: "rev" }, { cmd: "cut", args: { delim: ".", field: 1 } }, { cmd: "rev" }],
              note: "Trucco classico: rev, prendi il primo campo, rev di nuovo. Così ottieni l'estensione anche se i punti sono tanti." }
        ],
        traps: [
            "tac rovescia l'ordine in cui le righe arrivano: se vuoi l'ordine alfabetico inverso serve sort -r.",
            "rev rovescia i caratteri, non le parole: 'ciao mondo' diventa 'odnom oaic'."
        ]
    },
    {
        id: "wc",
        name: "wc -l",
        cmds: ["wc"],
        summary: "Conta le righe del flusso.",
        syntax: "wc -l",
        description: "Sostituisce il flusso con una sola riga: il numero di righe ricevute.",
        examples: [
            { title: "Contare le righe", input: ["rosso", "verde", "blu"], steps: [{ cmd: "wc" }] },
            { title: "Contare solo alcune righe", input: ["ok", "errore", "ok", "errore", "errore"], steps: [{ cmd: "grep", args: { pattern: "errore" } }, { cmd: "wc" }] },
            { title: "Contare i valori diversi", input: ["anna", "luca", "anna"], steps: [{ cmd: "sort" }, { cmd: "uniq" }, { cmd: "wc" }] }
        ],
        traps: ["Conta tutto quello che arriva: filtra prima le righe che ti interessano."]
    },
    {
        id: "cut",
        name: "cut",
        cmds: ["cut", "cutc"],
        summary: "Divide ogni riga su un carattere e tiene un campo, oppure tiene alcuni caratteri.",
        syntax: "cut -d'X' -fN   /   cut -cN-M",
        description: "Spezza ogni riga a ogni occorrenza del delimitatore X e tiene il campo numero N (il primo è 1). Ogni singolo delimitatore separa un campo, anche se ce ne sono due di fila.",
        options: [
            { flag: "-d'X'", text: "il carattere delimitatore (uno solo)" },
            { flag: "-fN", text: "il numero del campo da tenere" },
            { flag: "-cN-M", text: "tiene i caratteri dal numero N al numero M (il primo è 1); -cN un carattere solo" }
        ],
        examples: [
            { title: "Il primo campo", input: ["anna:30:Roma", "luca:25:Milano"], steps: [{ cmd: "cut", args: { delim: ":", field: 1 } }] },
            { title: "Il terzo campo", input: ["anna:30:Roma", "luca:25:Milano"], steps: [{ cmd: "cut", args: { delim: ":", field: 3 } }] },
            { title: "Righe senza delimitatore", input: ["a:b", "solo"], steps: [{ cmd: "cut", args: { delim: ":", field: 2 } }],
              note: "Una riga senza ':' passa intera." },
            { title: "Spazi multipli: campi vuoti", input: ["10  mele", "  3 pere"], steps: [{ cmd: "cut", args: { delim: " ", field: 2 } }],
              note: "Fra due spazi c'è un campo vuoto: per le colonne allineate usa awk." },
            { title: "I primi caratteri", input: ["IT-2024-001", "FR-2023-017"], steps: [{ cmd: "cutc", args: { from: 1, to: 2 } }] },
            { title: "Caratteri in mezzo", input: ["IT-2024-001", "FR-2023-017"], steps: [{ cmd: "cutc", args: { from: 4, to: 7 } }],
              note: "Funziona bene quando ogni riga ha la stessa forma, come i codici." }
        ],
        traps: [
            "Con spazi ripetuti o iniziali i campi si spostano: meglio awk.",
            "cut -c conta i caratteri: se le righe hanno lunghezze diverse, i pezzi non si allineano.",
            "Dopo il cut il resto della riga sparisce: filtra con grep prima, se ti serve."
        ]
    },
    {
        id: "tr",
        name: "tr",
        cmds: ["tr"],
        summary: "Sostituisce o cancella singoli caratteri.",
        syntax: "tr 'DA' 'A'   /   tr -d 'CARATTERI'",
        description: "Sostituisce ogni carattere della prima lista con quello nella stessa posizione della seconda. Le liste accettano intervalli come a-z. Con -d cancella i caratteri indicati. Se un carattere diventa \\n (a capo), la riga si spezza.",
        options: [{ flag: "-d", text: "cancella i caratteri invece di sostituirli" }],
        examples: [
            { title: "Maiuscolo con gli intervalli", input: ["ciao mondo"], steps: [{ cmd: "tr", args: { from: "a-z", to: "A-Z" } }] },
            { title: "Cancellare le cifre", input: ["a1b2c3"], steps: [{ cmd: "tr", args: { delete: "0-9" } }] },
            { title: "Un elemento per riga", input: ["rosso,verde,blu"], steps: [{ cmd: "tr", args: { from: ",", to: "\n" } }] },
            { title: "Carattere per carattere, non parole", input: ["abba"], steps: [{ cmd: "tr", args: { from: "ab", to: "xy" } }],
              note: "Ogni 'a' diventa 'x' e ogni 'b' diventa 'y': per sostituire parole intere usa sed." }
        ],
        traps: ["Lavora sui singoli caratteri: tr 'gatto' 'cane' non sostituisce la parola."]
    },
    {
        id: "upper",
        name: "sed 's/.*/\\U&/'",
        cmds: ["upper"],
        summary: "Converte ogni riga in maiuscolo.",
        syntax: "sed 's/.*/\\U&/'",
        description: "Una sostituzione di sed: .* prende tutta la riga, & la reinserisce e \\U la rende maiuscola. È un'estensione di GNU sed (Linux).",
        examples: [
            { title: "Tutto maiuscolo", input: ["Ciao Mondo", "test"], steps: [{ cmd: "upper" }] },
            { title: "Uniformare prima di ordinare", input: ["mela", "Mela", "pera"], steps: [{ cmd: "upper" }, { cmd: "sort" }, { cmd: "uniq" }],
              note: "'mela' e 'Mela' diventano uguali, quindi uniq le unisce." }
        ],
        traps: ["Dopo il maiuscolo cambiano anche i confronti: grep 'warn' non troverà più 'WARN'."]
    },
    {
        id: "sed",
        name: "sed -E",
        cmds: ["sed"],
        summary: "Sostituisce il testo che corrisponde a un'espressione regolare.",
        syntax: "sed -E 's/REGEX/SOSTITUZIONE/[g]'",
        description: "Cerca in ogni riga il testo che corrisponde alla regex e lo sostituisce. Senza g cambia solo la prima corrispondenza della riga. Nella regex: . un carattere qualsiasi, [0-9] una cifra, + una o più volte, * zero o più volte, ^ inizio riga, $ fine riga. Le parentesi ( ) catturano un gruppo, che nella sostituzione richiami con \\1, \\2... e & è l'intera corrispondenza. Se compare una /, il delimitatore diventa #.",
        options: [{ flag: "g", text: "sostituisce tutte le corrispondenze della riga, non solo la prima" }],
        examples: [
            { title: "Solo la prima volta", input: ["il gatto e il gatto"], steps: [{ cmd: "sed", args: { pattern: "gatto", replacement: "cane" } }] },
            { title: "Tutte le volte (g)", input: ["il gatto e il gatto"], steps: [{ cmd: "sed", args: { pattern: "gatto", replacement: "cane", global: true } }] },
            { title: "Classi e ripetizioni", input: ["tel 333 e 4444"], steps: [{ cmd: "sed", args: { pattern: "[0-9]+", replacement: "N", global: true } }] },
            { title: "Gruppi: scambiare due parole", input: ["Rossi Mario", "Bianchi Anna"], steps: [{ cmd: "sed", args: { pattern: "([A-Za-z]+) ([A-Za-z]+)", replacement: "\\2 \\1" } }] },
            { title: "& riusa la corrispondenza", input: ["a 1 b 22"], steps: [{ cmd: "sed", args: { pattern: "[0-9]+", replacement: "[&]", global: true } }] },
            { title: "Cancellare un pezzo", input: ["x = 1   # commento", "y = 2"], steps: [{ cmd: "sed", args: { pattern: " *#.*" } }] }
        ],
        traps: [
            "Senza g cambia solo la prima corrispondenza di ogni riga.",
            "Una regex troppo generica colpisce più del previsto: [0-9]+ trova anche i numeri dentro le parole.",
            ".* è avido: prende il pezzo più lungo possibile."
        ]
    },
    {
        id: "awk",
        name: "awk",
        cmds: ["awk"],
        summary: "Stampa un campo della riga, separando sui gruppi di spazi.",
        syntax: "awk '{print $N}'   /   awk -F'X' '{print $N}'",
        description: "Divide ogni riga in campi e stampa il campo N. Senza -F i campi sono separati da uno o più spazi, e gli spazi iniziali vengono ignorati: perfetto per colonne allineate. Con -F'X' divide esattamente sul carattere X, come cut.",
        options: [{ flag: "-F'X'", text: "usa X come separatore dei campi" }],
        examples: [
            { title: "Colonne allineate", input: ["  10   mele", "   3   pere"], steps: [{ cmd: "awk", args: { field: 2 } }] },
            { title: "Lo stesso input con cut", input: ["  10   mele", "   3   pere"], steps: [{ cmd: "cut", args: { delim: " ", field: 2 } }],
              note: "cut vede campi vuoti fra gli spazi: awk invece li salta." },
            { title: "Separatore scelto con -F", input: ["anna:30:Roma", "luca:25:Milano"], steps: [{ cmd: "awk", args: { field: 1, separator: ":" } }] },
            { title: "Dopo uniq -c", input: ["b", "a", "b"], steps: [{ cmd: "sort" }, { cmd: "uniq", args: { count: true } }, { cmd: "awk", args: { field: 2 } }],
              note: "Il campo 1 è il conteggio, il campo 2 la riga originale." }
        ],
        traps: ["Un campo che non esiste produce una riga vuota."]
    },
    {
        id: "nl",
        name: "nl",
        cmds: ["nl"],
        summary: "Numera le righe.",
        syntax: "nl [-ba] [-wN] [-s'X']",
        description: "Mette davanti a ogni riga il suo numero. Per default numera solo le righe non vuote, allinea il numero a destra su 6 caratteri e lo separa dalla riga con una tabulazione.",
        options: [
            { flag: "-ba", text: "numera tutte le righe, anche quelle vuote" },
            { flag: "-wN", text: "larghezza del numero (es. -w1: niente spazi davanti)" },
            { flag: "-s'X'", text: "cosa mettere tra il numero e la riga (es. -s'. ' per «1. riga»)" }
        ],
        examples: [
            { title: "Elenco numerato", input: ["pane", "latte", "uova"], steps: [{ cmd: "nl", args: { width: 1, separator: ". " } }] },
            { title: "Le righe vuote non si contano", input: ["pane", "", "uova"], steps: [{ cmd: "nl", args: { width: 1, separator: ". " } }] },
            { title: "Con -ba si contano tutte", input: ["pane", "", "uova"], steps: [{ cmd: "nl", args: { all: true, width: 1, separator: ". " } }] },
            { title: "Classifica numerata", input: ["5 anna", "12 luca", "8 eva"], steps: [{ cmd: "sort", args: { numeric: true, reverse: true } }, { cmd: "nl", args: { width: 1, separator: ") " } }],
              note: "nl va alla fine: numera le righe nell'ordine in cui le riceve." }
        ],
        traps: [
            "Senza -w e -s il numero è largo 6 caratteri e seguito da una tabulazione.",
            "nl numera l'ordine attuale: se ordini dopo, i numeri si mescolano."
        ]
    },
    {
        id: "tee",
        name: "tee",
        cmds: ["tee"],
        summary: "Lascia passare il flusso e intanto ne salva una copia.",
        syntax: "tee file   /   tee /dev/stderr",
        description: "Come un raccordo a T in un tubo: il flusso continua nella pipe e una copia finisce in un file. Con tee /dev/stderr la copia va sullo stderr, cioè sul terminale: utile per vedere i dati a metà pipeline.",
        examples: [
            { title: "Vedere i dati a metà strada", input: ["b", "a", "b"], steps: [{ cmd: "sort" }, { cmd: "uniq" }, { cmd: "tee", args: { file: "/dev/stderr" } }, { cmd: "wc" }],
              note: "Lo stdout è solo il conteggio, ma sul terminale (stderr) vedi anche l'elenco che è stato contato." },
            { title: "Salvare una copia", input: ["b", "a"], steps: [{ cmd: "sort" }, { cmd: "tee", args: { file: "ordinati.txt" } }, { cmd: "head", args: { n: 1 } }],
              note: "Nel gioco il file non si vede, ma in bash ordinati.txt conterrebbe l'elenco intero." },
            { title: "La copia può entrare nella pipe", input: ["b", "a"], steps: [{ cmd: "sort" }, { cmd: "tee", args: { file: "/dev/stderr" } }, { cmd: "merge" }, { cmd: "wc" }],
              note: "Con 2>&1 anche la copia su stderr entra nella pipe: wc conta 4 righe." }
        ],
        traps: ["tee non cambia il flusso: tutto quello che entra esce uguale."]
    },
    {
        id: "comm",
        name: "comm",
        cmds: ["comm"],
        summary: "Confronta due elenchi ordinati: righe in comune, solo nel primo, solo nel secondo.",
        syntax: "comm -12 - file   /   comm -23 - file   /   comm -13 - file",
        description: "Legge due elenchi ordinati (qui lo stdin, scritto -, e un file) e li divide in tre colonne: righe solo nel primo, solo nel secondo, in entrambi. Le opzioni dicono quali colonne nascondere.",
        options: [
            { flag: "-12", text: "nasconde le colonne 1 e 2: restano le righe in comune" },
            { flag: "-23", text: "restano le righe solo nello stdin" },
            { flag: "-13", text: "restano le righe solo nel file" }
        ],
        examples: [
            { title: "In comune", input: ["mela", "pera", "uva"], steps: [{ cmd: "comm", args: { mode: "12", file: "spesa.txt", lines: ["kiwi", "pera", "uva"] } }] },
            { title: "Solo nello stdin", input: ["mela", "pera", "uva"], steps: [{ cmd: "comm", args: { mode: "23", file: "spesa.txt", lines: ["kiwi", "pera", "uva"] } }] },
            { title: "Solo nel file", input: ["mela", "pera", "uva"], steps: [{ cmd: "comm", args: { mode: "13", file: "spesa.txt", lines: ["kiwi", "pera", "uva"] } }] },
            { title: "Input non ordinato", input: ["uva", "mela"], steps: [{ cmd: "comm", args: { mode: "12", file: "spesa.txt", lines: ["kiwi", "pera", "uva"] } }],
              note: "comm si aspetta elenchi ordinati: lo avvisa su stderr e il confronto è sbagliato. Prima ordina." },
            { title: "Prima sort, poi comm", input: ["uva", "mela"], steps: [{ cmd: "sort" }, { cmd: "comm", args: { mode: "12", file: "spesa.txt", lines: ["kiwi", "pera", "uva"] } }] }
        ],
        traps: [
            "Entrambi gli elenchi devono essere ordinati: quasi sempre serve un sort prima.",
            "Confronta righe intere: 'uva' e 'uva ' (con uno spazio) sono diverse."
        ]
    },
    {
        id: "join",
        name: "join",
        cmds: ["join"],
        summary: "Unisce le righe di due file che hanno lo stesso primo campo.",
        syntax: "join [-t'X'] - file",
        description: "Come unire due tabelle su una colonna in comune. Per ogni riga dello stdin e del file con lo stesso primo campo (la chiave) scrive: chiave, resto della riga dello stdin, resto della riga del file. Le righe senza coppia spariscono. Entrambi gli input devono essere ordinati sulla chiave.",
        options: [{ flag: "-t'X'", text: "i campi sono separati dal carattere X (senza -t: da spazi)" }],
        examples: [
            { title: "Due tabelle unite", input: ["anna 30", "luca 25"], steps: [{ cmd: "join", args: { file: "citta.txt", lines: ["anna roma", "luca bari"] } }] },
            { title: "Solo le chiavi in comune", input: ["anna 30", "eva 41", "luca 25"], steps: [{ cmd: "join", args: { file: "citta.txt", lines: ["anna roma", "luca bari", "sara asti"] } }],
              note: "eva non è nel file e sara non è nello stdin: spariscono." },
            { title: "Con le virgole", input: ["bash,5.2.15", "curl,8.5.0"], steps: [{ cmd: "join", args: { separator: ",", file: "ultime.txt", lines: ["bash,5.2.32", "curl,8.11.0"] } }] },
            { title: "Prima ordina sulla chiave", input: ["luca 25", "anna 30"], steps: [{ cmd: "sort" }, { cmd: "join", args: { file: "citta.txt", lines: ["anna roma", "luca bari"] } }] }
        ],
        traps: [
            "La chiave è il primo campo: se non lo è, riordina le colonne prima (awk, cut).",
            "Senza sort prima, join avvisa su stderr e perde delle coppie."
        ]
    },
    {
        id: "pacchetti",
        name: "apt, pacman, dnf...",
        cmds: [],
        summary: "Aggiornare i pacchetti nelle diverse distribuzioni Linux, e leggerne l'output con le pipeline.",
        syntax: "sudo apt update && sudo apt upgrade   /   sudo pacman -Syu   /   sudo dnf upgrade",
        description: "Ogni famiglia di distribuzioni ha il suo gestore di pacchetti. Debian, Ubuntu e Mint: apt (sudo apt update aggiorna l'elenco, sudo apt upgrade installa; apt list --upgradable mostra cosa c'è da aggiornare). Arch e derivate (Manjaro, EndeavourOS): pacman -Syu aggiorna tutto, pacman -Qu elenca gli aggiornamenti; yay -Syu e paru -Syu fanno lo stesso includendo i pacchetti dell'AUR (yay -Qua, paru -Qua solo quelli dell'AUR). Red Hat, Fedora, Rocky e Alma: dnf upgrade aggiorna, dnf check-update elenca; rpm -qa elenca i pacchetti installati. Nel gioco questi comandi non si eseguono (servono permessi e rete): i livelli dell'Atto VII ti danno il loro output, e tu lo analizzi con le pipeline.",
        examples: [
            { title: "Quanti aggiornamenti con apt", input: [{ err: "WARNING: apt does not have a stable CLI interface. Use with caution in scripts." }, "Listing...", "curl/noble-updates 8.5.0-2ubuntu10.5 amd64 [upgradable from: 8.5.0-2ubuntu10.4]", "vim/noble-updates 2:9.1.0016-1ubuntu7.4 amd64 [upgradable from: 2:9.1.0016-1ubuntu7.3]"],
              steps: [{ cmd: "devnull" }, { cmd: "grep", args: { pattern: "upgradable" } }, { cmd: "wc" }],
              note: "In una pipe apt avvisa su stderr che il suo output può cambiare: 2>/dev/null lo zittisce. La riga Listing... non va contata." },
            { title: "I nomi da pacman -Qu", input: ["linux 6.11.5.arch1-1 -> 6.11.6.arch1-1", "firefox 131.0.3-1 -> 132.0-1"], steps: [{ cmd: "cut", args: { delim: " ", field: 1 } }, { cmd: "sort" }] },
            { title: "Pacchetti installati con rpm -qa", input: ["bash-5.2.26-3.fc40.x86_64", "curl-8.6.0-10.fc40.x86_64", "kernel-6.11.6-200.fc40.x86_64"], steps: [{ cmd: "grep", args: { pattern: "kernel" } }],
              note: "rpm -qa scrive nome-versione-rilascio.architettura, una riga per pacchetto." }
        ],
        traps: [
            "apt update non aggiorna i programmi: aggiorna solo l'elenco. Per installare serve apt upgrade.",
            "Su Arch non aggiornare mai a metà (pacman -Sy e poi installare): usa sempre pacman -Syu.",
            "yay e paru si usano senza sudo: lo chiedono loro quando serve."
        ]
    },
    {
        id: "paste",
        name: "paste -s",
        cmds: ["paste"],
        summary: "Unisce tutte le righe in una sola.",
        syntax: "paste -sd'X'",
        description: "Concatena tutte le righe del flusso in un'unica riga, separandole con il carattere X. È l'operazione opposta di tr 'X' '\\n'.",
        options: [{ flag: "-d'X'", text: "il carattere da mettere fra le righe" }],
        examples: [
            { title: "Una riga CSV", input: ["anna", "luca", "eva"], steps: [{ cmd: "paste", args: { delim: "," } }] },
            { title: "Ordinare gli elementi di una lista", input: ["pera,mela,kiwi"], steps: [{ cmd: "tr", args: { from: ",", to: "\n" } }, { cmd: "sort" }, { cmd: "paste", args: { delim: "," } }],
              note: "tr spezza la lista in righe, sort le ordina, paste le riunisce." }
        ],
        traps: ["Dopo paste resta una sola riga: sort e uniq non hanno più niente da riordinare."]
    },
    {
        id: "devnull",
        name: "2>/dev/null",
        cmds: ["devnull"],
        summary: "Butta via lo stderr del comando a cui è attaccato.",
        syntax: "comando 2>/dev/null",
        description: "Reindirizza lo stderr (il flusso 2, gli errori) in /dev/null, un file che scarta tutto. Vale per il comando a cui è attaccato: nella riga di shell compare subito dopo di lui. Se un comando ha più reindirizzamenti, vince l'ultimo.",
        examples: [
            { title: "Senza reindirizzamento", input: ["ok", { err: "attenzione" }, "fine"], steps: [{ cmd: "sort" }],
              note: "La riga di errore finisce sul terminale." },
            { title: "Errori cestinati", input: ["ok", { err: "attenzione" }, "fine"], steps: [{ cmd: "devnull" }, { cmd: "sort" }] },
            { title: "Attaccato al comando sbagliato", input: ["ok", { err: "attenzione" }, "fine"], steps: [{ cmd: "sort" }, { cmd: "devnull" }],
              note: "Qui 2>/dev/null riguarda sort, ma l'errore veniva dal programma iniziale ed è già arrivato al terminale." }
        ],
        traps: ["Deve stare subito dopo il comando che produce gli errori: di solito il primo slot."]
    },
    {
        id: "merge",
        name: "2>&1",
        cmds: ["merge"],
        summary: "Unisce lo stderr allo stdout, così gli errori entrano nella pipe.",
        syntax: "comando 2>&1 | ...",
        description: "Manda lo stderr (flusso 2) dove va lo stdout (flusso 1). Gli errori diventano righe normali e i comandi successivi li possono filtrare, ordinare e contare. Come 2>/dev/null, vale per il comando a cui è attaccato.",
        examples: [
            { title: "Tutto in un flusso", input: ["ok", { err: "attenzione" }, "fine"], steps: [{ cmd: "merge" }] },
            { title: "Filtrare gli errori", input: ["ok", { err: "attenzione: disco" }, "fine", { err: "attenzione: rete" }], steps: [{ cmd: "merge" }, { cmd: "grep", args: { pattern: "attenzione" } }] },
            { title: "Troppo tardi", input: ["ok", { err: "attenzione" }, "fine"], steps: [{ cmd: "sort" }, { cmd: "merge" }],
              note: "L'errore del programma iniziale è già finito sul terminale prima di sort." }
        ],
        traps: ["Se gli errori ti servono, non cestinarli con 2>/dev/null: uniscili con 2>&1."]
    }
];
