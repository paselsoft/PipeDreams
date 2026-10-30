# Pipe Dreams `| grep`

Puzzle game sulle pipeline Unix, in HTML/CSS/JavaScript senza dipendenze.
Ogni livello dà un input e lo stdout atteso: componi la pipeline scegliendo i comandi negli slot.

**Gioca:** https://paselsoft.github.io/PipeDreams/ · **Editor livelli:** https://paselsoft.github.io/PipeDreams/editor.html

- 17 livelli in 3 atti: `grep`, `sort`, `uniq`, `head`/`tail`, stdout/stderr con `2>/dev/null` e `2>&1`,
  `wc`, `cut`, `tr`, `uniq -c`, `sed -E`, `awk`, `paste`
- la simulazione segue GNU coreutils e bash: per ogni pipeline il gioco mostra la riga di shell
  equivalente, che puoi copiare ed eseguire su Linux con lo stesso risultato
- un solver calcola il par (numero minimo di comandi) di ogni livello e assegna le stelle
- i progressi restano salvati nel browser (`localStorage`)

## Struttura

| File | Contenuto |
|---|---|
| `index.html`, `app.js`, `style.css` | Il gioco |
| `commands.js` | Registro dei comandi simulati e modello stdout/stderr |
| `levels.js` | I livelli |
| `solver.js` | Ricerca in ampiezza delle soluzioni ottimali |
| `shell.js` | Traduzione della pipeline in una riga bash |
| `progress.js`, `render.js` | Salvataggio e rendering condivisi |
| `editor.html`, `editor.js`, `editor.css` | Editor dei livelli |
| `tools/` | Verifiche da riga di comando (Node.js) |

## Sviluppo

Basta aprire `index.html` nel browser: non servono build né server.

```bash
node tools/validate-levels.js   # tutti i livelli sono risolvibili? par e soluzioni ottimali
node tools/check-shell.js 100   # la simulazione coincide con bash? (Linux, GNU coreutils)
```

Per aggiungere un livello: componilo nell'editor, provalo con **PROVA NEL GIOCO**, copia il codice
generato in fondo all'array `levels` di `levels.js` e lancia le verifiche.

## Pubblicazione

Il workflow `.github/workflows/pages.yml` esegue le verifiche a ogni push e, se passano,
pubblica il gioco su GitHub Pages dal branch predefinito.
