# Registro dei bug

Ogni bug corretto: sintomo, causa, correzione e una regola. Le skill `ciclo-miglioramento` e
`check-architettura` lo leggono: tre voci nella stessa zona sono un segnale per riorganizzarla.

## Test instabili aprendo i file da disco
Sintomo: i test nel browser perdevano a volte i progressi tra un ricaricamento e l'altro.
Causa: con le pagine aperte da `file://` Chromium perde localStorage tra le navigazioni.
Correzione: il runner serve i file con un server HTTP locale; il segno di inizializzazione sta in `window.name`.
Regola: i test nel browser girano sempre su http, mai su file://.

## Pubblicazione fallita con «Re-run jobs»
Sintomo: rilanciando un run fallito, deploy-pages trova due archivi «github-pages».
Causa: lo stesso run conserva l'archivio del primo tentativo.
Correzione: l'archivio ha il nome `github-pages-<tentativo>`.
Regola: dopo un errore di GitHub Pages si può rilanciare; se Pages resta in `updating_pages`, è un problema di GitHub, non del codice.

## Errore di sintassi in uno strumento ha fermato la pubblicazione
Sintomo: la CI falliva su `node --check` di `tools/add-community-level.js`.
Causa: una variabile `source` dichiarata due volte, e il push era stato fatto prima dei controlli.
Correzione: rinominata la variabile.
Regola: prima di ogni push, `node --check` su tutti i file, anche `tools/` e i test.

## tee /dev/stderr falliva nelle verifiche
Sintomo: «tee: /dev/stderr: No such device or address» solo negli strumenti di verifica.
Causa: Node collega lo stderr dei processi a un socket, che /dev/stderr non può aprire.
Correzione: `tools/bash.js` fa passare lo stderr da una pipe e lavora in una cartella temporanea.
Regola: ogni strumento esegue bash solo tramite `tools/bash.js`.

## rev bloccato sulle lettere accentate
Sintomo: `tools/check-stories.js` restava fermo su un enigma con `rev`.
Causa: senza locale UTF-8 `rev` di util-linux si blocca su caratteri multibyte; anche `cut -c` conta byte.
Correzione: testo ASCII negli enigmi con rev e cut -c, controllo in check-stories, tempo massimo in `tools/bash.js`.
Regola: con `rev` e `cut -c` l'input è solo ASCII.

## Avvisi di comm nel punto sbagliato
Sintomo: in rari casi l'avviso «file 1 is not in sorted order» mancava o compariva in un altro punto.
Causa: GNU comm ricontrolla le ultime due righe di un file quando lo finisce.
Correzione: stesso controllo in `commLines`, verificato con il sorgente di coreutils 9.4 e 15.000 casi casuali.
Regola: un comando nuovo si confronta con il sorgente GNU e con migliaia di casi casuali, compreso l'ordine dello stderr con 2>&1.

## Titoli lunghi fuori schermo a 320 px
Sintomo: il contatore «Slot · Par» e l'URL dell'origine dell'input uscivano dallo schermo.
Causa: intestazione senza `flex-wrap` e testo senza `overflow-wrap`.
Correzione: intestazione che va a capo; test di impaginazione con le sfide di più giorni e con gli enigmi.
Regola: ogni schermata nuova entra nel test «nessuno scorrimento orizzontale», con il contenuto più lungo possibile.
