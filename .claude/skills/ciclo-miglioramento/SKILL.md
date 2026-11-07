---
name: ciclo-miglioramento
description: Ciclo che porta le storie di docs/STORIES.md da «da fare» a «fatta», una per commit, con verifica completa e pubblicazione. Use quando l'utente dice «vai avanti», «procedi con la milestone», «lavora sul backlog», o lascia lavorare da solo su una lista di storie.
argument-hint: "[milestone, es. M1]"
---

# Ciclo di miglioramento

Un giro porta una storia da `da fare` a `fatta`:

```text
scegli -> pianifica -> codice -> verifica -> guarda -> correggi -> commit -> aggiorna STORIES.md
```

Fermati dopo la milestone che l'utente ha indicato, o dopo quella in corso. Poi fai il
resoconto.

## 1. Scegli

Apri `docs/STORIES.md`. Prendi la prima storia `da fare` della milestone le cui dipendenze
sono `fatta`. Mettila `in corso`.

## 2. Pianifica

Se la storia aggiunge una schermata, un'azione o dei testi e non ha un blocco `UX:`, chiama
lo strumento Skill con `revisione-ux`.

Scrivi in 2-5 righe: quali file cambiano, quali campi nuovi in `progress` (con un valore
predefinito in `normalizeProgress`, così i salvataggi vecchi si caricano, e la pulizia e
l'unione in `backup.js`), quali file vanno in `FILES` di `sw.js`, quale test la mostra.

## 3. Codice

- Niente dipendenze: HTML, CSS e JavaScript nel browser, un file per area (`training.js`,
  `gallery.js`...). I nomi globali non si ripetono tra file: controlla con
  `grep -hE "^(function|const|let) <nome>\b" *.js`.
- Una funzione chiamata da un altro file che si carica dopo (es. `el` di `manual-view.js`)
  si usa solo dopo `DOMContentLoaded`.
- Il testo che arriva dall'esterno (link condivisi, galleria) passa da `safeMissionHtml`.
- Ogni comando nuovo nel motore ha parser del terminale, voce del manuale e casi in
  `tools/check-shell.js`.

## 4. Verifica

Chiama lo strumento Skill con `verifica`. Tutti i controlli passano prima del commit: non
fare push «e poi controllo».

## 5. Guarda

Apri lo screenshot della schermata toccata (360 px) e confrontalo con i criteri della storia,
in quest'ordine:

1. Comportamento mancante o sbagliato rispetto all'accettazione.
2. Parole e flusso diversi dal blocco `UX:` o da `docs/GLOSSARIO.md`.
3. Impaginazione: testo fuori schermo, elementi coperti, ordine sbagliato.
4. Gerarchia, spazi e colori.

Al massimo tre giri di correzione per storia. Se non basta, rimettila `da fare` con una nota
su cosa la blocca e passa alla successiva.

## 6. Commit e pubblicazione

```bash
git add -A
git status --short    # niente file estranei (copie di tee, collegamenti, node_modules)
git commit -m "<cosa fa la storia>"
git push -u origin <branch di sviluppo>
```

Una storia per commit, così si può annullare da sola. Segna la storia `fatta` nello stesso
commit. Il messaggio segue le righe di attribuzione richieste dalla sessione.

Dopo il push controlla il workflow «Verifica e pubblica» su GitHub. Se fallisce solo la
pubblicazione su Pages (stato `updating_pages` fino al timeout), non è il codice: avvia un
run nuovo, non «Re-run» sul vecchio.

Un bug corretto aggiunge una voce in `docs/FIXLOG.md`: sintomo, causa, correzione e un'ultima
riga `Regola: <cosa fare o non fare sempre>`.

## 7. Resoconto

Alla fine, in italiano:

- storie fatte, una riga ciascuna, con la versione pubblicata;
- storie bloccate e perché;
- cosa provare a mano (telefono, tastiera, app installata);
- la prossima storia in fila.

## Check-in di milestone

Quando l'ultima storia della milestone è `fatta`, chiama lo strumento Skill con
`check-architettura` prima di iniziare la successiva.

Done when ogni storia della milestone è `fatta` o nel resoconto come bloccata con un motivo,
ogni storia fatta ha il suo commit, il workflow su GitHub è verde e l'utente ha il resoconto.
