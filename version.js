// Versione del gioco e novità di ogni versione.
// APP_VERSION si aggiorna a mano a ogni nuova funzione, insieme a una voce in CHANGELOG;
// APP_BUILD lo scrive il workflow di pubblicazione (commit e data), in locale resta "sviluppo".
const APP_VERSION = "1.3.0";
const APP_BUILD = "sviluppo";

// Dalla più recente alla più vecchia
const CHANGELOG = [
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
        element.textContent = appVersionText() + " · novità";
        element.setAttribute("role", "button");
        element.tabIndex = 0;
        element.title = "Novità di questa versione";
        element.onclick = openChangelog;
        element.onkeydown = event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openChangelog(); } };
    });
});
