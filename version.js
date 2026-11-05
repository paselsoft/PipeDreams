// Versione del gioco e novità di ogni versione.
// APP_VERSION si aggiorna a mano a ogni nuova funzione, insieme a una voce in CHANGELOG;
// APP_BUILD lo scrive il workflow di pubblicazione (commit e data), in locale resta "sviluppo".
const APP_VERSION = "1.9.0";
const APP_BUILD = "sviluppo";

// Dalla più recente alla più vecchia
const CHANGELOG = [
    {
        version: "1.9.0", date: "2026-11-05", items: [
            "📚 Due nuovi casi a puntate, 4 capitoli ciascuno.",
            "✉️ «Il messaggio nascosto» (dopo l'Atto VI): la newsletter parte scritta allo specchio, e qualcuno ci ha nascosto un messaggio. Con rev, tac, cut -c e sort -k.",
            "☣️ «Il pacchetto avvelenato» (dopo l'Atto VII): un processo sconosciuto divora la CPU dei server. Con nl, comm, join e tee.",
            "🔒 Negli enigmi anche lo stderr atteso può essere nascosto: fa parte dell'indizio, e finisce nel taccuino."
        ]
    },
    {
        version: "1.8.0", date: "2026-11-05", items: [
            "💡 Aiuti nelle deduzioni dei casi: il primo evidenzia gli indizi che contano e dà un suggerimento, il secondo elimina una risposta sbagliata (massimo ★★).",
            "📊 Statistiche dei casi: capitoli, stelle di enigmi e deduzioni, deduzioni al primo colpo, errori e aiuti.",
            "⌨️ Gli enigmi dei casi si risolvono anche in modalità terminale.",
            "🔒 Se un enigma non riesce, il gioco dice quante righe ha l'indizio rispetto alla tua uscita."
        ]
    },
    {
        version: "1.7.0", date: "2026-11-04", items: [
            "📚 Casi a puntate: gialli divisi in capitoli. Le pipeline trovano gli indizi, tu deduci cosa è successo. Si aprono dal menu LIVELLI dopo l'Atto III.",
            "🔎 Primo caso: «Il server fantasma», 5 capitoli. Ogni notte alle 3:14 spariscono dei backup…",
            "🔒 Negli enigmi lo stdout atteso è nascosto: è l'indizio da scoprire. Gli indizi trovati finiscono nel 🗒 Taccuino.",
            "🏅 Nuovi obiettivi: Detective ed Elementare."
        ]
    },
    {
        version: "1.6.0", date: "2026-11-04", items: [
            "🛠 Atto VII, «Patch Tuesday»: 7 nuovi livelli sugli aggiornamenti di Debian (apt), Arch (pacman, yay) e Fedora (dnf, rpm). L'input è il vero output dei gestori di pacchetti.",
            "🧰 Nuovi comandi: nl (numerare), tee (vedere i dati a metà pipeline con tee /dev/stderr), comm e join (confrontare e unire con un file del livello).",
            "📁 I livelli possono avere dei file: li vedi sotto l'input, e nel terminale li usi per nome (comm -12 - critici.txt).",
            "📖 Manuale: schede per nl, tee, comm, join e per i gestori di pacchetti (apt, pacman, yay, paru, dnf, rpm).",
            "🎯 Allenamento: nuovi argomenti «nl» e «comm e join»."
        ]
    },
    {
        version: "1.5.0", date: "2026-11-04", items: [
            "🌍 Galleria della community: livelli creati dai giocatori, da giocare dal menu LIVELLI. Le stelle restano salvate (anche nel backup).",
            "📝 Nell'editor, 🌍 PROPONI ALLA GALLERIA prepara una proposta su GitHub con il link del tuo livello.",
            "🏅 Nuovo obiettivo: Esploratore."
        ]
    },
    {
        version: "1.4.0", date: "2026-11-04", items: [
            "🎓 Tutorial guidato al primo avvio: ti accompagna passo per passo nel primo livello. Si rivede dal menu LIVELLI.",
            "⌨️ Si gioca tutto da tastiera: Tab tra le celle, Invio o ↓ per il comando successivo, ↑ per il precedente, Esc per chiudere le finestre.",
            "🔈 Celle, console e finestre leggibili dai lettori di schermo.",
            "👁 Colori per daltonici (blu e arancione) e simboli ✓ ✗ sulle righe giuste e sbagliate.",
            "Contrasti migliorati: il gioco passa i controlli automatici di accessibilità (axe)."
        ]
    },
    {
        version: "1.3.0", date: "2026-11-03", items: [
            "🚚 Atto VI, «Il grande trasloco»: 7 nuovi livelli e un nuovo finale della storia.",
            "🧰 Nuovi comandi: tac e rev, sort -t -k (ordinare per un campo), grep -o (contare le occorrenze), uniq -d (solo i doppioni), cut -c (tenere dei caratteri).",
            "📖 Manuale aggiornato: nuova scheda tac / rev ed esempi per le nuove opzioni.",
            "🎯 Allenamento: nuovo argomento «tac e rev» e nuovi livelli per sort, grep, uniq e cut."
        ]
    },
    {
        version: "1.2.0", date: "2026-11-03", items: [
            "📊 Confronto dopo la vittoria: se la tua pipeline è più lunga del necessario, il gioco si ferma, la mette accanto a quella ottimale e ti dice quale comando non serve. Con 🧪 LABORATORIO la vedi passo per passo.",
            "✨ Con una soluzione ottimale vedi anche le altre soluzioni ottimali.",
            "🎯 Allenamento: scegli un comando (grep, sort, uniq, sed...) e gioca livelli generati senza fine, prima brevi e poi più complessi.",
            "🏅 Nuovo obiettivo: In palestra."
        ]
    },
    {
        version: "1.1.0", date: "2026-11-03", items: [
            "💾 Backup dei progressi: un codice da copiare o un file da scaricare, per passare dal telefono al computer. Il ripristino può unire i progressi dei due dispositivi.",
            "🆕 Novità della versione: tocca il numero di versione in fondo alla pagina.",
            "🔄 Avviso quando è pronta una nuova versione del gioco."
        ]
    },
    {
        version: "1.0.0", date: "2026-11-03", items: [
            "29 livelli in 5 atti, con quiz, livelli di debug e celle bloccate.",
            "Storia, obiettivi, sfida del giorno e Maratona contro il tempo.",
            "Aiuti progressivi, modalità terminale, manuale con esempi e laboratorio.",
            "Editor dei livelli e livelli condivisibili con un link.",
            "App installabile che funziona anche offline."
        ]
    }
];

const appVersionText = () => `Pipe Dreams v${APP_VERSION} · ${APP_BUILD === "sviluppo" ? "versione di sviluppo" : `build ${APP_BUILD}`}`;

const changelogDate = key => key.split("-").reverse().join("/");

// Finestra delle novità, creata al primo uso (serve sia al gioco sia all'editor)
function openChangelog() {
    let overlay = document.getElementById("changelog-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "menu-overlay";
        overlay.id = "changelog-overlay";
        overlay.onclick = event => { if (event.target === overlay) closeChangelog(); };
        const panel = document.createElement("div");
        panel.className = "menu-panel manual-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", "changelog-title");
        panel.innerHTML = `<div class="menu-header"><h2 id="changelog-title">🆕 NOVITÀ</h2>
            <button class="menu-close" aria-label="Chiudi">✕</button></div><div id="changelog-body"></div>`;
        panel.querySelector(".menu-close").onclick = closeChangelog;
        const body = panel.querySelector("#changelog-body");
        for (const entry of CHANGELOG) {
            const title = document.createElement("h3");
            title.className = "manual-section";
            title.textContent = `v${entry.version} · ${changelogDate(entry.date)}${entry.version === APP_VERSION ? " (questa versione)" : ""}`;
            const list = document.createElement("ul");
            list.className = "changelog-list";
            for (const item of entry.items) {
                const row = document.createElement("li");
                row.textContent = item;
                list.appendChild(row);
            }
            body.append(title, list);
        }
        const build = document.createElement("p");
        build.className = "app-version";
        build.textContent = appVersionText();
        body.appendChild(build);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }
    overlay.hidden = false;
}

function closeChangelog() {
    const overlay = document.getElementById("changelog-overlay");
    if (overlay) overlay.hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".app-version").forEach(element => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "app-version-button";
        button.textContent = appVersionText() + " · novità";
        button.title = "Novità di questa versione";
        button.onclick = openChangelog;
        element.replaceChildren(button);
    });
});
