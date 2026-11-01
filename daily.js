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
function buildCandidate(recipe, rng, key, difficulty) {
    const data = recipe(rng);
    const result = executePipeline(data.stdin, data.steps);
    if (result.stderr.length || result.output.length === 0) return null;
    if (streamsEqual(result.output, normalizeInput(data.stdin).map(line => line.text))) return null;
    const level = {
        id: `sfida-${key}`,
        act: 0,
        daily: { key, difficulty },
        title: data.title,
        story: { from: data.from, text: data.story },
        mission: data.mission,
        stdin: data.stdin,
        target: result.output,
        hint: data.hint,
        allowedCommands: shuffled(rng, [...data.steps, ...data.distractors])
    };
    if (data.slots) level.slots = data.slots;
    const solution = solveLevel(level);
    if (solution.par !== data.steps.length || solution.optimalCount > 3) return null;
    return level;
}

function generateDaily(key) {
    const rng = seededRandom(`pipedreams:${key}`);
    const [year, month, day] = key.split("-").map(Number);
    const pool = DAILY_POOLS[new Date(year, month - 1, day).getDay()];
    for (let attempt = 0; attempt < 200; attempt++) {
        const name = pick(rng, pool.recipes);
        const level = buildCandidate(RECIPES[name], rng, key, pool.label);
        if (level) return level;
    }
    // Non dovrebbe mai servire: la ricetta più semplice trova sempre un candidato valido
    for (;;) {
        const level = buildCandidate(RECIPES.primi, rng, key, "facile");
        if (level) return level;
    }
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
