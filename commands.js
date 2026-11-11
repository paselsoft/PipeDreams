// Registro dei comandi Unix simulati.
// Comandi normali: run(stdout: string[], args) => string[]. Leggono solo stdout; lo stderr
// del comando precedente non attraversa la pipe e va dove indica la sua destinazione.
// Reindirizzamenti (redirect: true): route indica dove mandare lo stderr del comando a cui
// sono attaccati (l'ultimo comando prima di loro, o il programma sorgente). Come in bash,
// se un comando ha più reindirizzamenti vince l'ultimo.
// label(args) restituisce la sintassi mostrata al giocatore.
// params descrive gli argomenti per l'editor dei livelli: text, char (un solo carattere),
// number (intero >= 1), flag (opzione sì/no), set (insieme di caratteri di tr, accetta \n),
// choice (uno dei valori in options), file (nome di un file del livello), lines (righe del file);
// optional: true permette il valore vuoto.
// run può restituire anche righe { err: "testo" }: lo stderr del comando, nell'ordine di scrittura.
// shell(args), se presente, è la versione per bash della sintassi (es. il file come <(printf ...)).
// validate(args), se presente, restituisce un messaggio d'errore per argomenti non supportati.

// I comandi numerici trattano come 0 le righe che non iniziano con un numero, come GNU sort -n
const leadingNumber = line => parseFloat(line) || 0;
const byteOrder = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

// Occorrenze del testo cercato da grep in una riga (il testo come appare nella riga).
// -i: maiuscole e minuscole uguali (solo lettere ASCII, come nel locale C);
// -w: solo parole intere (prima e dopo né lettere, né cifre, né _)
const asciiLower = text => text.replace(/[A-Z]/g, c => c.toLowerCase());
const isWordChar = c => c !== undefined && /[A-Za-z0-9_]/.test(c);
function grepMatches(line, a) {
    const hay = a.ignoreCase ? asciiLower(line) : line;
    const needle = a.ignoreCase ? asciiLower(a.pattern) : a.pattern;
    const found = [];
    if (!needle) return found;
    for (let from = 0; from <= hay.length - needle.length;) {
        const at = hay.indexOf(needle, from);
        if (at === -1) break;
        if (a.word && (isWordChar(line[at - 1]) || isWordChar(line[at + needle.length]))) {
            from = at + 1;
            continue;
        }
        found.push(line.slice(at, at + needle.length));
        from = at + needle.length;
    }
    return found;
}

// Lunghezza in byte UTF-8 (wc -c conta byte, non caratteri)
const utf8Length = text => [...text].reduce((sum, c) => {
    const code = c.codePointAt(0);
    return sum + (code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4);
}, 0);

// Elenco di campi di cut (-f1,3 -f2- -f1-3 -f-2): funzione n => vero se il campo n è scelto,
// oppure null se l'elenco non è valido
function cutFieldSet(list) {
    const parts = String(list).split(",");
    const ranges = [];
    for (const part of parts) {
        const match = /^([0-9]*)(-?)([0-9]*)$/.exec(part);
        if (!match || part === "" || part === "-") return null;
        const from = match[1] ? Number(match[1]) : 1;
        const to = match[2] ? (match[3] ? Number(match[3]) : Infinity) : from;
        if (from < 1 || to < from) return null;
        ranges.push([from, to]);
    }
    return n => ranges.some(([from, to]) => n >= from && n <= to);
}

// Espande gli intervalli di tr: "a-z" diventa "abc...z"
function expandSet(set) {
    let chars = "";
    for (let i = 0; i < set.length; i++) {
        if (set[i + 1] === "-" && i + 2 < set.length) {
            for (let c = set.charCodeAt(i); c <= set.charCodeAt(i + 2); c++) chars += String.fromCharCode(c);
            i += 2;
        } else {
            chars += set[i];
        }
    }
    return chars;
}

// sort -h, come GNU: prima conta il suffisso (niente < K < M < G < T...), poi il numero.
// 1500 viene prima di 1K: chi usa -h si aspetta numeri scritti tutti con le unità (du -h, df -h)
const HUMAN_UNITS = "KMGTPEZYRQ";
function humanKey(text) {
    const match = /^[ \t]*(-?)([0-9]*)(\.[0-9]*)?/.exec(text);
    const negative = match[1] === "-";
    const hasNumber = /[0-9]/.test((match[2] || "") + (match[3] || ""));
    const unit = text[match[0].length];
    const order = hasNumber ? (unit === "k" ? 1 : HUMAN_UNITS.indexOf(unit) + 1) : 0;
    const value = hasNumber ? parseFloat((match[2] || "0") + (match[3] && match[3].length > 1 ? match[3] : "")) : 0;
    return { order: negative ? -order : order, value: negative ? -value : value };
}
const humanCompare = (x, y) => {
    const a = humanKey(x);
    const b = humanKey(y);
    return a.order - b.order || a.value - b.value;
};

// echo di coreutils, come lo lancia xargs: le prime parole come -n, -e, -E sono opzioni
function echoText(args) {
    let newline = true;
    let escapes = false;
    let i = 0;
    while (i < args.length && /^-[neE]+$/.test(args[i])) {
        for (const c of args[i].slice(1)) {
            if (c === "n") newline = false;
            else escapes = c === "e";
        }
        i++;
    }
    let text = args.slice(i).join(" ");
    if (escapes) {
        const map = { "\\": "\\", a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" };
        let out = "";
        for (let k = 0; k < text.length; k++) {
            if (text[k] === "\\" && k + 1 < text.length) {
                if (text[k + 1] === "c") return out;
                if (map[text[k + 1]] !== undefined) {
                    out += map[text[k + 1]];
                    k++;
                    continue;
                }
            }
            out += text[k];
        }
        text = out;
    }
    return text + (newline ? "\n" : "");
}

const textToLines = text => text === "" ? [] : text.replace(/\n$/, "").split("\n");

// xargs (con echo, il comando predefinito): spezza l'input su spazi e a capo, rispetta
// virgolette e \, e lancia echo con N parole alla volta (-n N) o con tutte.
// Con l'input vuoto echo parte lo stesso una volta e stampa una riga vuota, come in GNU.
function runXargs(lines, perCall) {
    const text = lines.map(line => line + "\n").join("");
    const written = [];
    let batch = [];
    let word = "";
    let started = false;
    let error = null;
    const call = () => {
        written.push(echoText(batch));
        batch = [];
    };
    const endWord = () => {
        if (!started) return;
        // GNU lancia il comando quando arriva la parola dopo l'ultima che ci sta
        if (perCall && batch.length === perCall) call();
        batch.push(word);
        word = "";
        started = false;
    };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === " " || c === "\t" || c === "\n") {
            endWord();
        } else if (c === "\\") {
            word += text[i + 1] ?? "";
            started = true;
            i++;
        } else if (c === "'" || c === '"') {
            const end = text.indexOf(c, i + 1);
            const newline = text.indexOf("\n", i + 1);
            if (end === -1 || newline < end) {
                error = `xargs: unmatched ${c === "'" ? "single" : "double"} quote; by default quotes are special to xargs unless you use the -0 option`;
                break;
            }
            word += text.slice(i + 1, end);
            started = true;
            i = end;
        } else {
            word += c;
            started = true;
        }
    }
    if (error) {
        const before = textToLines(written.join(""));
        const after = batch.length ? textToLines(echoText(batch)) : [];
        return [...before, { err: error }, ...after];
    }
    endWord();
    if (batch.length || written.length === 0) call();
    return textToLines(written.join(""));
}

// fold di GNU: spezza le righe più larghe di N colonne (tab fino al multiplo di 8 successivo);
// con -s va a capo dopo l'ultimo spazio, se c'è
function foldLine(line, width, atSpaces) {
    const advance = (column, c) => c === "\t" ? column + 8 - (column % 8) : c === "\b" ? Math.max(0, column - 1) : c === "\r" ? 0 : column + 1;
    const out = [];
    const chars = [...line];
    let buffer = "";
    let column = 0;
    for (let i = 0; i < chars.length;) {
        const next = advance(column, chars[i]);
        if (next > width && buffer !== "") {
            const space = atSpaces ? Math.max(buffer.lastIndexOf(" "), buffer.lastIndexOf("\t")) : -1;
            if (space !== -1) {
                out.push(buffer.slice(0, space + 1));
                buffer = buffer.slice(space + 1);
                column = [...buffer].reduce(advance, 0);
            } else {
                out.push(buffer);
                buffer = "";
                column = 0;
            }
            continue;
        }
        buffer += chars[i];
        column = next;
        i++;
    }
    out.push(buffer);
    return out;
}

// Mostra i caratteri speciali come li scriveresti nella shell
const shellQuote = set => `'${set.replace(/\n/g, "\\n")}'`;

// sed -E usa le regex estese POSIX (ERE), tradotte con ereToJs (classi [[:digit:]] comprese).
// Niente alternative "|": in s/// conta anche cosa cattura ogni gruppo, e lì POSIX (la
// corrispondenza più lunga) e JavaScript (la prima alternativa) possono dare gruppi diversi.
function sedPatternError(pattern) {
    if (pattern.includes("|")) return "l'alternativa | non è supportata in sed: usala con grep -E";
    return erePatternError(pattern);
}

// Il delimitatore di s/// è "/", oppure "#" se pattern o sostituzione contengono "/"
const sedDelimiter = a => (a.pattern + (a.replacement || "")).includes("/") ? "#" : "/";

// Sostituzione in stile sed: & è l'intera corrispondenza, \1..\9 i gruppi, \& e \\ letterali, \n a capo
function sedReplacement(template, match, groups) {
    let out = "";
    for (let i = 0; i < template.length; i++) {
        const c = template[i];
        if (c === "&") {
            out += match;
        } else if (c === "\\" && i + 1 < template.length) {
            const next = template[++i];
            if (/[1-9]/.test(next)) out += groups[Number(next) - 1] ?? "";
            else if (next === "n") out += "\n";
            else out += next;
        } else {
            out += c;
        }
    }
    return out;
}

// s///: come GNU, una corrispondenza vuota subito dopo la precedente non viene sostituita
// (JavaScript la sostituirebbe: con s/x*/-/g, "x" darebbe "--" invece di "-")
function sedSubstitute(line, regex, replacement, global) {
    let out = "";
    let pos = 0;
    let prevEnd = -1;
    while (pos <= line.length) {
        regex.lastIndex = pos;
        const m = regex.exec(line);
        if (!m) break;
        const start = m.index;
        const end = start + m[0].length;
        if (start === end && start === prevEnd) {
            if (start >= line.length) break;
            out += line.slice(pos, start + 1);
            pos = start + 1;
            continue;
        }
        out += line.slice(pos, start) + sedReplacement(replacement, m[0], m.slice(1));
        prevEnd = end;
        if (start === end) {
            if (start >= line.length) {
                pos = start;
                break;
            }
            out += line[start];
            pos = start + 1;
        } else {
            pos = end;
        }
        if (!global) break;
    }
    return out + line.slice(pos);
}

// --- Atto XI: espressioni regolari estese (grep -E), tradotte in una RegExp di JavaScript ---

// Classi POSIX come nel locale C (solo ASCII)
const POSIX_CLASSES = {
    digit: "0-9", alpha: "A-Za-z", alnum: "0-9A-Za-z", upper: "A-Z", lower: "a-z", xdigit: "0-9A-Fa-f",
    space: " \\t\\n\\r\\f\\v", blank: " \\t", punct: "!-\\/:-@\\[-`{-~"
};

// ERE di POSIX → sorgente di una RegExp. Lancia un messaggio se l'espressione usa qualcosa che
// il gioco non gestisce. Dentro [...] la barra \ è un carattere qualsiasi, come in POSIX.
function ereToJs(pattern) {
    let out = "";
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (c === "\\") {
            const next = pattern[i + 1];
            if (next === undefined) throw "l'espressione non può finire con \\";
            if (/[A-Za-z0-9]/.test(next)) throw `\\${next} non è un'espressione estesa POSIX: usa le classi, es. [[:digit:]] o [0-9]`;
            out += "\\" + next;
            i++;
        } else if (c === "[") {
            let j = i + 1;
            let body = "";
            if (pattern[j] === "^") { body += "^"; j++; }
            if (pattern[j] === "]") { body += "\\]"; j++; }
            for (; j < pattern.length && pattern[j] !== "]"; j++) {
                if (pattern[j] === "[" && pattern[j + 1] === ":") {
                    const end = pattern.indexOf(":]", j + 2);
                    if (end === -1) throw "classe [:...:] non chiusa";
                    const name = pattern.slice(j + 2, end);
                    if (!POSIX_CLASSES[name]) throw `classe [:${name}:] sconosciuta: usa digit, alpha, alnum, upper, lower, space, blank, punct o xdigit`;
                    body += POSIX_CLASSES[name];
                    j = end + 1;
                } else if (pattern[j] === "[" && (pattern[j + 1] === "=" || pattern[j + 1] === ".")) {
                    throw "[= =] e [. .] non sono supportati";
                } else if (pattern[j] === "\\" || pattern[j] === "[") {
                    body += "\\" + pattern[j];
                } else {
                    body += pattern[j];
                }
            }
            if (j >= pattern.length) throw "parentesi [ non chiusa";
            if (body === "" || body === "^") throw "parentesi [] vuota";
            out += `[${body}]`;
            i = j;
        } else if (c === "{") {
            const interval = /^\{([0-9]+)(,([0-9]*))?\}/.exec(pattern.slice(i));
            if (!interval || i === 0 || /[|(]/.test(pattern[i - 1])) throw "{ si usa dopo un carattere, come {3} o {2,4}";
            if (interval[3] && Number(interval[3]) < Number(interval[1])) throw `{${interval[1]},${interval[3]}}: il minimo supera il massimo`;
            out += interval[0];
            i += interval[0].length - 1;
        } else if (c === "(" && pattern[i + 1] === "?") {
            throw "costrutto (?...) non supportato";
        } else {
            out += c;
        }
    }
    if (/\([^)]*[+*][^)]*\)\s*[+*{]/.test(pattern)) throw "quantificatori annidati come (a+)+ non sono supportati";
    try {
        new RegExp(out);
    } catch (e) {
        throw "espressione regolare non valida";
    }
    return out;
}

function erePatternError(pattern) {
    if (!pattern) return "serve un'espressione da cercare";
    if (pattern.startsWith("-")) return "l'espressione inizia con -: grep la prenderebbe per un'opzione (scrivi [-] al posto del primo -)";
    try {
        ereToJs(pattern);
        return null;
    } catch (message) {
        return message;
    }
}

// Corrispondenze per grep -o -E: come POSIX, la più a sinistra e, a parità di inizio, la più
// lunga (JavaScript prenderebbe la prima alternativa: con 'a|ab' su "ab" darebbe "a").
// Le corrispondenze vuote non si stampano.
function ereFindAll(line, source) {
    const probe = new RegExp(source, "y");
    const found = [];
    let pos = 0;
    while (pos <= line.length) {
        let start = -1;
        for (let i = pos; i <= line.length; i++) {
            probe.lastIndex = i;
            if (probe.test(line)) { start = i; break; }
        }
        if (start === -1) break;
        let end = start;
        for (let j = line.length; j > start; j--) {
            const bounded = new RegExp(`(?:${source})(?=[\\s\\S]{${line.length - j}}$)`, "y");
            bounded.lastIndex = start;
            if (bounded.test(line)) { end = j; break; }
        }
        if (end === start) {
            pos = start + 1;
            continue;
        }
        found.push(line.slice(start, end));
        pos = end;
    }
    return found;
}

// --- Atto X: impronte (md5sum, sha256sum) e od -c lavorano sui byte del flusso in UTF-8 ---

// Il flusso come byte: ogni riga in UTF-8 seguita dall'a capo
function streamBytes(lines) {
    const bytes = [];
    for (const line of lines) {
        for (const c of line) {
            let code = c.codePointAt(0);
            if (code < 0x80) bytes.push(code);
            else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
            else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
            else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
        }
        bytes.push(10);
    }
    return bytes;
}

const hex32 = (n, littleEndian) => {
    const bytes = [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    return (littleEndian ? bytes.reverse() : bytes).map(b => b.toString(16).padStart(2, "0")).join("");
};

// Riempimento comune a MD5 e SHA-256: 0x80, zeri, lunghezza in bit su 64 bit
function padMessage(bytes, littleEndian) {
    const padded = [...bytes, 0x80];
    while (padded.length % 64 !== 56) padded.push(0);
    const bits = bytes.length * 8;
    const length = [];
    for (let i = 0; i < 8; i++) length.push(Math.floor(bits / 2 ** (8 * i)) & 255);
    return padded.concat(littleEndian ? length : length.reverse());
}

function md5Hex(bytes) {
    const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    const m = padMessage(bytes, true);
    let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let off = 0; off < m.length; off += 64) {
        const w = Array.from({ length: 16 }, (_, i) => m[off + 4 * i] | (m[off + 4 * i + 1] << 8) | (m[off + 4 * i + 2] << 16) | (m[off + 4 * i + 3] << 24));
        let [a, b, c, d] = [a0, b0, c0, d0];
        for (let i = 0; i < 64; i++) {
            let f, g;
            if (i < 16) { f = (b & c) | (~b & d); g = i; }
            else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
            else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
            else { f = c ^ (b | ~d); g = (7 * i) % 16; }
            const shift = S[(i >> 4) * 4 + (i % 4)];
            const sum = (a + f + K[i] + w[g]) | 0;
            [a, d, c] = [d, c, b];
            b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
        }
        a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
    }
    return [a0, b0, c0, d0].map(n => hex32(n >>> 0, true)).join("");
}

function sha256Hex(bytes) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const m = padMessage(bytes, false);
    for (let off = 0; off < m.length; off += 64) {
        const w = new Array(64);
        for (let i = 0; i < 16; i++) w[i] = (m[off + 4 * i] << 24) | (m[off + 4 * i + 1] << 16) | (m[off + 4 * i + 2] << 8) | m[off + 4 * i + 3];
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
            const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) | 0, c, b, a, (t1 + t2) | 0];
        }
        [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) | 0; });
    }
    return H.map(n => hex32(n >>> 0, false)).join("");
}

// od -c di GNU: 16 byte per riga con l'offset in ottale; caratteri speciali come \n \t,
// gli altri byte non stampabili in ottale; le righe uguali di fila diventano «*»
const OD_ESCAPES = { 0: "\\0", 7: "\\a", 8: "\\b", 9: "\\t", 10: "\\n", 11: "\\v", 12: "\\f", 13: "\\r" };
function odDump(lines) {
    const bytes = streamBytes(lines);
    const out = [];
    const offset = n => n.toString(8).padStart(7, "0");
    let previous = null;
    let starred = false;
    for (let at = 0; at < bytes.length; at += 16) {
        const chunk = bytes.slice(at, at + 16);
        const key = chunk.join(",");
        if (chunk.length === 16 && key === previous) {
            if (!starred) out.push("*");
            starred = true;
            continue;
        }
        previous = key;
        starred = false;
        out.push(offset(at) + chunk.map(b => (OD_ESCAPES[b] || (b >= 32 && b < 127 ? String.fromCharCode(b) : b.toString(8).padStart(3, "0"))).padStart(4)).join(""));
    }
    out.push(offset(bytes.length));
    return out;
}

const hashLine = (hex) => `${hex}  -`;

// Il file di zcat, bzcat e xzcat: un nome e delle righe (non serve che siano ordinate)
function compressedFileError(a) {
    if (!/^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(a.file || "")) return "il nome del file può contenere solo lettere, cifre, . _ -";
    if (!Array.isArray(a.lines) || a.lines.length === 0) return "il file non ha righe";
    return null;
}

// Il file di comm e join nella riga di bash: process substitution con il suo contenuto
const processSubstitution = lines => `<(printf '%s\\n' ${lines.map(line => `'${line.replace(/'/g, "'\\''")}'`).join(" ")})`;

// Il file di comm e join: un nome semplice e righe ordinate (per comm la riga, per join la chiave)
function fileError(a, keyOf) {
    if (!/^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(a.file || "")) return "il nome del file può contenere solo lettere, cifre, . _ -";
    if (!Array.isArray(a.lines) || a.lines.length === 0) return "il file non ha righe";
    for (let i = 1; i < a.lines.length; i++) {
        if (byteOrder(keyOf(a.lines[i - 1]), keyOf(a.lines[i])) > 0) return "le righe del file devono essere ordinate (LC_ALL=C sort)";
    }
    return null;
}

// GNU comm: unisce due elenchi ordinati. mode indica le colonne da nascondere (12: solo le righe
// comuni; 23: solo quelle dello stdin; 13: solo quelle del file). Se un input non è ordinato
// avvisa su stderr, ma solo dopo aver visto una riga non accoppiata (come GNU).
function commLines(first, second, mode) {
    const visible = { "12": 3, "23": 1, "13": 2 }[mode];
    const out = [];
    const warned = [false, false];
    let seenUnpairable = false;
    const input = [first, second];
    const pos = [0, 0];
    // Dopo aver letto una riga la confronta con la precedente; a fine file ricontrolla le ultime
    // due, perché nel frattempo può essere comparsa una riga senza coppia (come GNU comm)
    const warn = (which, previous, current) => {
        if (seenUnpairable && !warned[which] && byteOrder(previous, current) > 0) {
            out.push({ err: `comm: file ${which + 1} is not in sorted order` });
            warned[which] = true;
        }
    };
    const step = which => {
        const lines = input[which];
        const i = ++pos[which];
        if (i < lines.length) warn(which, lines[i - 1], lines[i]);
        else if (i >= 2) warn(which, lines[i - 2], lines[i - 1]);
    };
    while (pos[0] < first.length || pos[1] < second.length) {
        const order = pos[0] >= first.length ? 1 : pos[1] >= second.length ? -1 : byteOrder(first[pos[0]], second[pos[1]]);
        if (order === 0) {
            if (visible === 3) out.push(second[pos[1]]);
        } else {
            seenUnpairable = true;
            if (order < 0 && visible === 1) out.push(first[pos[0]]);
            if (order > 0 && visible === 2) out.push(second[pos[1]]);
        }
        // Avanza il file da cui viene la riga (entrambi se coincidono), prima il primo
        if (order <= 0) step(0);
        if (order >= 0) step(1);
    }
    if (warned[0] || warned[1]) out.push({ err: "comm: input is not in sorted order" });
    return out;
}

// Campi di join: separati da -t, oppure da spazi e tabulazioni (ignorando quelli iniziali)
function joinFields(line, separator) {
    if (separator) return line === "" ? [] : line.split(separator);
    const trimmed = line.replace(/^[ \t]+/, "");
    return trimmed === "" ? [] : trimmed.split(/[ \t]+/).filter((field, i, all) => field !== "" || i < all.length - 1);
}

// GNU join sul campo 1: per ogni chiave presente in entrambi, chiave + resto della riga dello
// stdin + resto della riga del file (ogni coppia, se la chiave si ripete). Le righe senza coppia
// spariscono. Come GNU legge gli input a gruppi e avvisa su stderr se non sono ordinati.
function joinLines(first, second, separator) {
    const outSep = separator || " ";
    const names = ["-", "file"];
    const input = [first, second];
    const pos = [0, 0];
    const prev = [null, null];
    const warned = [false, false];
    let seenUnpairable = false;
    const out = [];
    const key = line => line.fields[0] ?? "";
    const getLine = which => {
        if (pos[which] >= input[which].length) return null;
        const text = input[which][pos[which]++];
        const line = { text, fields: joinFields(text, separator) };
        if (prev[which] && seenUnpairable && !warned[which] && byteOrder(key(prev[which]), key(line)) > 0) {
            out.push({ err: `join: ${names[which]}:${pos[which]}: is not sorted: ${text}` });
            warned[which] = true;
        }
        prev[which] = line;
        return line;
    };
    const seq = [[], []];
    const getseq = which => {
        const line = getLine(which);
        if (line) seq[which].push(line);
        return Boolean(line);
    };
    const pair = (a, b) => (a.fields[0] ?? "") + a.fields.slice(1).map(f => outSep + f).join("") + b.fields.slice(1).map(f => outSep + f).join("");
    getseq(0);
    getseq(1);
    while (seq[0].length && seq[1].length) {
        const diff = byteOrder(key(seq[0][0]), key(seq[1][0]));
        if (diff !== 0) {
            const which = diff < 0 ? 0 : 1;
            seq[which] = [];
            getseq(which);
            seenUnpairable = true;
            continue;
        }
        // Tutte le righe consecutive con la stessa chiave, prima nello stdin e poi nel file
        let eof1 = false;
        do {
            if (!getseq(0)) { eof1 = true; break; }
        } while (byteOrder(key(seq[0][seq[0].length - 1]), key(seq[1][0])) === 0);
        let eof2 = false;
        do {
            if (!getseq(1)) { eof2 = true; break; }
        } while (byteOrder(key(seq[0][0]), key(seq[1][seq[1].length - 1])) === 0);
        const group1 = eof1 ? seq[0] : seq[0].slice(0, -1);
        const group2 = eof2 ? seq[1] : seq[1].slice(0, -1);
        for (const a of group1) for (const b of group2) out.push(pair(a, b));
        seq[0] = eof1 ? [] : seq[0].slice(-1);
        seq[1] = eof2 ? [] : seq[1].slice(-1);
    }
    // GNU legge anche il resto degli input per controllarne l'ordine
    for (const which of [0, 1]) {
        if (!seq[which].length || (warned[0] && warned[1])) continue;
        while (getLine(which)) if (warned[which]) break;
    }
    if (warned[0] || warned[1]) out.push({ err: "join: input is not in sorted order" });
    return out;
}

// File del livello (nome → righe), letti dagli argomenti di comm e join
function levelFiles(lvl) {
    const files = {};
    for (const step of lvl.allowedCommands || []) {
        if (step.args && step.args.file && Array.isArray(step.args.lines)) files[step.args.file] = step.args.lines;
    }
    return files;
}

// awk divide sui gruppi di spazi e tabulazioni (ignorando quelli iniziali), oppure esattamente su -F
function awkFields(line, separator) {
    if (separator) return line.split(separator);
    const trimmed = line.replace(/^[ \t]+|[ \t]+$/g, "");
    return trimmed === "" ? [] : trimmed.split(/[ \t]+/);
}

const COMMANDS = {
    grep: {
        params: [
            { key: "pattern", type: "text", label: "testo" }, { key: "invert", type: "flag", label: "-v" }, { key: "only", type: "flag", label: "-o" },
            { key: "ignoreCase", type: "flag", label: "-i" }, { key: "word", type: "flag", label: "-w" }, { key: "count", type: "flag", label: "-c" }
        ],
        label: a => `grep${a.invert ? " -v" : ""}${a.only ? " -o" : ""}${a.ignoreCase ? " -i" : ""}${a.word ? " -w" : ""}${a.count ? " -c" : ""} '${a.pattern}'`,
        validate: a => a.invert && a.only ? "nel gioco -o e -v non vanno insieme"
            : a.only && a.count ? "-c conta le righe: non va insieme a -o"
            : String(a.pattern).startsWith("-") ? "il testo inizia con -: grep lo prenderebbe per un'opzione" : null,
        run: (s, a) => {
            const matches = line => grepMatches(line, a);
            // -o: una riga per ogni occorrenza del testo (senza sovrapposizioni, da sinistra)
            if (a.only) return s.flatMap(matches);
            const kept = s.filter(line => (matches(line).length > 0) !== Boolean(a.invert));
            return a.count ? [String(kept.length)] : kept;
        }
    },
    // grep -E: espressioni regolari estese (Atto XI). Un comando a parte, come cut -c
    grepe: {
        params: [
            { key: "pattern", type: "text", label: "regex" }, { key: "invert", type: "flag", label: "-v" },
            { key: "only", type: "flag", label: "-o" }, { key: "count", type: "flag", label: "-c" }
        ],
        label: a => `grep -E${a.invert ? " -v" : ""}${a.only ? " -o" : ""}${a.count ? " -c" : ""} '${a.pattern}'`,
        validate: a => a.invert && a.only ? "nel gioco -o e -v non vanno insieme"
            : a.only && a.count ? "-c conta le righe: non va insieme a -o" : erePatternError(a.pattern),
        run: (s, a) => {
            const source = ereToJs(a.pattern);
            if (a.only) return s.flatMap(line => ereFindAll(line, source));
            const regex = new RegExp(source);
            const kept = s.filter(line => regex.test(line) !== Boolean(a.invert));
            return a.count ? [String(kept.length)] : kept;
        }
    },
    sort: {
        params: [
            { key: "reverse", type: "flag", label: "-r" }, { key: "numeric", type: "flag", label: "-n" },
            { key: "human", type: "flag", label: "-h" }, { key: "unique", type: "flag", label: "-u" },
            { key: "separator", type: "char", label: "-t", optional: true }, { key: "key", type: "number", label: "-k", optional: true }
        ],
        label: a => `sort${a.reverse || a.numeric || a.human || a.unique ? " -" : ""}${a.reverse ? "r" : ""}${a.numeric ? "n" : ""}${a.human ? "h" : ""}${a.unique ? "u" : ""}` +
            (a.key ? ` -t'${a.separator}' -k${a.key},${a.key}` : ""),
        // -k N,N confronta solo il campo N (separato da -t): -k N senza ",N" arriverebbe a fine riga
        validate: a => (a.key && !a.separator) || (!a.key && a.separator) ? "nel gioco -t e -k si usano insieme, es. sort -t',' -k2,2"
            : a.numeric && a.human ? "-n e -h non si usano insieme: -h ordina già i numeri, anche con K, M, G" : null,
        run: (s, a) => {
            const keyOf = line => a.key ? (line.split(a.separator)[a.key - 1] ?? "") : line;
            const byKey = a.human ? (x, y) => humanCompare(keyOf(x), keyOf(y))
                : a.numeric ? (x, y) => leadingNumber(keyOf(x)) - leadingNumber(keyOf(y))
                : (x, y) => byteOrder(keyOf(x), keyOf(y));
            const direction = a.reverse ? -1 : 1;
            if (a.unique) {
                // -u: come GNU, niente confronto finale sulla riga intera: l'ordinamento è stabile e
                // di ogni gruppo con la stessa chiave resta la prima riga
                const sorted = [...s].sort((x, y) => direction * byKey(x, y));
                return sorted.filter((line, i) => i === 0 || byKey(sorted[i - 1], line) !== 0);
            }
            // A parità di chiave GNU sort confronta l'intera riga
            const sorted = [...s].sort((x, y) => byKey(x, y) || byteOrder(x, y));
            return a.reverse ? sorted.reverse() : sorted;
        }
    },
    uniq: {
        params: [{ key: "count", type: "flag", label: "-c" }, { key: "repeated", type: "flag", label: "-d" }, { key: "unique", type: "flag", label: "-u" }],
        label: a => `uniq${a.count || a.repeated || a.unique ? " -" : ""}${a.count ? "c" : ""}${a.repeated ? "d" : ""}${a.unique ? "u" : ""}`,
        validate: a => a.repeated && a.unique ? "-d e -u insieme non stampano niente: scegline uno" : null,
        run: (s, a) => {
            const groups = [];
            for (const line of s) {
                const last = groups[groups.length - 1];
                if (last && last.line === line) last.count++;
                else groups.push({ line, count: 1 });
            }
            // -d: solo le righe ripetute, una volta. -c antepone il conteggio su 7 caratteri, come GNU
            // -u: solo le righe che non si ripetono
            return groups.filter(g => (!a.repeated || g.count > 1) && (!a.unique || g.count === 1))
                .map(g => a.count ? `${String(g.count).padStart(7)} ${g.line}` : g.line);
        }
    },
    tac: {
        params: [],
        label: () => "tac",
        run: s => [...s].reverse()
    },
    rev: {
        params: [],
        label: () => "rev",
        run: s => s.map(line => [...line].reverse().join(""))
    },
    upper: {
        params: [],
        label: () => "sed 's/.*/\\U&/'",
        run: s => s.map(line => line.toUpperCase())
    },
    head: {
        params: [{ key: "n", type: "number", label: "-n", default: 2 }],
        label: a => `head -n ${a.n}`,
        run: (s, a) => s.slice(0, a.n)
    },
    tail: {
        params: [{ key: "n", type: "number", label: "-n", default: 2 }],
        label: a => `tail -n ${a.n}`,
        run: (s, a) => s.slice(-a.n)
    },
    wc: {
        params: [],
        label: () => "wc -l",
        run: s => [String(s.length)]
    },
    cut: {
        params: [
            { key: "delim", type: "char", label: "-d", default: ":" }, { key: "field", type: "number", label: "-f", optional: true },
            { key: "fields", type: "text", label: "-f (elenco)", optional: true }, { key: "complement", type: "flag", label: "--complement" }
        ],
        label: a => `cut -d'${a.delim}'${a.complement ? " --complement" : ""} -f${a.fields || a.field}`,
        validate: a => {
            if (Boolean(a.fields) === Boolean(a.field)) return "serve un campo (-f2) oppure un elenco (-f1,3, -f2-), non tutti e due";
            if (a.fields && !cutFieldSet(a.fields)) return "elenco di campi non valido: es. 1,3 oppure 2- oppure 1-3";
            return null;
        },
        // Le righe senza delimitatore passano intere, come fa cut senza -s. I campi escono
        // nell'ordine della riga, uniti dal delimitatore
        run: (s, a) => {
            const wanted = a.fields ? cutFieldSet(a.fields) : (n => n === a.field);
            const keep = n => Boolean(wanted(n)) !== Boolean(a.complement);
            return s.map(line => line.includes(a.delim)
                ? line.split(a.delim).filter((_, i) => keep(i + 1)).join(a.delim)
                : line);
        }
    },
    wcw: {
        params: [],
        label: () => "wc -w",
        // Parole: pezzi separati da spazi, tabulazioni e a capo
        run: s => [String(s.join("\n").split(/[ \t\n\v\f\r]+/).filter(Boolean).length)]
    },
    wcc: {
        params: [],
        label: () => "wc -c",
        // Byte, compresi gli a capo (le lettere accentate valgono 2 byte in UTF-8)
        run: s => [String(s.reduce((sum, line) => sum + utf8Length(line) + 1, 0))]
    },
    cutc: {
        params: [{ key: "from", type: "number", label: "-c da", default: 1 }, { key: "to", type: "number", label: "a", default: 3 }],
        label: a => `cut -c${a.from === a.to ? a.from : `${a.from}-${a.to}`}`,
        validate: a => a.to < a.from ? "l'ultimo carattere viene prima del primo" : null,
        // Caratteri dal from-esimo al to-esimo (le righe più corte danno quello che c'è, anche niente)
        run: (s, a) => s.map(line => [...line].slice(a.from - 1, a.to).join(""))
    },
    tr: {
        params: [{ key: "from", type: "set", label: "da" }, { key: "to", type: "set", label: "a" }, { key: "delete", type: "set", label: "-d" }],
        label: a => a.delete ? `tr -d ${shellQuote(a.delete)}` : `tr ${shellQuote(a.from)} ${shellQuote(a.to)}`,
        // Il gioco applica tr riga per riga: trasformare o cancellare gli a capo unirebbe le righe
        validate: a => (a.delete || a.from || "").includes("\n") ? "tr non può agire sugli a capo: per unire le righe usa paste -sd" : null,
        run: (s, a) => {
            if (s.length === 0) return [];
            const text = s.map(line => {
                if (a.delete) {
                    const del = expandSet(a.delete);
                    return [...line].filter(c => !del.includes(c)).join("");
                }
                const from = expandSet(a.from);
                const to = expandSet(a.to);
                return [...line].map(c => {
                    const i = from.indexOf(c);
                    return i === -1 ? c : to[Math.min(i, to.length - 1)];
                }).join("");
            });
            // Se tr introduce degli a capo, il flusso si spezza in più righe
            return text.join("\n").split("\n");
        }
    },
    sed: {
        params: [
            { key: "pattern", type: "text", label: "regex" },
            { key: "replacement", type: "text", label: "sostituzione", optional: true },
            { key: "global", type: "flag", label: "g" }
        ],
        label: a => {
            const d = sedDelimiter(a);
            return `sed -E 's${d}${a.pattern}${d}${(a.replacement || "")}${d}${a.global ? "g" : ""}'`;
        },
        validate: a => {
            if ((a.pattern + (a.replacement || "")).includes("/") && (a.pattern + (a.replacement || "")).includes("#")) {
                return "non usare insieme / e #";
            }
            if (/\\$/.test((a.replacement || ""))) return "la sostituzione non può finire con \\";
            return sedPatternError(a.pattern);
        },
        run: (s, a) => {
            if (s.length === 0) return [];
            const regex = new RegExp(ereToJs(a.pattern), "g");
            const text = s.map(line => sedSubstitute(line, regex, (a.replacement || ""), a.global));
            // Un \n nella sostituzione spezza la riga, come fa sed
            return text.join("\n").split("\n");
        }
    },
    awk: {
        params: [
            { key: "field", type: "number", label: "$", default: 1 },
            { key: "separator", type: "char", label: "-F", optional: true }
        ],
        label: a => `awk${a.separator ? ` -F'${a.separator}'` : ""} '{print $${a.field}}'`,
        run: (s, a) => s.map(line => awkFields(line, a.separator)[a.field - 1] ?? "")
    },
    // comm e join confrontano lo stdin (-) con un file del livello, ordinato
    comm: {
        params: [
            { key: "mode", type: "choice", label: "colonne", options: ["12", "23", "13"], default: "12" },
            { key: "file", type: "file", label: "file", default: "file.txt" },
            { key: "lines", type: "lines", label: "righe del file" }
        ],
        label: a => `comm -${a.mode} - ${a.file}`,
        shell: a => `comm -${a.mode} - ${processSubstitution(a.lines)}`,
        validate: a => fileError(a, line => line),
        run: (s, a) => commLines(s, a.lines, a.mode)
    },
    join: {
        params: [
            { key: "separator", type: "char", label: "-t", optional: true },
            { key: "file", type: "file", label: "file", default: "file.txt" },
            { key: "lines", type: "lines", label: "righe del file" }
        ],
        label: a => `join${a.separator ? ` -t'${a.separator}'` : ""} - ${a.file}`,
        shell: a => `join${a.separator ? ` -t'${a.separator}'` : ""} - ${processSubstitution(a.lines)}`,
        validate: a => fileError(a, line => joinFields(line, a.separator)[0] ?? ""),
        run: (s, a) => joinLines(s, a.lines, a.separator)
    },
    nl: {
        params: [
            { key: "all", type: "flag", label: "-ba" },
            { key: "width", type: "number", label: "-w", optional: true },
            { key: "separator", type: "text", label: "-s", optional: true }
        ],
        label: a => `nl${a.all ? " -ba" : ""}${a.width ? ` -w${a.width}` : ""}${a.separator ? ` -s'${a.separator}'` : ""}`,
        validate: a => a.separator && a.separator.length > 3 ? "nel gioco il separatore di nl è lungo al massimo 3 caratteri" : null,
        // Come GNU nl: numera le righe non vuote (-ba: tutte); le altre restano allineate con spazi
        run: (s, a) => {
            const width = a.width || 6;
            const separator = a.separator || "\t";
            let n = 1;
            return s.map(line => a.all || line !== "" ? String(n++).padStart(width) + separator + line : " ".repeat(width + separator.length) + line);
        }
    },
    tee: {
        params: [{ key: "file", type: "text", label: "file", default: "/dev/stderr" }],
        label: a => `tee ${a.file}`,
        validate: a => /^(\/dev\/stderr|\/dev\/null|[A-Za-z0-9_][A-Za-z0-9._-]*)$/.test(a.file) ? null : "nel gioco tee scrive su un file semplice (es. copia.txt) o su /dev/stderr",
        // Lascia passare il flusso; con /dev/stderr lo ricopia anche sullo stderr (il terminale)
        run: (s, a) => a.file === "/dev/stderr" ? [...s, ...s.map(text => ({ err: text }))] : s
    },
    squeeze: {
        params: [{ key: "set", type: "set", label: "-s" }],
        label: a => `tr -s ${shellQuote(a.set)}`,
        validate: a => (a.set || "").includes("\n") ? "tr -s non può agire sugli a capo: il gioco lavora riga per riga" : null,
        // Ogni gruppo di caratteri uguali dell'insieme diventa uno solo (tr -s ' ' per i gruppi di spazi)
        run: (s, a) => {
            const set = expandSet(a.set);
            return s.map(line => {
                let out = "";
                for (const c of line) {
                    if (set.includes(c) && out[out.length - 1] === c) continue;
                    out += c;
                }
                return out;
            });
        }
    },
    fold: {
        params: [{ key: "width", type: "number", label: "-w" }, { key: "spaces", type: "flag", label: "-s" }],
        label: a => `fold${a.spaces ? " -s" : ""} -w ${a.width}`,
        run: (s, a) => s.flatMap(line => foldLine(line, a.width, a.spaces))
    },
    xargs: {
        params: [{ key: "n", type: "number", label: "-n", optional: true }],
        label: a => a.n ? `xargs -n ${a.n}` : "xargs",
        run: (s, a) => runXargs(s, a.n)
    },
    md5sum: {
        params: [],
        label: () => "md5sum",
        // L'impronta MD5 di tutto il flusso: una riga «impronta  -» (il trattino è lo stdin)
        run: s => [hashLine(md5Hex(streamBytes(s)))]
    },
    sha256sum: {
        params: [],
        label: () => "sha256sum",
        run: s => [hashLine(sha256Hex(streamBytes(s)))]
    },
    od: {
        params: [],
        label: () => "od -c",
        run: s => odDump(s)
    },
    zcat: {
        params: [{ key: "file", type: "file", label: "file", default: "log.gz" }, { key: "lines", type: "lines", label: "righe del file (decompresso)" }],
        label: a => `zcat ${a.file}`,
        shell: a => `zcat ${processSubstitution(a.lines).replace(/\)$/, " | gzip)")}`,
        validate: compressedFileError,
        // Legge il file compresso e ignora lo stdin
        run: (s, a) => [...a.lines]
    },
    bzcat: {
        params: [{ key: "file", type: "file", label: "file", default: "log.bz2" }, { key: "lines", type: "lines", label: "righe del file (decompresso)" }],
        label: a => `bzcat ${a.file}`,
        shell: a => `bzcat ${processSubstitution(a.lines).replace(/\)$/, " | bzip2)")}`,
        validate: compressedFileError,
        run: (s, a) => [...a.lines]
    },
    xzcat: {
        params: [{ key: "file", type: "file", label: "file", default: "log.xz" }, { key: "lines", type: "lines", label: "righe del file (decompresso)" }],
        label: a => `xzcat ${a.file}`,
        shell: a => `xzcat ${processSubstitution(a.lines).replace(/\)$/, " | xz)")}`,
        validate: compressedFileError,
        run: (s, a) => [...a.lines]
    },
    paste: {
        params: [{ key: "delim", type: "char", label: "-d", default: "," }],
        label: a => `paste -sd'${a.delim}'`,
        // Unisce tutte le righe in una sola; anche senza input produce una riga (vuota)
        run: (s, a) => [s.join(a.delim)]
    },
    devnull: {
        params: [],
        label: () => "2>/dev/null",
        redirect: true,
        route: "null"
    },
    merge: {
        params: [],
        label: () => "2>&1",
        redirect: true,
        route: "pipe"
    }
};

// Opzione "slot vuoto": lascia passare il flusso invariato
const EMPTY_STEP = { cmd: null, desc: "Nessuna operazione" };

function stepLabel(step) {
    return step.cmd === null ? "[ Vuoto ]" : COMMANDS[step.cmd].label(step.args || {});
}

// Nei livelli una riga di stderr si scrive { err: "testo" }, una di stdout come semplice stringa
function normalizeInput(stdin) {
    return stdin.map(line => typeof line === "string" ? { text: line, fd: 1 } : { text: line.err, fd: 2 });
}

const textsOf = (lines, fd) => lines.filter(line => line.fd === fd).map(line => line.text);

// Stato della pipeline:
// - lines: output del comando corrente (stdout e stderr nell'ordine di scrittura)
// - errRoute: destinazione del suo stderr ("terminal", "null" o "pipe")
// - terminal: stderr dei comandi precedenti già finito sul terminale
function initialState(stdin) {
    return { lines: normalizeInput(stdin), errRoute: "terminal", terminal: [] };
}

// Applica la destinazione dello stderr: cosa entra nella pipe e cosa arriva al terminale
function resolveOutput(state) {
    const piped = state.lines.filter(line => line.fd === 1 || state.errRoute === "pipe");
    return {
        stdout: piped.map(line => line.text),
        toTerminal: state.errRoute === "terminal" ? textsOf(state.lines, 2) : []
    };
}

function applyStep(state, step) {
    if (step.cmd === null) return state;
    const command = COMMANDS[step.cmd];
    if (command.redirect) {
        return { ...state, errRoute: command.route };
    }
    const { stdout, toTerminal } = resolveOutput(state);
    return {
        lines: command.run(stdout, step.args || {}).map(text => typeof text === "string" ? { text, fd: 1 } : { text: text.err, fd: 2 }),
        errRoute: "terminal",
        terminal: [...state.terminal, ...toTerminal]
    };
}

// A fine pipeline lo stderr dell'ultimo comando segue anch'esso la sua destinazione
function finishState(state) {
    const { stdout, toTerminal } = resolveOutput(state);
    return { output: stdout, stderr: [...state.terminal, ...toTerminal] };
}

// Righe come appaiono dopo uno step: lo stderr cestinato sparisce, quello unito diventa stdout
function visibleLines(state) {
    return state.lines
        .filter(line => line.fd === 1 || state.errRoute !== "null")
        .map(line => ({ text: line.text, fd: line.fd === 2 && state.errRoute === "pipe" ? 1 : line.fd }));
}

// Esegue gli step e restituisce stdout finale, stderr arrivato al terminale e lo stato dopo ogni step
function executePipeline(stdin, steps) {
    let state = initialState(stdin);
    const trace = [];
    for (const step of steps) {
        state = applyStep(state, step);
        trace.push({ lines: visibleLines(state), terminal: [...state.terminal] });
    }
    return { ...finishState(state), trace };
}

function streamsEqual(a, b) {
    return a.length === b.length && a.every((line, i) => line === b[i]);
}

// Livello risolto: stdout identico al target e sul terminale solo lo stderr previsto (di norma nessuno)
function isSolved(lvl, result) {
    return streamsEqual(result.output, lvl.target) && streamsEqual(result.stderr, lvl.targetStderr || []);
}
