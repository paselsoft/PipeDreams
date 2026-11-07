---
name: verifica
description: Definizione di «fatto» per Pipe Dreams, con sintassi, verifiche contro bash, test nel browser, accessibilità e impaginazione. Use prima di ogni commit, dopo una modifica al motore, ai livelli, ai casi o all'interfaccia, o quando l'utente chiede di controllare il gioco.
---

# Verifica

Una modifica è fatta quando passano tutti i controlli qui sotto, nell'ordine. Il codice da
solo non basta: una pipeline che compila può dare un output diverso da bash, e una schermata
può uscire dallo schermo a 320 px.

## 1. Sintassi

```bash
for f in *.js tools/*.js tests/e2e/*.js; do node --check "$f" || echo "ERRORE $f"; done
```

Controlla anche gli strumenti in `tools/`: la CI li verifica tutti (un errore in uno strumento
ha già fermato una pubblicazione, vedi `docs/FIXLOG.md`).

## 2. Verifiche con bash

Il motore simula GNU coreutils 9.4 e bash: ogni pipeline del gioco deve dare in bash lo
stesso stdout e lo stesso stderr.

```bash
node tools/validate-levels.js     # livelli risolvibili, par, manuale completo
node tools/check-shell.js 20      # livelli, manuale e pipeline casuali contro bash
node tools/check-daily.js 60      # sfide, Maratona e allenamento
node tools/check-terminal.js      # l'interprete del terminale rilegge ogni comando
node tools/check-community.js     # livelli della galleria
node tools/check-stories.js       # enigmi dei casi a puntate
```

Tutti escono con 0 problemi. Gli strumenti eseguono bash tramite `tools/bash.js` (stderr su
una pipe, cartella temporanea, tempo massimo): usalo anche per gli strumenti nuovi.

Nuovo comando o nuova opzione: aggiungi casi limite al blocco casuale di
`tools/check-shell.js` (righe vuote, campi mancanti, input non ordinati, `2>&1` dopo il
comando) e lancialo con almeno 100 casi.

## 3. Test nel browser

```bash
npm install --no-save playwright@1.63.0 axe-core@4.10.2   # una volta, se mancano
node tests/e2e/run.js
```

Tutti i test passano. Una funzione nuova ha il suo file `tests/e2e/<nome>.test.js` che gioca
davvero il gioco (clic, tastiera, salvataggio) e, se aggiunge una finestra, un `audit()` axe
in `tutorial-accessibilita.test.js`.

## 4. Guardare le schermate

Servi la cartella (`python3 -m http.server`) e fai uno screenshot con Playwright a 360 px e a
1440 px della schermata toccata, poi guardalo con lo strumento Read. Cerca:

- testo che esce dallo schermo o va a capo male (titoli lunghi, URL, righe di log);
- finestre che coprono il riquadro del tutorial o i toast;
- colori: righe giuste e sbagliate distinguibili anche con la modalità daltonici.

Il test `nessuno scorrimento orizzontale` copre 320, 390 e 1440 px: aggiungi lì la
schermata nuova.

## 5. Versione

Una funzione per l'utente aumenta `APP_VERSION` in `version.js` e aggiunge una voce in cima a
`CHANGELOG` (in italiano, con un'emoji, al massimo 4 righe).

Done when i quattro gruppi di controlli passano, hai guardato le schermate toccate e la
versione è aggiornata se la modifica si vede.
