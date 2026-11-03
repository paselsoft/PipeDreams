# Pipe Dreams `| grep`

Puzzle game sulle pipeline Unix, in HTML/CSS/JavaScript senza dipendenze.
Ogni livello dà un input e lo stdout atteso: componi la pipeline scegliendo i comandi negli slot.

**Gioca:** https://paselsoft.github.io/PipeDreams/ · **Editor livelli:** https://paselsoft.github.io/PipeDreams/editor.html

- 29 livelli in 5 atti, con quiz ("cosa stampa?"), livelli di debug e celle bloccate: `grep`, `sort`, `uniq`, `head`/`tail`, stdout/stderr con `2>/dev/null` e `2>&1`,
  `wc`, `cut`, `tr`, `uniq -c`, `sed -E`, `awk`, `paste`
- la simulazione segue GNU coreutils e bash: per ogni pipeline il gioco mostra la riga di shell
  equivalente, che puoi copiare ed eseguire su Linux con lo stesso risultato
- un solver calcola il par (numero minimo di comandi) di ogni livello e assegna le stelle
- una storia in 5 atti, obiettivi, una **sfida del giorno** e la **Maratona** contro il tempo
- aiuti progressivi: spinta, piano e una cella rivelata, con le stelle che scendono
- modalità terminale: finito un atto, i suoi livelli si risolvono anche scrivendo la pipeline
- dati che scorrono tra i comandi, suoni sintetizzati, coriandoli ed effetto CRT opzionale
- i progressi restano salvati nel browser (`localStorage`)
- si installa come app (su telefono: «Aggiungi a schermata Home») e funziona anche offline
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
| `daily.js` | Sfida del giorno e livelli della Maratona: generatore deterministico |
| `marathon.js` | Maratona: livelli generati contro il tempo |
| `story.js` | Storia: introduzioni degli atti, messaggi dei personaggi, epilogo |
| `manual.js`, `manual-view.js` | Manuale dei comandi: schede ed esempi calcolati dal motore |
| `lab.js` | Laboratorio: pipeline libera con il risultato dopo ogni comando |
| `command-form.js` | Campi dei comandi condivisi da editor e laboratorio |
| `progress.js`, `render.js` | Salvataggio e rendering condivisi |
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
node tools/check-daily.js 366   # le sfide del giorno dei prossimi 366 giorni sono valide?
node tools/check-terminal.js    # l'interprete della modalità terminale rilegge ogni comando?
```

I test nel browser (Playwright) giocano davvero il gioco: tutti i livelli, salvataggio, storia,
obiettivi, sfida del giorno, manuale, laboratorio, terminale, effetti, editor e impaginazione su
schermi da 320 a 1440 px. Il runner serve i file con un piccolo server HTTP locale.

```bash
npm install --no-save playwright@1.63.0 && npx playwright install chromium   # la prima volta
node tests/e2e/run.js            # tutti i test
node tests/e2e/run.js terminale  # solo quelli che contengono "terminale" nel nome
```

Per aggiungere un livello: componilo nell'editor, provalo con **PROVA NEL GIOCO**, copia il codice
generato in fondo all'array `levels` di `levels.js` e lancia le verifiche. Per farlo giocare a
qualcuno senza modificare il gioco, usa **COPIA LINK**: il livello viaggia nell'indirizzo
(`index.html#livello=...`) e il gioco lo convalida prima di aprirlo.

Il service worker usa la rete per prima, quindi online si gioca sempre l'ultima versione pubblicata.
Se aggiungi un file al gioco, aggiungilo anche all'elenco `FILES` di `sw.js`.

## Pubblicazione

Il workflow `.github/workflows/pages.yml` esegue le verifiche a ogni push e, se passano,
pubblica il gioco su GitHub Pages dal branch predefinito.
