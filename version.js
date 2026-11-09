// Versione del gioco e novità di ogni versione.
// APP_VERSION si aggiorna a mano a ogni nuova funzione, insieme a una voce in CHANGELOG;
// APP_BUILD lo scrive il workflow di pubblicazione (commit e data), in locale resta "sviluppo".
const APP_VERSION = "1.21.0";
const APP_BUILD = "sviluppo";

// Dalla più recente alla più vecchia
const CHANGELOG = [
    {
        version: "1.21.0", date: "2026-11-09", items: [
            "🎓 Il Tutor: dopo ogni vittoria il pulsante «🎓 TUTOR» spiega il livello passo passo. Una pagina per comando: cosa fa, ogni opzione, le righe prima e dopo (evidenziate quelle che cambiano), cosa va sul terminale e cosa succederebbe togliendolo.",
            "📚 Si apre anche dal menu LIVELLI con 🎓 sui livelli già risolti, per ripassare. Funziona per campagna, quiz, debug, allenamento, sfida del giorno, galleria e casi; aprirlo ferma il passaggio automatico al livello successivo.",
            "💡 Nei livelli con una trappola classica c'è anche «Il trucco», scritto a mano; nell'editor lo puoi aggiungere ai tuoi livelli."
        ]
    },
    {
        version: "1.20.0", date: "2026-11-09", items: [
            "⏭ Nuovo interruttore «Avanti» sotto Effetti. Spento, dopo una vittoria resti sul livello risolto tutto il tempo che vuoi (pipeline, console e riga di shell restano lì) e passi al successivo con PROSSIMO LIVELLO ▶. Vale per la campagna e l'allenamento; la Maratona resta automatica.",
            "Se lo spegni mentre il gioco sta per cambiare livello, il passaggio si ferma subito."
        ]
    },
    {
        version: "1.19.1", date: "2026-11-08", items: [
            "🔲 Le icone si vedono anche sui Mac con macOS High Sierra: le quattro emoji troppo recenti (Celle, Laboratorio, Consigli e una delle novità) sono state sostituite con simboli più vecchi, e un controllo impedisce che ne tornino di nuove."
        ]
    },
    {
        version: "1.19.0", date: "2026-11-08", items: [
            "💻 Riga di shell «sul sistema vero»: nei livelli che dicono da dove arriva l'input (ps aux, df -h, apt list…) puoi scegliere tra la riga riproducibile, con lo stesso output del gioco, e il comando vero seguito dalla tua pipeline, come lo scriveresti al lavoro. Per esempio: ps aux | grep 'python3' | tr -s ' ' | cut -d' ' -f2.",
            "🔧 Pipe Dreams su Proxmox: in deploy/ c'è uno script che crea un container Linux con il gioco in HTTPS e un terminale vero dove provare le righe."
        ]
    },
    {
        version: "1.18.0", date: "2026-11-08", items: [
            "📄 Nuovo caso: «Le pagine cerchiate» (dopo l'Atto VIII, 4 capitoli). Ogni mattina sulla stampante compare una pila di pagine di manuale con delle opzioni cerchiate a penna. Chi le stampa, e perché?",
            "🔎 In questo caso le pagine man sono indizi: sotto l'obiettivo trovi i pulsanti «📄 man sort», «📄 man fold»… e certe opzioni le capisci solo leggendole. I pulsanti ci sono anche nei livelli dell'Atto VIII, e nell'editor si possono aggiungere ai propri livelli."
        ]
    },
    {
        version: "1.17.0", date: "2026-11-08", items: [
            "🌙 Atto VIII «Reperibilità notturna»: 7 livelli (44-50) con gli output veri di ps aux, du -sh, auth.log di SSH, /etc/motd, ss e df -h.",
            "🔧 Nuovi comandi: tr -s per comprimere gli spazi (prima di cut sulle colonne di ps e df), sort -h per le dimensioni con K, M e G, xargs (anche -n N) per mettere le parole in fila, fold -w (e -s) per andare a capo.",
            "📖 Manuale e pagine man di fold e xargs; tr e sort spiegano le nuove opzioni."
        ]
    },
    {
        version: "1.16.0", date: "2026-11-08", items: [
            "⌨️ Il terminale si comporta di più come bash: ↑ e ↓ richiamano le righe già eseguite (anche dopo aver chiuso il gioco), Tab completa i nomi dei comandi, dei reindirizzamenti, dei file e delle pagine di man.",
            "❓ sort --help (o qualunque comando seguito da --help) stampa in console la sintassi e le opzioni.",
            "🔎 man -k parola e apropos parola cercano tra le pagine man, whatis sort dà la descrizione in una riga. Prova man -k ordina."
        ]
    },
    {
        version: "1.15.0", date: "2026-11-08", items: [
            "📄 Le pagine man: ogni comando del manuale ha la sua pagina nello stile dei terminali veri (NOME, SINOSSI, DESCRIZIONE, OPZIONI, ESEMPI, VEDI ANCHE). Si apre con il pulsante «📄 man» in ogni scheda.",
            "⌨️ In modalità terminale scrivi man sort (o man head, man pacman…) e premi Invio: si apre la pagina invece di eseguire, e non conta come tentativo."
        ]
    },
    {
        version: "1.14.0", date: "2026-11-08", items: [
            "💬 Dopo tre tentativi sbagliati, il personaggio del livello ti dà un consiglio mirato: guarda la tua uscita e ti dice cosa non va (doppioni, ordine, numeri ordinati come testo, righe in più o in meno…) senza svelare la soluzione.",
            "💡 Dal fumetto puoi chiedere la spinta, il primo aiuto gratuito. I consigli si spengono con il pulsante «💬 Consigli» sotto Effetti."
        ]
    },
    {
        version: "1.13.0", date: "2026-11-08", items: [
            "📊 Dopo ogni vittoria, un istogramma: quante pipeline diverse risolvono il livello con 2, 3, 4… comandi, e dove si colloca la tua. Lo calcola il gioco, senza raccogliere dati.",
            "💡 Aiuti per l'ottimizzazione a gradini: prima quanti comandi in meno servono, poi un indizio, infine la soluzione (chi la guarda, riprovando, prende al massimo ★★)."
        ]
    },
    {
        version: "1.12.0", date: "2026-11-07", items: [
            "🖨️ Nuovo caso: «Le stampe di mezzanotte» (dopo l'Atto IV, 4 capitoli). Ogni notte alle 00:00 la stampante del secondo piano si accende da sola…",
            "👮‍♀️ Un nuovo personaggio: Nadia, la guardia notturna, con il suo avatar."
        ]
    },
    {
        version: "1.11.0", date: "2026-11-07", items: [
            "💬 I personaggi hanno un volto: Marco, Giulia, Tommaso, Irene, Elena e Bruno in pixel art, ognuno con tre espressioni.",
            "🚨 Nelle emergenze chi scrive è preoccupato; nelle deduzioni l'espressione cambia con la tua risposta.",
            "📚 Nei casi a puntate il ritratto di chi racconta ogni capitolo, e nel finale il personaggio della rivelazione."
        ]
    },
    {
        version: "1.10.0", date: "2026-11-07", items: [
            "☕ Nuovo caso: «Il caffè scomparso» (dopo l'Atto II, 4 capitoli). Ogni mattina mancano le capsule di ginseng… Un giallo leggero con i comandi base.",
            "🐛 Nuovo caso: «L'ultimo commit» (dopo l'Atto VII, 5 capitoli). Dopo un rilascio il negozio online risponde 500: log, deploy, join, diff e tee per trovare il colpevole.",
            "📚 I casi sono in ordine di atto: si comincia da quelli che si aprono prima."
        ]
    },
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
            "🔧 Nuovi comandi: nl (numerare), tee (vedere i dati a metà pipeline con tee /dev/stderr), comm e join (confrontare e unire con un file del livello).",
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
            "🔧 Nuovi comandi: tac e rev, sort -t -k (ordinare per un campo), grep -o (contare le occorrenze), uniq -d (solo i doppioni), cut -c (tenere dei caratteri).",
            "📖 Manuale aggiornato: nuova scheda tac / rev ed esempi per le nuove opzioni.",
            "🎯 Allenamento: nuovo argomento «tac e rev» e nuovi livelli per sort, grep, uniq e cut."
        ]
    },
    {
        version: "1.2.0", date: "2026-11-03", items: [
            "📊 Confronto dopo la vittoria: se la tua pipeline è più lunga del necessario, il gioco si ferma, la mette accanto a quella ottimale e ti dice quale comando non serve. Con ⚗️ LABORATORIO la vedi passo per passo.",
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
