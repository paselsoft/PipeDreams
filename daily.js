// Sfida del giorno: un livello generato a partire dalla data, uguale per tutti nello stesso giorno.
// Una "ricetta" sceglie i comandi della soluzione e riempie l'input con dati casuali; il solver
// scarta i candidati con scorciatoie più corte della ricetta e si passa al successivo.
// Non usa la pagina: tools/check-daily.js lo verifica da Node.

// Data locale nel formato AAAA-MM-GG
function dateKey(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Generatore deterministico: hash FNV-1a della data come seme, poi mulberry32
function seededRandom(text) {
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619) >>> 0;
    return () => {
        seed = (seed + 0x6D2B79F5) >>> 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
function shuffled(rng, list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
const sample = (rng, list, n) => shuffled(rng, list).slice(0, n);
// Ripete ogni elemento il numero di volte indicato e mescola
const repeatAndShuffle = (rng, counts) => shuffled(rng, Object.entries(counts).flatMap(([word, n]) => new Array(n).fill(word)));
const clock = rng => `${randInt(rng, 8, 19)}:${String(randInt(rng, 0, 59)).padStart(2, "0")}`;

const FRUITS = ["mela", "pera", "kiwi", "uva", "fico", "pesca", "prugna", "banana", "cocco", "lime"];
const ANIMALS = ["zebra", "gatto", "lupo", "orso", "volpe", "tasso", "gufo", "lince", "foca", "alce"];
const COLORS = ["rosso", "blu", "verde", "giallo", "viola", "nero", "bianco", "rosa"];
const NAMES = ["anna", "luca", "eva", "marco", "sara", "paolo", "giulia", "dario", "elena", "bruno", "irene", "tommaso"];
const TEAMS = ["vendite", "it", "marketing", "legale", "acquisti", "logistica"];
const PAGES = ["/home", "/login", "/carrello", "/prodotti", "/contatti", "/blog", "/faq", "/api"];
const ERRORS = ["disco", "rete", "memoria", "timeout", "permessi", "dns"];

// Mattoni dei comandi, con la descrizione mostrata nelle celle
const C = {
    grep: (pattern, invert) => ({ cmd: "grep", args: invert ? { pattern, invert: true } : { pattern }, desc: invert ? `Scarta le righe con '${pattern}'` : `Tieni le righe con '${pattern}'` }),
    sort: { cmd: "sort", desc: "Ordine alfabetico" },
    sortR: { cmd: "sort", args: { reverse: true }, desc: "Ordine decrescente" },
    sortN: { cmd: "sort", args: { numeric: true }, desc: "Ordine numerico" },
    sortRN: { cmd: "sort", args: { numeric: true, reverse: true }, desc: "Numerico decrescente" },
    uniq: { cmd: "uniq", desc: "Rimuovi duplicati" },
    uniqC: { cmd: "uniq", args: { count: true }, desc: "Conta i duplicati" },
    head: n => ({ cmd: "head", args: { n }, desc: `Prendi i primi ${n}` }),
    tail: n => ({ cmd: "tail", args: { n }, desc: `Prendi gli ultimi ${n}` }),
    wc: { cmd: "wc", desc: "Conta le righe" },
    cut: (delim, field) => ({ cmd: "cut", args: { delim, field }, desc: `Campo ${field} (${delim === " " ? "spazio" : delim})` }),
    awk: field => ({ cmd: "awk", args: { field }, desc: `Campo ${field} di awk` }),
    tr: (from, to, desc) => ({ cmd: "tr", args: { from, to }, desc }),
    paste: delim => ({ cmd: "paste", args: { delim }, desc: `Unisci con '${delim}'` }),
    devnull: { cmd: "devnull", desc: "Cestina lo stderr" },
    merge: { cmd: "merge", desc: "Unisci stderr a stdout" }
};

// Ogni ricetta restituisce testi, input, comandi della soluzione ed esche
const RECIPES = {
    pulizia: rng => {
        const mark = pick(rng, ["ERR", "TMP", "OLD"]);
        const words = sample(rng, ANIMALS, 4);
        const counts = Object.fromEntries(words.map(word => [word, randInt(rng, 1, 2)]));
        const noise = sample(rng, FRUITS, 3).map(word => `${mark}:${word}`);
        return {
            title: "Pulizia", from: "Marco",
            story: `Il server di stanotte ha lasciato righe ${mark} ovunque. Dammi l'elenco pulito.`,
            mission: `Scarta le righe che contengono <code>${mark}</code> e ottieni l'elenco ordinato, senza doppioni.`,
            nudge: `Le righe con ${mark} vanno scartate, e uniq vede solo i doppioni vicini.`,
            hint: `Piano in 3 passi: 1) scarta le righe con ${mark} (grep -v), 2) ordina, 3) togli i doppioni. Attenzione: uniq vede solo le righe uguali vicine.`,
            stdin: shuffled(rng, [...repeatAndShuffle(rng, counts), ...noise]),
            steps: [C.grep(mark, true), C.sort, C.uniq],
            distractors: [C.grep(mark), C.sortR, C.head(2)]
        };
    },
    primi: rng => {
        const n = randInt(rng, 2, 3);
        const words = sample(rng, FRUITS, 5);
        const counts = Object.fromEntries(words.map(word => [word, randInt(rng, 1, 3)]));
        return {
            title: "I Primi della Lista", from: "Marco",
            story: `Al mercato ordiniamo solo i primi ${n} frutti dell'elenco, in ordine alfabetico.`,
            mission: `Trova i primi <code>${n}</code> frutti distinti in ordine alfabetico.`,
            nudge: "Prima di tagliare, togli i doppioni.",
            hint: `Piano in 3 passi: 1) ordina, 2) togli i doppioni, 3) tieni i primi ${n}. Attenzione: se tagli prima di togliere i doppioni, prendi frutti uguali.`,
            stdin: repeatAndShuffle(rng, counts),
            steps: [C.sort, C.uniq, C.head(n)],
            distractors: [C.tail(n), C.sortR, C.grep(words[0], true)]
        };
    },
    accessi: rng => {
        const users = sample(rng, NAMES, randInt(rng, 3, 5));
        const lines = [];
        for (const user of users) {
            for (let i = randInt(rng, 1, 3); i > 0; i--) lines.push(`login ${user}`);
            if (rng() < 0.7) lines.push(`logout ${user}`);
        }
        lines.push(`logout ${pick(rng, NAMES.filter(name => !users.includes(name)))}`);
        return {
            title: "Chi è Entrato", from: "Giulia",
            story: "Audit di sicurezza: quante persone diverse hanno fatto login oggi?",
            mission: "Conta gli utenti <strong>diversi</strong> che hanno fatto login. Le uscite non contano, e chi è entrato più volte conta una volta sola.",
            nudge: "'logout' non contiene 'login'; e chi è entrato due volte conta una volta.",
            hint: "Piano in 4 passi: 1) tieni i login, 2) ordina, 3) togli i doppioni, 4) conta. Attenzione: 'logout' non contiene 'login'.",
            stdin: shuffled(rng, lines),
            steps: [C.grep("login"), C.sort, C.uniq, C.wc],
            distractors: [C.grep("log"), C.head(1), C.tail(1)]
        };
    },
    reparti: rng => {
        const people = sample(rng, NAMES, 6);
        const teams = sample(rng, TEAMS, 3);
        const lines = people.map((name, i) => `${name}:${teams[i % 3]}:${pick(rng, ["roma", "milano", "torino", "bari"])}`);
        return {
            title: "Reparti", from: "Giulia",
            story: "Sto rifacendo l'organigramma: quali reparti abbiamo, in ordine alfabetico?",
            mission: "Ogni riga è <code>nome:reparto:città</code>. Elenca i reparti, in ordine alfabetico e senza ripetizioni.",
            nudge: "Il reparto è il secondo campo della riga, separato da ':'.",
            hint: "Piano in 3 passi: 1) estrai il reparto (cut, campo 2), 2) ordina, 3) togli i doppioni. Attenzione: ordinando le righe intere le metteresti in ordine di nome.",
            stdin: shuffled(rng, lines),
            steps: [C.cut(":", 2), C.sort, C.uniq],
            distractors: [C.cut(":", 1), C.cut(":", 3), C.sortR, C.uniqC]
        };
    },
    punteggio: rng => {
        const players = sample(rng, NAMES, 5);
        const points = sample(rng, Array.from({ length: 495 }, (_, i) => i + 5), 5);
        return {
            title: "Il Record", from: "Marco",
            story: "Torneo di ping pong in pausa pranzo: qual è il punteggio più alto?",
            mission: "Ogni riga è <code>nome punti</code>. Trova il punteggio più alto.",
            nudge: "Come testo, i numeri non si ordinano per valore.",
            hint: "Piano in 3 passi: 1) estrai i punti (awk, campo 2), 2) ordinali per valore numerico, 3) prendi l'ultimo. Attenzione: senza -n i numeri si ordinano come testo.",
            stdin: players.map((name, i) => `${name} ${points[i]}`),
            steps: [C.awk(2), C.sortN, C.tail(1)],
            distractors: [C.awk(1), C.sort, C.head(1)]
        };
    },
    maiuscole: rng => {
        const names = sample(rng, NAMES, 4);
        const variants = name => [name, name.toUpperCase(), name[0].toUpperCase() + name.slice(1)];
        const lines = names.flatMap(name => sample(rng, variants(name), randInt(rng, 1, 3)));
        return {
            title: "Maiuscole Ribelli", from: "Giulia",
            story: "Ognuno ha scritto il proprio nome a modo suo. Mi serve l'elenco uniforme, in maiuscolo.",
            mission: "Ottieni l'elenco dei nomi in maiuscolo, ordinato e senza ripetizioni: <code>Anna</code> e <code>ANNA</code> sono la stessa persona.",
            nudge: "Per uniq 'Anna' e 'ANNA' sono diverse finché non le uniformi.",
            hint: "Piano in 3 passi: 1) tutto in maiuscolo (tr 'a-z' 'A-Z'), 2) ordina, 3) togli i doppioni. Attenzione: prima di uniformare, 'Anna' e 'ANNA' sono righe diverse.",
            stdin: shuffled(rng, lines),
            steps: [C.tr("a-z", "A-Z", "Minuscole → maiuscole"), C.sort, C.uniq],
            distractors: [C.tr("A-Z", "a-z", "Maiuscole → minuscole"), C.sortR, C.uniqC]
        };
    },
    classifica: rng => {
        const n = randInt(rng, 2, 3);
        const colors = sample(rng, COLORS, 4);
        const counts = Object.fromEntries(colors.map((color, i) => [color, 5 - i]));
        return {
            title: "Sondaggio Lampo", from: "Giulia",
            story: `Nuovo sondaggio sul colore delle tazze aziendali: mi servono i ${n} più votati, con i voti.`,
            mission: `Mostra i <code>${n}</code> colori più votati con il numero di voti, dal più votato.`,
            nudge: "Per contare i voti uguali, devono prima stare vicini.",
            hint: `Piano in 4 passi: 1) raggruppa i voti (sort), 2) contali (uniq -c), 3) ordina dal più votato (sort -rn), 4) tieni i primi ${n}. Attenzione: tail prenderebbe i meno votati.`,
            stdin: repeatAndShuffle(rng, counts),
            steps: [C.sort, C.uniqC, C.sortRN, C.head(n)],
            distractors: [C.uniq, C.tail(n), C.wc],
            slots: 5
        };
    },
    spesa: rng => {
        const fruits = sample(rng, FRUITS, 5);
        const lists = Array.from({ length: 4 }, () => sample(rng, fruits, randInt(rng, 1, 3)).join(";"));
        return {
            title: "La Spesa", from: "Marco",
            story: "Le liste della spesa dell'ufficio sono un disastro. Facciamone una sola.",
            mission: "Le liste usano il punto e virgola. Crea un'unica riga con tutti i frutti, senza doppioni, in ordine alfabetico e separati da virgole.",
            nudge: "Ogni frutto deve stare su una riga sua per essere ordinato.",
            hint: "Piano in 4 passi: 1) un frutto per riga (tr ';' '\\n'), 2) ordina, 3) togli i doppioni, 4) unisci con paste. Attenzione: dopo paste resta una riga sola.",
            stdin: lists,
            steps: [C.tr(";", "\n", "Punto e virgola → a capo"), C.sort, C.uniq, C.paste(",")],
            distractors: [C.tr(";", ",", "Punto e virgola → virgola"), C.paste(";"), C.uniqC],
            slots: 5
        };
    },
    errori: rng => {
        const types = sample(rng, ERRORS, 3);
        const counts = Object.fromEntries(types.map((type, i) => [type, 3 - i]));
        const lines = [
            ...repeatAndShuffle(rng, counts).map(type => ({ err: `${clock(rng)} ERR ${type}` })),
            ...Array.from({ length: 3 }, () => `${clock(rng)} job ok`)
        ];
        return {
            title: "Diagnosi", from: "Giulia",
            story: "🚨 Il server è instabile. Quali errori scrive su stderr, e quanto spesso?",
            mission: "Gli errori sono su stderr nel formato <code>ora ERR tipo</code>. Fai la classifica dei tipi di errore con il numero di volte, dal più frequente.",
            nudge: "Gli errori sono su stderr, e ogni riga inizia con l'orario.",
            hint: "Piano in 6 passi: 1) porta gli errori nella pipe (2>&1), 2) tieni le righe ERR, 3) estrai il tipo (campo 3), 4-6) sort, uniq -c, sort -rn. Attenzione: le righe iniziano con l'orario.",
            stdin: shuffled(rng, lines),
            steps: [C.merge, C.grep("ERR"), C.cut(" ", 3), C.sort, C.uniqC, C.sortRN],
            distractors: [C.devnull, C.grep("ERR", true), C.cut(" ", 2)],
            slots: 7
        };
    },
    pagine: rng => {
        const code = pick(rng, ["404", "500"]);
        const bad = sample(rng, PAGES, 3);
        const good = PAGES.filter(page => !bad.includes(page));
        const row = (page, status) => `${clock(rng)}  GET  ${page.padEnd(10)}  ${status}`;
        const lines = [
            ...bad.map(page => row(page, code)),
            row(pick(rng, bad), code),
            ...sample(rng, good, 3).map(page => row(page, "200")),
            { err: `WARN ${code} su /favicon.ico` },
            { err: "WARN cache lenta" }
        ];
        return {
            title: "Pagine Rotte", from: "Giulia",
            story: `🚨 Alcune pagine rispondono ${code}. Agli sviluppatori serve l'elenco, in una riga.`,
            mission: `Ricava le pagine che hanno risposto <code>${code}</code>: senza ripetizioni, in ordine alfabetico, in un'unica riga separata da virgole. Gli avvisi su stderr non devono comparire.`,
            nudge: `Anche un avviso su stderr contiene ${code}.`,
            hint: `Piano in 6 passi: 1) cestina gli avvisi (2>/dev/null), 2) tieni le righe con ${code}, 3) estrai la pagina con awk (campo 3), 4) ordina, 5) togli i doppioni, 6) unisci con paste. Attenzione: un avviso contiene ${code}.`,
            stdin: shuffled(rng, lines),
            steps: [C.devnull, C.grep(code), C.awk(3), C.sort, C.uniq, C.paste(",")],
            distractors: [C.merge, C.grep(code, true), C.cut(" ", 3)],
            slots: 7
        };
    }
};

// Difficoltà per giorno della settimana (0 = domenica)
const DAILY_POOLS = [
    { label: "difficile", recipes: ["classifica", "spesa", "errori", "pagine"] },
    { label: "facile", recipes: ["pulizia", "primi"] },
    { label: "facile", recipes: ["pulizia", "primi"] },
    { label: "media", recipes: ["accessi", "reparti", "punteggio", "maiuscole"] },
    { label: "media", recipes: ["accessi", "reparti", "punteggio", "maiuscole"] },
    { label: "difficile", recipes: ["classifica", "spesa", "errori", "pagine"] },
    { label: "difficile", recipes: ["classifica", "spesa", "errori", "pagine"] }
];

// Un candidato è accettato se la soluzione della ricetta è anche quella ottimale (niente scorciatoie)
// e le soluzioni ottimali sono al più 3 (es. un filtro che può stare in più punti)
// identity: campi che distinguono il livello generato (id e, per la sfida, il campo daily)
function buildCandidate(recipe, rng, identity) {
    const data = recipe(rng);
    const result = executePipeline(data.stdin, data.steps);
    if (result.stderr.length || result.output.length === 0) return null;
    if (streamsEqual(result.output, normalizeInput(data.stdin).map(line => line.text))) return null;
    const level = {
        ...identity,
        act: 0,
        title: data.title,
        story: { from: data.from, text: data.story },
        mission: data.mission,
        stdin: data.stdin,
        target: result.output,
        nudge: data.nudge,
        hint: data.hint,
        allowedCommands: shuffled(rng, [...data.steps, ...data.distractors])
    };
    if (data.slots) level.slots = data.slots;
    const solution = solveLevel(level);
    if (solution.par !== data.steps.length || solution.optimalCount > 3) return null;
    return level;
}

// Genera un livello da una delle ricette indicate, in modo deterministico rispetto al seme
function generateFromRecipes(seed, recipeNames, identity) {
    const rng = seededRandom(seed);
    for (let attempt = 0; attempt < 200; attempt++) {
        const level = buildCandidate(RECIPES[pick(rng, recipeNames)], rng, identity);
        if (level) return level;
    }
    // Non dovrebbe mai servire: la ricetta più semplice trova sempre un candidato valido
    for (;;) {
        const level = buildCandidate(RECIPES.primi, rng, identity);
        if (level) return level;
    }
}

function generateDaily(key) {
    const [year, month, day] = key.split("-").map(Number);
    const pool = DAILY_POOLS[new Date(year, month - 1, day).getDay()];
    return generateFromRecipes(`pipedreams:${key}`, pool.recipes, { id: `sfida-${key}`, daily: { key, difficulty: pool.label } });
}

// Ricette per difficoltà, usate dalla Maratona
const RECIPES_BY_DIFFICULTY = {
    facile: ["pulizia", "primi"],
    media: ["accessi", "reparti", "punteggio", "maiuscole"],
    difficile: ["classifica", "spesa", "errori", "pagine"]
};

function generateMarathonLevel(seed, round, difficulty) {
    return generateFromRecipes(`maratona:${seed}:${round}`, RECIPES_BY_DIFFICULTY[difficulty],
        { id: `maratona-${seed}-${round}`, marathon: { round, difficulty } });
}

// --- Allenamento: livelli brevi centrati su un comando ---
// Ogni argomento ha ricette base (1-2 comandi) e avanzate; dopo qualche livello si aggiungono
// le ricette della sfida del giorno che usano quel comando.
const sedStep = (pattern, replacement, global, desc) => ({ cmd: "sed", args: global ? { pattern, replacement, global: true } : { pattern, replacement }, desc });
const trDelete = (set, desc) => ({ cmd: "tr", args: { delete: set }, desc });
// Numeri con un numero di cifre diverso: in ordine alfabetico e numerico finiscono in posti diversi
const mixedNumbers = (rng, n) => shuffled(rng, [randInt(rng, 2, 9), randInt(rng, 10, 99), randInt(rng, 100, 999), ...Array.from({ length: n - 3 }, () => randInt(rng, 2, 999))]);

const TRAINING_RECIPES = {
    t_grep_tieni: rng => {
        const colors = sample(rng, COLORS, 3);
        const lines = shuffled(rng, sample(rng, ANIMALS, 7).map((animal, i) => `${colors[i % 3]} ${animal}`));
        return {
            title: "Tieni le Righe", from: "Allenamento",
            story: "grep lascia passare solo le righe che contengono un testo.",
            mission: `Tieni solo gli animali di colore <code>${colors[0]}</code>.`,
            nudge: "grep tiene le righe che contengono il testo, grep -v le scarta.",
            hint: `Un solo comando: grep '${colors[0]}'.`,
            stdin: lines,
            steps: [C.grep(colors[0])],
            distractors: [C.grep(colors[0], true), C.grep(colors[1]), C.sort]
        };
    },
    t_grep_scarta: rng => {
        const levels = ["INFO", "WARN", "DEBUG"];
        const drop = pick(rng, levels);
        const lines = shuffled(rng, sample(rng, ERRORS, 6).map((word, i) => `${levels[i % 3]} ${word}`));
        return {
            title: "Scarta le Righe", from: "Allenamento",
            story: "grep -v fa il contrario di grep: scarta le righe che contengono il testo.",
            mission: `Togli dal log tutte le righe <code>${drop}</code>, lasciando le altre nell'ordine originale.`,
            nudge: "Ti serve l'opzione che inverte grep.",
            hint: `Un solo comando: grep -v '${drop}'.`,
            stdin: lines,
            steps: [C.grep(drop, true)],
            distractors: [C.grep(drop), C.grep(pick(rng, levels.filter(level => level !== drop))), C.tail(2)]
        };
    },
    t_grep_due: rng => {
        const team = pick(rng, TEAMS);
        const others = sample(rng, TEAMS.filter(t => t !== team), 2);
        const lines = shuffled(rng, [
            ...sample(rng, NAMES, 4).map((name, i) => `${team} ${name} ${i % 2 ? "annullato" : "confermato"}`),
            ...sample(rng, NAMES, 3).map((name, i) => `${others[i % 2]} ${name} confermato`)
        ]);
        return {
            title: "Doppio Filtro", from: "Allenamento",
            story: "Due grep di fila: il secondo lavora solo sulle righe lasciate dal primo.",
            mission: `Tieni le prenotazioni del reparto <code>${team}</code>, ma non quelle <code>annullato</code>.`,
            nudge: "Un grep per tenere, uno con -v per scartare.",
            hint: `Due comandi: grep '${team}' e grep -v 'annullato' (in qualsiasi ordine).`,
            stdin: lines,
            steps: [C.grep(team), C.grep("annullato", true)],
            distractors: [C.grep(team, true), C.grep("annullato"), C.head(2)]
        };
    },
    t_sort_alfa: rng => ({
        title: "In Ordine", from: "Allenamento",
        story: "sort ordina le righe in ordine alfabetico.",
        mission: "Metti i frutti in ordine alfabetico.",
        nudge: "Il comando giusto è il più semplice.",
        hint: "Un solo comando: sort.",
        stdin: sample(rng, FRUITS, 6),
        steps: [C.sort],
        distractors: [C.sortR, C.uniq, C.tail(3)]
    }),
    t_sort_rev: rng => ({
        title: "Al Contrario", from: "Allenamento",
        story: "sort -r ordina dalla Z alla A.",
        mission: "Metti gli animali in ordine alfabetico <strong>inverso</strong>, dalla Z alla A.",
        nudge: "Ti serve l'opzione che rovescia l'ordine.",
        hint: "Un solo comando: sort -r.",
        stdin: sample(rng, ANIMALS, 6),
        steps: [C.sortR],
        distractors: [C.sort, C.uniq, C.head(3)]
    }),
    t_sort_num: rng => {
        const fruits = sample(rng, FRUITS, 5);
        return {
            title: "Numeri in Fila", from: "Allenamento",
            story: "Senza -n, sort confronta i numeri come testo: \"100\" viene prima di \"9\".",
            mission: "Ogni riga è <code>quantità frutto</code>. Ordina dalla quantità più piccola alla più grande.",
            nudge: "Come testo, 100 viene prima di 9.",
            hint: "Un solo comando: sort -n.",
            stdin: mixedNumbers(rng, 5).map((n, i) => `${n} ${fruits[i]}`),
            steps: [C.sortN],
            distractors: [C.sort, C.sortR, C.sortRN]
        };
    },
    t_sort_top: rng => {
        const n = randInt(rng, 2, 3);
        const names = sample(rng, NAMES, 6);
        return {
            title: "Il Podio", from: "Allenamento",
            story: "sort -rn mette i numeri più grandi in cima: poi basta tagliare.",
            mission: `Ogni riga è <code>punti nome</code>. Mostra i <code>${n}</code> punteggi più alti, dal più alto.`,
            nudge: "Ordina per valore, dal più grande, e prendi la cima.",
            hint: `Due comandi: sort -rn, poi head -n ${n}.`,
            stdin: mixedNumbers(rng, 6).map((points, i) => `${points} ${names[i]}`),
            steps: [C.sortRN, C.head(n)],
            distractors: [C.sortN, C.sortR, C.tail(n)]
        };
    },
    t_uniq_base: rng => {
        const words = sample(rng, FRUITS, 4);
        return {
            title: "Via i Doppioni", from: "Allenamento",
            story: "uniq toglie solo le righe uguali che si toccano: per questo di solito viene dopo sort.",
            mission: "Elenca i frutti in ordine alfabetico, ognuno una volta sola.",
            nudge: "uniq vede solo i doppioni vicini.",
            hint: "Due comandi: sort, poi uniq.",
            stdin: repeatAndShuffle(rng, Object.fromEntries(words.map(word => [word, randInt(rng, 1, 3)]))),
            steps: [C.sort, C.uniq],
            distractors: [C.uniqC, C.sortR, C.head(3)]
        };
    },
    t_uniq_vicini: rng => {
        const words = sample(rng, ANIMALS, 4);
        return {
            title: "Eco nel Log", from: "Allenamento",
            story: "Il sensore ripete la stessa riga più volte di fila. uniq da solo basta, e non cambia l'ordine.",
            mission: "Togli le ripetizioni consecutive, <strong>mantenendo l'ordine</strong> in cui gli animali sono passati.",
            nudge: "Se i doppioni sono già vicini, non serve ordinare.",
            hint: "Un solo comando: uniq.",
            stdin: words.flatMap(word => new Array(randInt(rng, 1, 3)).fill(word)),
            steps: [C.uniq],
            distractors: [C.sort, C.uniqC, C.sortR]
        };
    },
    t_uniq_conta: rng => {
        const words = sample(rng, COLORS, 3);
        return {
            title: "Quanti Voti", from: "Allenamento",
            story: "uniq -c conta quante volte si ripete ogni riga (sempre solo tra righe vicine).",
            mission: "Conta i voti di ogni colore, con i colori in ordine alfabetico.",
            nudge: "Prima raggruppa, poi conta.",
            hint: "Due comandi: sort, poi uniq -c.",
            stdin: repeatAndShuffle(rng, Object.fromEntries(words.map((word, i) => [word, i + 1 + randInt(rng, 0, 1)]))),
            steps: [C.sort, C.uniqC],
            distractors: [C.uniq, C.sortRN, C.wc]
        };
    },
    t_head: rng => {
        const n = randInt(rng, 2, 3);
        return {
            title: "I Primi in Coda", from: "Allenamento",
            story: "head -n N tiene le prime N righe, nell'ordine in cui arrivano.",
            mission: `Fai entrare i primi <code>${n}</code> clienti della coda.`,
            nudge: "Non ordinare: conta l'ordine di arrivo.",
            hint: `Un solo comando: head -n ${n}.`,
            stdin: sample(rng, NAMES, 6),
            steps: [C.head(n)],
            distractors: [C.tail(n), C.head(n + 1), C.sort]
        };
    },
    t_tail: rng => {
        const n = randInt(rng, 2, 3);
        return {
            title: "Gli Ultimi Arrivati", from: "Allenamento",
            story: "tail -n N tiene le ultime N righe.",
            mission: `Mostra gli ultimi <code>${n}</code> eventi del log.`,
            nudge: "Gli ultimi, non i primi.",
            hint: `Un solo comando: tail -n ${n}.`,
            stdin: Array.from({ length: 6 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00 ${pick(rng, ERRORS)}`),
            steps: [C.tail(n)],
            distractors: [C.head(n), C.tail(n + 1), C.sortR]
        };
    },
    t_middle: rng => {
        const from = randInt(rng, 2, 3);
        const to = from + randInt(rng, 1, 2);
        return {
            title: "Dalla Riga alla Riga", from: "Allenamento",
            story: "head e tail insieme ritagliano un pezzo dal mezzo.",
            mission: `Tieni le righe dalla <code>${from}</code> alla <code>${to}</code>.`,
            nudge: `Prima tieni tutto fino alla riga ${to}, poi prendi la fine.`,
            hint: `Due comandi: head -n ${to}, poi tail -n ${to - from + 1}.`,
            stdin: sample(rng, FRUITS, 7),
            steps: [C.head(to), C.tail(to - from + 1)],
            distractors: [C.head(from), C.tail(from), C.sort]
        };
    },
    t_wc_conta: rng => {
        const color = pick(rng, COLORS);
        const lines = shuffled(rng, [
            ...sample(rng, ANIMALS, randInt(rng, 2, 4)).map(animal => `${color} ${animal}`),
            ...sample(rng, ANIMALS, 3).map(animal => `${pick(rng, COLORS.filter(c => c !== color))} ${animal}`)
        ]);
        return {
            title: "Quante Righe", from: "Allenamento",
            story: "wc -l conta le righe che gli arrivano: dopo un grep, conta quelle trovate.",
            mission: `Quanti animali sono di colore <code>${color}</code>?`,
            nudge: "Prima filtra, poi conta.",
            hint: `Due comandi: grep '${color}', poi wc -l.`,
            stdin: lines,
            steps: [C.grep(color), C.wc],
            distractors: [C.grep(color, true), C.uniq, C.head(1)]
        };
    },
    t_wc_distinti: rng => {
        const words = sample(rng, NAMES, randInt(rng, 3, 5));
        return {
            title: "Visitatori Unici", from: "Allenamento",
            story: "Per contare valori diversi: raggruppa, togli i doppioni, conta.",
            mission: "Quante persone <strong>diverse</strong> sono passate dalla reception?",
            nudge: "Chi è passato due volte conta una volta.",
            hint: "Tre comandi: sort, uniq, wc -l.",
            stdin: repeatAndShuffle(rng, Object.fromEntries(words.map(word => [word, randInt(rng, 1, 3)]))),
            steps: [C.sort, C.uniq, C.wc],
            distractors: [C.grep(words[0]), C.head(1), C.tail(1)]
        };
    },
    t_cut_campo: rng => {
        const field = randInt(rng, 1, 3);
        const names = ["nome", "reparto", "città"];
        const lines = sample(rng, NAMES, 5).map(name => `${name}:${pick(rng, TEAMS)}:${pick(rng, ["roma", "milano", "torino", "bari"])}`);
        return {
            title: "Un Campo Solo", from: "Allenamento",
            story: "cut -d':' -fN taglia ogni riga sui ':' e tiene il campo numero N.",
            mission: `Ogni riga è <code>nome:reparto:città</code>. Tieni solo il campo <code>${names[field - 1]}</code>.`,
            nudge: `Il campo ${names[field - 1]} è il numero ${field}.`,
            hint: `Un solo comando: cut -d':' -f${field}.`,
            stdin: lines,
            steps: [C.cut(":", field)],
            distractors: [C.cut(":", field % 3 + 1), C.cut(",", field), C.sort]
        };
    },
    t_cut_csv: rng => {
        const lines = sample(rng, NAMES, 6).map(name => `${name},${pick(rng, FRUITS.slice(0, 4))},${randInt(rng, 1, 9)}`);
        return {
            title: "Il Foglio CSV", from: "Allenamento",
            story: "Nei file CSV i campi sono separati da virgole: cut -d',' li separa.",
            mission: "Ogni riga è <code>nome,frutto,quantità</code>. Elenca i frutti ordinati, senza ripetizioni.",
            nudge: "Il frutto è il campo 2, e il separatore è la virgola.",
            hint: "Tre comandi: cut -d',' -f2, sort, uniq.",
            stdin: lines,
            steps: [C.cut(",", 2), C.sort, C.uniq],
            distractors: [C.cut(",", 1), C.cut(":", 2), C.uniqC]
        };
    },
    t_awk_spazi: rng => {
        const names = sample(rng, NAMES, 5);
        return {
            title: "Colonne Allineate", from: "Allenamento",
            story: "awk divide le righe sugli spazi, anche quando sono più di uno: cut -d' ' invece si ferma al primo.",
            mission: "Ogni riga è <code>nome   reparto</code>, allineata con più spazi. Tieni solo il reparto.",
            nudge: "Con più spazi di fila, cut vede dei campi vuoti.",
            hint: "Un solo comando: awk '{print $2}'.",
            stdin: names.map(name => `${name.padEnd(9)}${pick(rng, TEAMS)}`),
            steps: [C.awk(2)],
            distractors: [C.cut(" ", 2), C.awk(1), C.sort]
        };
    },
    t_awk_numeri: rng => {
        const names = sample(rng, NAMES, 5);
        return {
            title: "Colonna di Numeri", from: "Allenamento",
            story: "awk estrae una colonna, sort -n la ordina per valore.",
            mission: "Ogni riga è <code>nome   minuti</code>. Elenca solo i minuti, dal più piccolo al più grande.",
            nudge: "Estrai la colonna, poi ordina per valore numerico.",
            hint: "Due comandi: awk '{print $2}', poi sort -n.",
            stdin: mixedNumbers(rng, 5).map((n, i) => `${names[i].padEnd(9)}${n}`),
            steps: [C.awk(2), C.sortN],
            distractors: [C.sort, C.awk(1), C.cut(" ", 2)]
        };
    },
    t_tr_maiuscolo: rng => ({
        title: "Tutto Maiuscolo", from: "Allenamento",
        story: "tr sostituisce caratteri: tr 'a-z' 'A-Z' trasforma le minuscole in maiuscole.",
        mission: "Scrivi i nomi delle città in <strong>MAIUSCOLO</strong>.",
        nudge: "Da quali caratteri a quali?",
        hint: "Un solo comando: tr 'a-z' 'A-Z'.",
        stdin: sample(rng, ["roma", "milano", "torino", "bari", "napoli", "genova", "trento"], 4),
        steps: [C.tr("a-z", "A-Z", "Minuscole → maiuscole")],
        distractors: [C.tr("A-Z", "a-z", "Maiuscole → minuscole"), C.sort, C.tr("a-z", "*", "Lettere → *")]
    }),
    t_tr_sostituisci: rng => ({
        title: "Cambia Separatore", from: "Allenamento",
        story: "tr cambia un carattere con un altro, ovunque si trovi nella riga.",
        mission: "Ogni riga è <code>nome_reparto</code>. Sostituisci il trattino basso con uno spazio.",
        nudge: "Il carattere da cambiare è _ .",
        hint: "Un solo comando: tr '_' ' '.",
        stdin: sample(rng, NAMES, 5).map(name => `${name}_${pick(rng, TEAMS)}`),
        steps: [C.tr("_", " ", "_ → spazio")],
        distractors: [C.tr(" ", "_", "Spazio → _"), C.tr("_", "-", "_ → -"), C.cut("_", 1)]
    }),
    t_tr_cancella: rng => ({
        title: "Via le Cifre", from: "Allenamento",
        story: "tr -d cancella i caratteri indicati.",
        mission: "I codici contengono cifre: cancellale e lascia solo le lettere.",
        nudge: "Ti serve l'opzione che cancella, non quella che sostituisce.",
        hint: "Un solo comando: tr -d '0-9'.",
        stdin: sample(rng, FRUITS, 5).map(fruit => `${randInt(rng, 1, 9)}${fruit}${randInt(rng, 10, 99)}`),
        steps: [trDelete("0-9", "Cancella le cifre")],
        distractors: [trDelete("a-z", "Cancella le lettere"), C.sort, C.cut("0", 1)]
    }),
    t_sed_prefisso: rng => ({
        title: "Via il Prefisso", from: "Allenamento",
        story: "sed -E 's/regex/testo/' sostituisce la prima parte della riga che corrisponde alla regex. ^ indica l'inizio della riga.",
        mission: "Togli il prefisso <code>tmp_</code> dai nomi dei file che ce l'hanno; gli altri restano uguali.",
        nudge: "Sostituisci tmp_ a inizio riga con niente.",
        hint: "Un solo comando: sed -E 's/^tmp_//'.",
        stdin: shuffled(rng, [
            ...sample(rng, FRUITS, 3).map(fruit => `tmp_${fruit}_${randInt(rng, 1, 9)}.txt`),
            ...sample(rng, ANIMALS, 2).map(animal => `${animal}_${randInt(rng, 1, 9)}.txt`)
        ]),
        steps: [sedStep("^tmp_", "", false, "tmp_ a inizio riga → niente")],
        distractors: [C.grep("tmp_", true), C.cut("_", 2), sedStep("_", "", true, "Togli tutti i _")]
    }),
    t_sed_globale: rng => ({
        title: "Tutte le Virgole", from: "Allenamento",
        story: "Senza g, sed sostituisce solo la prima corrispondenza della riga; con g le sostituisce tutte.",
        mission: "Trasforma ogni virgola in punto e virgola, <strong>tutte</strong>.",
        nudge: "Una sostituzione per riga non basta.",
        hint: "Un solo comando: sed -E 's/,/;/g'.",
        stdin: Array.from({ length: 4 }, () => sample(rng, FRUITS, 3).join(",")),
        steps: [sedStep(",", ";", true, "Ogni , → ;")],
        distractors: [sedStep(",", ";", false, "La prima , → ;"), C.cut(",", 1), C.paste(";")]
    }),
    t_sed_taglia: rng => ({
        title: "Taglia la Coda", from: "Allenamento",
        story: "In una regex, .* vuol dire \"qualsiasi cosa\": -.* è un trattino seguito da tutto il resto.",
        mission: "Ogni riga è <code>nome-numero</code>. Togli il trattino e tutto quello che segue.",
        nudge: "Sostituisci il trattino e il resto della riga con niente.",
        hint: "Un solo comando: sed -E 's/-.*//'.",
        stdin: sample(rng, NAMES, 5).map(name => `${name}-${randInt(rng, 100, 999)}`),
        steps: [sedStep("-.*", "", false, "Trattino e resto → niente")],
        distractors: [sedStep("-", "", false, "Togli il trattino"), C.cut("-", 2), C.sort]
    }),
    t_paste: rng => ({
        title: "Una Riga Sola", from: "Allenamento",
        story: "paste -sd',' unisce tutte le righe in una, separandole con il carattere scelto.",
        mission: "Unisci i nomi in un'unica riga, separati da virgole.",
        nudge: "Ti serve il comando che unisce le righe.",
        hint: "Un solo comando: paste -sd','.",
        stdin: sample(rng, NAMES, 4),
        steps: [C.paste(",")],
        distractors: [C.paste(";"), C.sort, C.tr(",", "\n", "Virgola → a capo")]
    }),
    t_paste_ord: rng => {
        const words = sample(rng, COLORS, 4);
        return {
            title: "Elenco in Riga", from: "Allenamento",
            story: "paste va di solito alla fine: prima si prepara l'elenco, poi lo si mette in riga.",
            mission: "Crea un'unica riga con i colori ordinati, senza ripetizioni, separati da virgole.",
            nudge: "Dopo paste resta una riga sola: niente più da ordinare.",
            hint: "Tre comandi: sort, uniq, paste -sd','.",
            stdin: repeatAndShuffle(rng, Object.fromEntries(words.map(word => [word, randInt(rng, 1, 2)]))),
            steps: [C.sort, C.uniq, C.paste(",")],
            distractors: [C.paste(";"), C.sortR, C.uniqC]
        };
    },
    t_stderr_null: rng => {
        const names = sample(rng, FRUITS, 4);
        return {
            title: "Silenzio sugli Errori", from: "Allenamento",
            story: "2>/dev/null butta via lo stderr: gli errori non arrivano più sul terminale.",
            mission: "Ordina i frutti e fai in modo che gli avvisi su stderr <strong>non</strong> compaiano.",
            nudge: "Gli avvisi non passano nella pipe: vanno cestinati.",
            hint: "Due comandi: 2>/dev/null e sort.",
            stdin: shuffled(rng, [...names, { err: `WARN ${pick(rng, ERRORS)}` }, { err: `WARN ${pick(rng, ERRORS)}` }]),
            steps: [C.devnull, C.sort],
            distractors: [C.merge, C.sortR, C.grep("WARN", true)]
        };
    },
    t_stderr_merge: rng => {
        const type = pick(rng, ERRORS);
        return {
            title: "Errori nella Pipe", from: "Allenamento",
            story: "2>&1 unisce lo stderr allo stdout: così anche gli errori passano nella pipe e grep può filtrarli.",
            mission: `Conta quante volte compare l'errore <code>${type}</code>: gli errori sono su stderr.`,
            nudge: "grep vede solo quello che entra nella pipe.",
            hint: `Tre comandi: 2>&1, grep '${type}', wc -l.`,
            stdin: shuffled(rng, [
                ...new Array(randInt(rng, 2, 4)).fill({ err: `ERR ${type}` }),
                { err: `ERR ${pick(rng, ERRORS.filter(e => e !== type))}` },
                ...sample(rng, FRUITS, 2).map(fruit => `ok ${fruit}`)
            ]),
            steps: [C.merge, C.grep(type), C.wc],
            distractors: [C.devnull, C.grep(type, true), C.uniq]
        };
    }
};
Object.assign(RECIPES, TRAINING_RECIPES);

// Argomenti dell'allenamento: ricette base, avanzate e i comandi cercati nelle ricette della sfida
const TRAINING_TOPICS = [
    { id: "grep", label: "grep", desc: "tenere e scartare righe", base: ["t_grep_tieni", "t_grep_scarta"], advanced: ["t_grep_due", "t_wc_conta"], cmds: ["grep"] },
    { id: "sort", label: "sort", desc: "ordine alfabetico, inverso e numerico", base: ["t_sort_alfa", "t_sort_rev", "t_sort_num"], advanced: ["t_sort_top"], cmds: ["sort"] },
    { id: "uniq", label: "uniq", desc: "doppioni e conteggi", base: ["t_uniq_base", "t_uniq_vicini"], advanced: ["t_uniq_conta", "t_wc_distinti"], cmds: ["uniq"] },
    { id: "headtail", label: "head e tail", desc: "le prime e le ultime righe", base: ["t_head", "t_tail"], advanced: ["t_middle", "t_sort_top"], cmds: ["head", "tail"] },
    { id: "wc", label: "wc", desc: "contare le righe", base: ["t_wc_conta"], advanced: ["t_wc_distinti"], cmds: ["wc"] },
    { id: "cut", label: "cut", desc: "estrarre un campo", base: ["t_cut_campo"], advanced: ["t_cut_csv"], cmds: ["cut"] },
    { id: "awk", label: "awk", desc: "colonne separate da spazi", base: ["t_awk_spazi"], advanced: ["t_awk_numeri"], cmds: ["awk"] },
    { id: "tr", label: "tr", desc: "sostituire e cancellare caratteri", base: ["t_tr_maiuscolo", "t_tr_sostituisci"], advanced: ["t_tr_cancella"], cmds: ["tr"] },
    { id: "sed", label: "sed", desc: "sostituzioni con le regex", base: ["t_sed_prefisso", "t_sed_taglia"], advanced: ["t_sed_globale"], cmds: ["sed"] },
    { id: "paste", label: "paste", desc: "unire le righe", base: ["t_paste"], advanced: ["t_paste_ord"], cmds: ["paste"] },
    { id: "stderr", label: "stdout e stderr", desc: "2>/dev/null e 2>&1", base: ["t_stderr_null"], advanced: ["t_stderr_merge"], cmds: ["devnull", "merge"] }
];

// Ricette della sfida del giorno che usano almeno un comando dell'argomento
function challengeRecipesFor(topic) {
    return Object.keys(RECIPES).filter(name => !name.startsWith("t_") &&
        RECIPES[name](seededRandom("sonda")).steps.some(step => topic.cmds.includes(step.cmd)));
}

// Livello numero round di un allenamento: i primi 2 base, poi anche avanzati, dal quinto anche
// le ricette della sfida del giorno
function generateTrainingLevel(topicId, seed, round) {
    const topic = TRAINING_TOPICS.find(item => item.id === topicId);
    const recipes = round < 2 ? [...topic.base]
        : round < 4 ? [...topic.base, ...topic.advanced]
        : [...topic.advanced, ...challengeRecipesFor(topic)];
    if (recipes.length < 3) recipes.push(...topic.base);
    return generateFromRecipes(`allenamento:${topicId}:${seed}:${round}`, recipes,
        { id: `allenamento-${topicId}-${seed}-${round}`, training: { topic: topicId, round } });
}

// Giorni consecutivi risolti, contando all'indietro da oggi (o da ieri, se oggi non è ancora risolta)
function dailyStreak(daily, key = dateKey()) {
    const [year, month, day] = key.split("-").map(Number);
    const cursor = new Date(year, month - 1, day);
    if (!daily[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (daily[dateKey(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}
