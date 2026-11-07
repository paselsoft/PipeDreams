// Avatar dei personaggi in pixel art: una griglia 16×16 per personaggio, disegnata come SVG
// (niente file di immagine: funziona offline e resta nitida a ogni dimensione).
// Ogni carattere della griglia è un colore della tavolozza; "." è trasparente.
// Tre espressioni: normale, preoccupato (sopracciglia alzate, bocca a «o»), contento.
// Le espressioni cambiano solo alcune righe (riga → nuovo contenuto).

const AVATAR_SKIN = { s: "#f2c9a0", e: "#0d1117", m: "#c0504d", k: "#3b2416", r: "#e8a5a0", w: "#e6edf3" };

const CHARACTERS = {
    marco: {
        name: "Marco", role: "il sistemista che ti fa da guida",
        palette: { h: "#2b2b2b", b: "#4a3426", t: "#2ea043" },
        rows: [
            "................",
            "....hhhhhhhh....",
            "...hhhhhhhhhh...",
            "...hhhhhhhhhh...",
            "...hssssssssh...",
            "...ssssssssss...",
            "...ssessssess...",
            "...ssssssssss...",
            "...bssssssssb...",
            "...bbbsmmsbbb...",
            "....bbbbbbbb....",
            ".....bbbbbb.....",
            "......ssss......",
            "...tttttttttt...",
            "..tttttttttttt..",
            "..tttttttttttt.."
        ],
        moods: {
            preoccupato: { 5: "...skksssskks...", 10: "....bbbmmbbb...." },
            contento: { 7: "...srssssssrs...", 9: "...bbmssssmbb...", 10: "....bbmmmmbb...." }
        }
    },
    giulia: {
        name: "Giulia", role: "la responsabile IT",
        palette: { h: "#5a3825", g: "#79c0ff", b: "#8957e5" },
        rows: [
            "....hhhhhhhh....",
            "...hhhhhhhhhh...",
            "..hhhhhhhhhhhh..",
            "..hhhsssssshhh..",
            "..hhsssssssshh..",
            "..hsgggssgggsh..",
            "..hsgegssgegsh..",
            "..hsgggssgggsh..",
            "..hssssssssssh..",
            "..hssssmmssssh..",
            "...hssssssssh...",
            "....ssssssss....",
            "......ssss......",
            "...bbbwwwwbbb...",
            "..bbbbwwwwbbbb..",
            "..bbbbbwwbbbbb.."
        ],
        moods: {
            preoccupato: { 4: "..hhskksskkshh..", 10: "...hsssmmsssh..." },
            contento: { 8: "..hsrsssssrssh..", 9: "..hssmssssmssh..", 10: "...hssmmmmssh..." }
        }
    },
    tommaso: {
        name: "Tommaso", role: "lo stagista",
        palette: { h: "#e3b341", f: "#d08a5b", o: "#f0883e" },
        rows: [
            "...h.hh.hh.h....",
            "..hhhhhhhhhhh...",
            "..hhhhhhhhhhhh..",
            "..hhhhhhhhhhhh..",
            "..hhsssssssshh..",
            "...ssssssssss...",
            "...ssessssess...",
            "...ssssssssss...",
            "...sfssssssfs...",
            "...ssssmmssss...",
            "....ssssssss....",
            ".....ssssss.....",
            "......ssss......",
            "...ooowoowooo...",
            "..oooooooooooo..",
            "..oooooooooooo.."
        ],
        moods: {
            preoccupato: { 5: "...skksssskks...", 10: "....sssmmsss...." },
            contento: { 9: "...ssmssssmss...", 10: "....ssmmmmss...." }
        }
    },
    irene: {
        name: "Irene", role: "l'amministratrice dei database",
        palette: { h: "#c9491e", b: "#1f6feb" },
        rows: [
            "....hhhhhhhh....",
            "...hhhhhhhhhh...",
            "..hhhhhhhhhhhh..",
            "..hhhhhhhhhhhh..",
            "..hhsssssssshh..",
            "..hhsssssssshh..",
            "..hhsesssseshh..",
            "..hhsssssssshh..",
            "..hhsssssssshh..",
            "..hhsssmmssshh..",
            "..hhhsssssshhh..",
            "..hhhhsssshhhh..",
            "..hhh.ssss.hhh..",
            "..hhbbbbbbbbhh..",
            "..bbbbbbbbbbbb..",
            "..bbbbbbbbbbbb.."
        ],
        moods: {
            preoccupato: { 5: "..hhskksskkshh..", 10: "..hhhssmmsshhh.." },
            contento: { 9: "..hhsmssssmshh..", 10: "..hhhsmmmmshhh.." }
        }
    },
    elena: {
        name: "Elena", role: "la tecnica dei distributori",
        palette: { y: "#da3633", h: "#8a5a2b", g: "#6e7681", o: "#f0883e" },
        rows: [
            "................",
            "....yyyyyyyy....",
            "...yyyyyyyyyy...",
            "...yyyyyyyyyyyyy",
            "...hssssssssh...",
            "...ssssssssss...",
            "...ssessssess...",
            "...ssssssssss...",
            "...ssssssssss...",
            "...ssssmmssss...",
            "....sssssssshh..",
            ".....ssssss..hh.",
            "......ssss......",
            "...gggggggggg...",
            "..ggoggggggogg..",
            "..gggggggggggg.."
        ],
        moods: {
            preoccupato: { 5: "...skksssskks...", 10: "....sssmmssshh.." },
            contento: { 9: "...ssmssssmss...", 10: "....ssmmmmsshh.." }
        }
    },
    bruno: {
        name: "Bruno", role: "un ex collega",
        palette: { h: "#8b949e", k: "#6e7681", j: "#8a5a2b" },
        rows: [
            "................",
            "................",
            ".....ssssss.....",
            "....ssssssss....",
            "...hssssssssh...",
            "...hssssssssh...",
            "...hsessssesh...",
            "...hssssssssh...",
            "...sskkkkkkss...",
            "...ssssmmssss...",
            "....ssssssss....",
            ".....ssssss.....",
            "......ssss......",
            "...jjjwwwwjjj...",
            "..jjjjwwwwjjjj..",
            "..jjjjjwwjjjjj.."
        ],
        moods: {
            preoccupato: { 5: "...hskksskksh...", 10: "....sssmmsss...." },
            contento: { 9: "...ssmssssmss...", 10: "....ssmmmmss...." }
        }
    }
};

const MOODS = ["normale", "preoccupato", "contento"];

// Personaggio da un nome come compare nei testi («Giulia»), o null
const characterByName = name => {
    const key = String(name || "").toLowerCase();
    return CHARACTERS[key] ? { id: key, ...CHARACTERS[key] } : null;
};

function avatarRows(character, mood = "normale") {
    const changes = (character.moods && character.moods[mood]) || {};
    return character.rows.map((row, i) => changes[i] ?? row);
}

function avatarSvg(character, mood) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const palette = { ...AVATAR_SKIN, ...character.palette };
    avatarRows(character, mood).forEach((row, y) => [...row].forEach((c, x) => {
        if (!palette[c]) return;
        const pixel = document.createElementNS(ns, "rect");
        pixel.setAttribute("x", x);
        pixel.setAttribute("y", y);
        pixel.setAttribute("width", 1);
        pixel.setAttribute("height", 1);
        pixel.setAttribute("fill", palette[c]);
        svg.appendChild(pixel);
    }));
    return svg;
}

// Riquadro dell'avatar: il ritratto del personaggio, oppure l'iniziale (es. autori della galleria).
// È decorativo: il nome resta scritto accanto, quindi i lettori di schermo lo saltano.
function avatarNode(name, mood = "normale", size = "small") {
    const box = document.createElement("span");
    box.className = `avatar avatar-${size}`;
    box.setAttribute("aria-hidden", "true");
    const character = characterByName(name);
    box.dataset.character = character ? character.id : "";
    box.dataset.mood = character ? mood : "";
    if (character) box.appendChild(avatarSvg(character, mood));
    else {
        box.classList.add("avatar-initial");
        box.textContent = String(name || "?").trim().charAt(0).toUpperCase() || "?";
    }
    return box;
}

// Mette l'avatar nel contenitore (vuoto se name è nullo)
function setAvatar(container, name, mood = "normale", size = "small") {
    container.replaceChildren(...(name ? [avatarNode(name, mood, size)] : []));
    container.hidden = !name;
}

// Espressione adatta a un messaggio: preoccupata per le emergenze
const moodForText = text => /🚨/.test(text || "") ? "preoccupato" : "normale";
