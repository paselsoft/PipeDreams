---
name: nuovo-caso
description: Scrittura di un nuovo caso a puntate di Pipe Dreams (un giallo a capitoli con enigmi-pipeline, indizi e deduzioni) in stories.js, verificato con bash e giocato nel browser. Use quando l'utente chiede nuovi casi, nuovi capitoli, o un caso su un tema o con certi comandi.
argument-hint: "[tema o comandi]"
---

# Nuovo caso a puntate

Un caso è un giallo: ogni capitolo ha un racconto, enigmi che trovano gli indizi con una
pipeline (lo stdout atteso è nascosto) e una domanda di deduzione. Il formato completo è
commentato in cima a `stories.js`; i casi esistenti sono esempi da seguire.

## 1. Trama e atto

1. Scegli l'atto che sblocca il caso (`requiresAct`) in base ai comandi:

   ```bash
   node -e 'const fs=require("fs"),vm=require("vm");const c=vm.createContext({});vm.runInContext(fs.readFileSync("commands.js","utf8")+fs.readFileSync("levels.js","utf8"),c);for(const a of [1,2,3,4,5,6,7])console.log(a,[...new Set(vm.runInContext(`levels.filter(l=>l.act<=${a}).flatMap(l=>l.allowedCommands.map(s=>s.cmd))`,c))].join(" "))'
   ```

   Varia: tra i casi ce ne devono essere per chi è all'inizio (Atto II) e per chi ha finito.
2. Scrivi la trama in 4-5 righe: il mistero, il colpevole o la spiegazione, e un indizio per
   capitolo che porta lì. Meglio un finale sorprendente ma innocuo (un'attività programmata
   dimenticata, una calibrazione) che un crimine.
3. Personaggi: quelli della Pipe & Co. (Marco, Giulia, Tommaso, Irene) più al massimo un
   personaggio nuovo per caso.

## 2. Capitoli

4 o 5 capitoli, ognuno con 1-3 enigmi e una domanda. L'ultimo capitolo ha una domanda che usa
indizi di capitoli diversi: quattro rapporti quasi uguali, ognuno sbagliato con **un solo**
dettaglio falso preso da un capitolo diverso.

Ogni domanda ha: almeno 3 opzioni diverse, `answer`, `why` (un perché per ogni opzione, `""`
per quella giusta), `explain`, `hint` (il primo aiuto) e `focus` (gli indizi
`"capitolo/enigma"` che contano, di questo capitolo o di quelli prima).

## 3. Enigmi

- L'input sembra vero: log di sistema, crontab, CSV, output di `ps`, `dpkg`, `git`. Il campo
  `source` dice da quale comando arriva (al massimo 80 caratteri).
- La missione dice esattamente cosa ottenere e in che forma («solo il nome», «`ora parte`,
  separati da uno spazio»): lo stdout è nascosto, quindi la forma deve essere chiara.
- `clue` è il nome dell'indizio nel taccuino.
- Distrattori plausibili: il campo accanto, il filtro opposto, `sort` invece di `sort -n`.
- Con `rev` o `cut -c` solo testo ASCII: in bash contano byte (niente «venerdì»).
- Con `tee /dev/stderr` metti anche `targetStderr`: è parte dell'indizio.
- File per `comm` e `join` già ordinati (lo controlla il comando stesso).

## 4. Verifica

```bash
node tools/check-stories.js
```

Ogni enigma: risolvibile entro gli slot, al massimo 4 soluzioni ottimali, uguale a bash, solo
comandi dell'atto richiesto. Le scorciatoie che il risolutore trova (par più basso del
previsto) vanno chiuse cambiando l'input, non il suggerimento: per esempio aggiungi una riga
che rompe la scorciatoia.

Poi chiama lo strumento Skill con `verifica`. Il test «ogni enigma di ogni caso si risolve nel
gioco» in `tests/e2e/casi.test.js` gioca anche il caso nuovo; aggiorna i test che contano i
casi o il loro ordine.

## 5. Pubblica

Aumenta `APP_VERSION` e aggiungi la voce del caso in `CHANGELOG` (titolo, atto che lo
sblocca, una frase di trama senza svelare il finale).

Done when `tools/check-stories.js` dà 0 problemi, tutti i test passano, il caso compare nel
menu dopo il suo atto e la versione è pubblicata.
