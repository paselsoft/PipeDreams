// Effetti: dati che scorrono nel pannello del flusso, suoni sintetizzati, coriandoli ed effetto CRT.
// Tutto senza librerie né file esterni; le preferenze sono in settings (sound, crt).

const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Suoni (Web Audio): il contesto si crea al primo uso, che avviene sempre dopo un clic ---
let audioContext = null;

function tone(frequency, duration, { type = "square", volume = 0.035, delay = 0 } = {}) {
    if (!settings.sound) return;
    try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const start = audioContext.currentTime + delay;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
    } catch (e) {
        // audio non disponibile: si gioca in silenzio
    }
}

const playClick = () => tone(1400, 0.03, { volume: 0.015 });
// Il tono sale di un tono intero a ogni slot
const playStep = slot => tone(440 * Math.pow(2, (slot * 2) / 12), 0.09);
const playFail = () => tone(110, 0.35, { type: "sawtooth", volume: 0.03 });
function playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => tone(frequency, 0.22, { type: "triangle", volume: 0.05, delay: i * 0.09 }));
}

// --- Coriandoli e vibrazione per le vittorie a ★★★ ---
function celebrate(stars) {
    if (stars < 3) return;
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    if (prefersReducedMotion()) return;
    const glyphs = ["0", "1", "|", "$", ">", "#", "★"];
    for (let i = 0; i < 46; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti";
        piece.textContent = glyphs[i % glyphs.length];
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
        piece.style.setProperty("--rot", `${(Math.random() - 0.5) * 720}deg`);
        piece.style.setProperty("--dur", `${1.4 + Math.random() * 1.2}s`);
        piece.style.setProperty("--delay", `${Math.random() * 0.4}s`);
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 3200);
    }
}

// --- Effetto schermo CRT ---
function applyCrt() {
    document.body.classList.toggle("crt", Boolean(settings.crt));
}

// --- Dati che scorrono: animazione tra due stati del pannello del flusso ---
// Le righe che spariscono cadono, quelle rimaste scivolano nella nuova posizione (FLIP),
// quelle nuove o trasformate compaiono. duration è il tempo a disposizione per il passo.
let streamAnimation = 0;

const chipKey = chip => `${chip.classList.contains("err") ? 2 : 1}|${chip.textContent}`;

function animateStream(title, lines, terminal, duration) {
    const token = ++streamAnimation;
    const container = document.getElementById("stream-lines");
    const oldChips = [...container.children].filter(chip => !chip.classList.contains("empty"));
    if (duration < 150 || prefersReducedMotion() || skipRequested || oldChips.length === 0) {
        renderStream(title, lines, terminal);
        return;
    }

    // Quante righe di ogni tipo restano dopo il passo
    const remaining = new Map();
    for (const line of lines) {
        const key = `${line.fd}|${line.text === "" ? "(riga vuota)" : line.text}`;
        remaining.set(key, (remaining.get(key) || 0) + 1);
    }
    const leaveTime = duration * 0.35;
    const positions = new Map();
    for (const chip of oldChips) {
        const key = chipKey(chip);
        const left = remaining.get(key) || 0;
        if (left > 0) {
            remaining.set(key, left - 1);
            if (!positions.has(key)) positions.set(key, []);
            positions.get(key).push(chip.getBoundingClientRect());
        } else {
            chip.style.transitionDuration = `${leaveTime}ms`;
            chip.classList.add("leaving");
        }
    }

    setTimeout(() => {
        if (token !== streamAnimation) return;
        renderStream(title, lines, terminal);
        const moveTime = duration * 0.5;
        for (const chip of container.children) {
            const queue = positions.get(chipKey(chip));
            const before = queue && queue.shift();
            if (!before) {
                chip.style.animationDuration = `${moveTime}ms`;
                chip.classList.add("entering");
                continue;
            }
            const after = chip.getBoundingClientRect();
            chip.style.transition = "none";
            chip.style.transform = `translate(${before.left - after.left}px, ${before.top - after.top}px)`;
            requestAnimationFrame(() => {
                chip.style.transition = `transform ${moveTime}ms ease-in-out`;
                chip.style.transform = "";
            });
        }
    }, leaveTime);
}
