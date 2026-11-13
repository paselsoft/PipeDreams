# Pipe Dreams `| grep`

Puzzle game sulle pipeline Unix, in HTML/CSS/JavaScript senza dipendenze.
Ogni livello dà un input e lo stdout atteso: componi la pipeline scegliendo i comandi negli slot.

**Gioca:** https://paselsoft.github.io/PipeDreams/ · **Editor livelli:** https://paselsoft.github.io/PipeDreams/editor.html

- 75 livelli in 11 atti, con quiz ("cosa stampa?"), livelli di debug e celle bloccate: `grep`, `sort`, `uniq`, `head`/`tail`, stdout/stderr con `2>/dev/null` e `2>&1`,
  `wc`, `cut`, `tr`, `uniq -c`, `sed -E`, `awk`, `paste`, `tac`, `rev`, `sort -t -k`, `grep -o`, `uniq -d`, `cut -c`,
  `nl`, `tee`, `comm`, `join` (con i file del livello), `tr -s`, `sort -h`, `xargs`, `fold`, e le opzioni `grep -c -i -w`, `sort -u`, `uniq -u`, `cut -f1,3 --complement`, `wc -w -c`, `md5sum`, `sha256sum`, `od -c`, `zcat`/`bzcat`/`xzcat`, `grep -E` con le espressioni regolari estese; l'Atto VII analizza l'output di apt, pacman, dnf e rpm,
  l'Atto VIII quello di ps, du, df, ss e dei log di SSH
- la simulazione segue GNU coreutils e bash: per ogni pipeline il gioco mostra la riga di shell
  equivalente, che puoi copiare ed eseguire su Linux con lo stesso risultato; nei livelli con il
  comando di origine (`ps aux`, `df -h`...) anche la riga «sul sistema vero», da provare sul tuo Linux
- un solver calcola il par (numero minimo di comandi) di ogni livello e assegna le stelle
- una storia in 5 atti, obiettivi, una **sfida del giorno** e la **Maratona** contro il tempo
- **allenamento** per comando: livelli generati senza fine su grep, sort, sed...
- dopo una vittoria, il **confronto** con la soluzione ottimale spiega quali comandi non servivano
- aiuti progressivi: spinta, piano e una cella rivelata, con le stelle che scendono
- modalità terminale: finito un atto, i suoi livelli si risolvono anche scrivendo la pipeline
- dati che scorrono tra i comandi, suoni sintetizzati, coriandoli ed effetto CRT opzionale
- i progressi restano salvati nel browser (`localStorage`)
- tutorial guidato al primo avvio; accessibile da tastiera e con i lettori di schermo, colori per daltonici
- si installa come app (su telefono: «Aggiungi a schermata Home») e funziona anche offline
- **backup dei progressi** (codice o file) per passare da un dispositivo all'altro, e novità di ogni versione
- **casi a puntate**: gialli a capitoli, con enigmi-pipeline che trovano gli indizi e domande di deduzione
- **galleria della community**: livelli dei giocatori, proposti dall'editor e scelti per il gioco
- **livelli condivisibili**: l'editor crea un link che apre il livello nel gioco, senza toccare i progressi

## Struttura

| File | Contenuto |
|---|---|
| `index.html`, `app.js`, `style.css` | Il gioco |
| `commands.js` | Registro dei comandi simulati e modello stdout/stderr |
| `levels.js` | I livelli |
| `solver.js` | Ricerca in ampiezza delle soluzioni ottimali |
| `shell.js` | Traduzione della pipeline in una riga bash |
| `terminal.js` | Modalità terminale: interprete della pipeline scritta come in bash |
| `fx.js` | Effetti: dati che scorrono, suoni Web Audio, coriandoli, schermo CRT |
| `achievements.js` | Obiettivi, statistiche e notifiche |
| `daily.js` | Sfida del giorno, Maratona e allenamento: generatore deterministico e ricette |
| `marathon.js` | Maratona: livelli generati contro il tempo |
| `training.js` | Allenamento: livelli generati su un comando scelto |
| `compare.js` | Confronto della soluzione con quella ottimale |
| `story.js` | Storia: introduzioni degli atti, messaggi dei personaggi, epilogo |
| `manual.js`, `manual-view.js` | Manuale dei comandi: schede ed esempi calcolati dal motore |
| `manpage.js` | Pagine man di ogni comando; nel terminale `man X`, `man -k`, `apropos`, `whatis`, `--help` |
| `terminal-keys.js` | Terminale: cronologia con ↑↓ e completamento con Tab |
| `tutor.js`, `tutor-view.js` | Il Tutor: il livello risolto spiegato passo passo (logica e finestra) |
| `lpi.js`, `lpi-view.js` | Sezione Certificazioni LPI: obiettivi, pesi, link alle lezioni italiane (dati e finestra) |
| `sync.js` | Sincronizzazione dei progressi fra i dispositivi con un repository GitHub privato (unione come il backup) |
| `lpi-lessons.js`, `lpi-lesson-view.js` | Nove lezioni LPI in italiano copiate integrali (CC BY-NC-ND 4.0) e la finestra per leggerle offline; `tools/import-lpi-lessons.py` le riscarica |
| `lab.js` | Laboratorio: pipeline libera con il risultato dopo ogni comando |
| `command-form.js` | Campi dei comandi condivisi da editor e laboratorio |
| `progress.js`, `render.js` | Salvataggio e rendering condivisi |
| `version.js` | Versione e novità (`CHANGELOG`); il workflow aggiunge commit e data della pubblicazione |
| `backup.js` | Backup dei progressi: esporta, unisce e ripristina |
| `advisor.js` | Il consigliere: diagnosi degli errori e fumetto del personaggio |
| `avatars.js` | Ritratti dei personaggi in pixel art (griglie 16×16 disegnate come SVG) |
| `tutorial.js` | Tutorial guidato del primo livello |
| `a11y.js` | Finestre accessibili: focus, Tab, Esc |
| `stories.js`, `stories-view.js` | Casi a puntate: dati e schermate (capitoli, taccuino, deduzione) |
| `community.js`, `gallery.js` | Livelli della community e la loro galleria nel gioco |
| `share.js` | Livelli condivisi con un link: codifica e convalida |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | App installabile e funzionamento offline |
| `editor.html`, `editor.js`, `editor.css` | Editor dei livelli |
| `tools/` | Verifiche da riga di comando (Node.js) |
| `tests/e2e/` | Test nel browser con Playwright |

## Sviluppo

Basta aprire `index.html` nel browser: non servono build né server (offline e installazione
funzionano solo da http/https).

```bash
node tools/validate-levels.js   # tutti i livelli sono risolvibili? par e soluzioni ottimali
node tools/check-shell.js 100   # simulazione ed esempi del manuale coincidono con bash? (Linux)
node tools/check-daily.js 366   # sfide dei prossimi 366 giorni, Maratona e allenamento valide in bash?
node tools/check-terminal.js    # l'interprete della modalità terminale rilegge ogni comando?
node tools/check-community.js   # i livelli della galleria sono validi e coincidono con bash?
node tools/check-stories.js     # gli enigmi dei casi sono validi, coincidono con bash e usano comandi già visti?
node tools/check-emoji.js       # solo emoji che si vedono anche su macOS High Sierra (versione 5.0)?
node tools/check-tutor.js       # il Tutor spiega ogni livello, sfida, allenamento, galleria e caso?
node tools/check-lpi.js         # dati della sezione LPI coerenti (--online: anche i link)?
```

I test nel browser (Playwright) giocano davvero il gioco: tutti i livelli, salvataggio, storia,
obiettivi, sfida del giorno, manuale, laboratorio, terminale, effetti, editor e impaginazione su
schermi da 320 a 1440 px. Il runner serve i file con un piccolo server HTTP locale.

```bash
npm install --no-save playwright@1.63.0 axe-core@4.10.2 && npx playwright install chromium   # la prima volta
node tests/e2e/run.js            # tutti i test
node tests/e2e/run.js terminale  # solo quelli che contengono "terminale" nel nome
```

Per aggiungere un livello: componilo nell'editor, provalo con **PROVA NEL GIOCO**, copia il codice
generato in fondo all'array `levels` di `levels.js` e lancia le verifiche. Per farlo giocare a
qualcuno senza modificare il gioco, usa **COPIA LINK**: il livello viaggia nell'indirizzo
(`index.html#livello=...`) e il gioco lo convalida prima di aprirlo.

Il service worker usa la rete per prima, quindi online si gioca sempre l'ultima versione pubblicata.
Se aggiungi un file al gioco, aggiungilo anche all'elenco `FILES` di `sw.js`. A ogni pubblicazione il
workflow cambia il nome della cache in `sw.js`: chi ha il gioco aperto vede «È pronta una nuova versione».

Per una nuova versione: aumenta `APP_VERSION` in `version.js` e aggiungi una voce in cima a `CHANGELOG`.

## Pipe Dreams su Proxmox

In `deploy/` c'è uno script che crea un container LXC Alpine su Proxmox VE: serve il gioco in
HTTPS sulla rete di casa e offre bash con i comandi GNU per provare le righe di shell. Istruzioni in
[`deploy/README.md`](deploy/README.md).

## Casi a puntate

Ogni caso in `stories.js` ha dei capitoli; ogni capitolo ha un racconto, degli enigmi (livelli
«componi» con lo stdout atteso nascosto: il risultato è l'indizio) e una domanda a scelta multipla
con il perché di ogni risposta sbagliata. I capitoli si sbloccano uno dopo l'altro; `release`
(AAAA-MM-GG) rimanda un capitolo a una data, per pubblicare un caso a puntate. Un livello o un
enigma può indicare le pagine man da leggere (`man: ["sort", "fold"]`): diventano pulsanti sotto
l'obiettivo. Dopo ogni modifica: `node tools/check-stories.js`.

## Galleria della community

Dall'editor, **🌍 PROPONI ALLA GALLERIA** apre una issue su GitHub con il link del livello.
Per accettarlo:

```bash
node tools/add-community-level.js '<link del livello>' 'Autore'
node tools/check-community.js
```

Il primo comando convalida il livello come un link condiviso e lo aggiunge in cima a
`community.js`; il secondo verifica tutti i livelli della galleria anche con bash.

## Skill per Claude Code

In `.claude/skills/` ci sono skill di progetto che Claude Code carica da solo lavorando su
questo repository: `verifica` (cosa vuol dire «fatto»), `storie-utente`, `revisione-ux`,
`ciclo-miglioramento` (una storia per commit), `check-architettura` e `nuovo-caso`; `/pipedreams`
sceglie quella giusta. Il metodo è adattato da [BAMA](https://github.com/daveebbelaar/bama)
(licenza MIT). Documenti condivisi: `docs/GLOSSARIO.md` e `docs/FIXLOG.md`.

## Pubblicazione

Il workflow `.github/workflows/pages.yml` esegue le verifiche a ogni push e, se passano,
pubblica il gioco su GitHub Pages dal branch predefinito.
