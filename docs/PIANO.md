# Piano: Avanti automatico, Tutor e sezione LPI

Tre ampliamenti di Pipe Dreams chiesti il 9 novembre 2026. Ognuno è una versione a sé, con
verifica completa (sintassi, check-shell, test nel browser, accessibilità) e pubblicazione.

| Ordine | Idea | Versione | Dimensione | Dipende da |
|---|---|---|---|---|
| 1 | Passaggio automatico attivabile e disattivabile ✅ fatto | 1.20.0 | piccola | niente |
| 2 | Tutor: spiegazione passo passo del livello superato ✅ fatto | 1.21.0 | media | idea 1 (il Tutor ha bisogno di tempo per essere letto) |
| 3 | Sezione LPI con la documentazione gratuita in italiano ✅ strada 1 fatta | 1.22.0 | media | licenza e accesso a learning.lpi.org (vedi Fase 0) |

L'ordine conta: senza la pausa dopo la vittoria il Tutor si chiuderebbe da solo dopo 3,5
secondi, e la sezione LPI rimanda al Tutor per gli obiettivi coperti dal gioco.

---

## 1. Passaggio automatico al livello successivo (v1.20.0) ✅

Fatto il 9/11/2026: interruttore «⏭ Avanti» e pulsante «PROSSIMO LIVELLO ▶»;
la galleria non passava già da sola al livello successivo, quindi l'interruttore riguarda
campagna e allenamento. Test in `tests/e2e/avanti-auto.test.js`.

### Com'è oggi

Dopo una vittoria `completeLevel` (in `app.js`) avvia `transitionTimer`: dopo 2 secondi, o 3,5
se la console mostra l'istogramma delle soluzioni, carica il livello successivo. Il gioco si
ferma solo quando la soluzione è più lunga del par (riquadro «Si può fare meglio»).

### Cosa cambia

Un interruttore **«⏭ Avanti automatico»** nella riga Effetti, accanto a Suoni, CRT,
Daltonici e Consigli.

- **Acceso** (predefinito, come oggi): dopo la vittoria si passa da soli al livello successivo.
- **Spento**: dopo la vittoria il gioco resta sul livello risolto, con la pipeline nelle celle,
  la console, l'istogramma e la riga di shell. In console compare
  «[SUCCESSO] Quando vuoi, passa al prossimo livello.» e un pulsante
  **«PROSSIMO LIVELLO ▶»** al posto di ESEGUI.
- La scelta resta nelle preferenze (`settings.autoNext`, `false` solo quando è spento, come
  `settings.advisor`).

### Storie e criteri di accettazione

**A1 – Restare sul livello risolto.** Come giocatore che studia, voglio restare sul livello
appena risolto per rileggere la pipeline e provarla nel terminale.
- Con l'interruttore spento, dopo una vittoria nella campagna il livello non cambia, neanche
  dopo 10 secondi.
- Le celle, la console e la riga di shell restano quelle della soluzione; COPIA e LABORATORIO
  funzionano.
- Si può rieseguire la pipeline o cambiarla: una seconda vittoria non conta come nuovo
  record se il risultato è peggiore (comportamento attuale di `recordResult`).

**A2 – Andare avanti quando voglio.** 
- Il pulsante «PROSSIMO LIVELLO ▶» porta al livello successivo; anche il menu LIVELLI funziona
  come oggi.
- Il pulsante è raggiungibile da tastiera e ha un nome chiaro per i lettori di schermo.
- Sull'ultimo livello non compare (c'è l'epilogo).

**A3 – Interruttore ricordato.**
- L'interruttore ha `aria-pressed` corretto e mantiene la scelta dopo un ricaricamento.
- Nel menu «Novità» la voce della versione spiega dove si trova.

**A4 – Dove vale.**
- Vale per campagna, allenamento e livelli della galleria.
- **Non** vale per la Maratona (è a tempo: il passaggio resta automatico) e per la sfida
  del giorno (non ha un livello successivo).
- Negli enigmi dei casi il comportamento resta quello attuale (si torna al capitolo).

### File toccati

`index.html` (interruttore e pulsante), `app.js` (`completeLevel`, `renderFxControl`,
`toggleSetting`), `style.css`, `version.js`, test nuovi in `tests/e2e/`.
Emoji: ⏭ è già nell'elenco compatibile con High Sierra (`tools/check-emoji.js`).

### Test

- Interruttore spento: vittoria, attesa di 5 s, stesso livello; pulsante → livello successivo.
- Interruttore acceso: comportamento di oggi (i test esistenti non cambiano).
- Maratona e sfida del giorno: invariate con l'interruttore spento.
- Preferenza dopo `reload`; nessuna violazione axe sulla riga Effetti.

---

## 2. Tutor: il livello spiegato passo passo (v1.21.0) ✅

Fatto il 9/11/2026: `tutor.js` (logica) e `tutor-view.js` (finestra), «Il trucco» scritto a
mano per 14 livelli, campo nell'editor e nei link condivisi, `tools/check-tutor.js` in CI
(676 lezioni), test in `tests/e2e/tutor.test.js`. Il riferimento all'obiettivo LPI arriva
con l'idea 3.

### L'idea

Dopo una vittoria compare il pulsante **«🎓 TUTOR»**. Apre una finestra che rifà la pipeline
un comando alla volta e spiega **cosa fa ogni comando, ogni opzione, e perché serve per
l'obiettivo**. Si apre anche dal menu LIVELLI per i livelli già risolti, così si può ripassare.

### Come è fatta una lezione del Tutor

1. **L'obiettivo in parole semplici**: cosa chiedeva il livello e cosa c'era di difficile
   (dai campi `nudge`, `hint`, `explain` già presenti nei livelli).
2. **Un passo per comando** (pulsanti ◀ ▶, oppure tutti in fila su schermi grandi):
   - il comando con le sue opzioni, spiegate una per una
     (es. `sort -rn`: `-n` confronta i numeri per valore, `-r` dal più grande);
   - le righe **prima** e **dopo**, con evidenziate quelle tolte, aggiunte o trasformate
     (la traccia c'è già: `executePipeline(...).trace`, la usa il pannello del flusso);
   - **perché qui**: cosa succederebbe togliendo questo comando o spostandolo
     (calcolato con il motore: es. «senza `sort`, `uniq` lascerebbe 2 doppioni»);
   - lo stderr: cosa va sul terminale e cosa entra nella pipe.
3. **La soluzione ottimale** se quella del giocatore era più lunga, con le differenze.
4. **Per saperne di più**: «📄 man sort», «⚗️ Prova nel laboratorio» con questa pipeline, e
   (dopo l'idea 3) l'obiettivo LPI corrispondente.

### Spiegazioni scritte a mano o generate?

Generate dal motore, con un tocco scritto a mano dove serve.

- **Generate per tutto**: un nuovo `tutor.js` con una funzione per comando che descrive
  un passo dai suoi argomenti (`describeStep`), più il confronto «con e senza questo
  comando». Così il Tutor funziona subito per i 50 livelli, l'allenamento, la sfida del giorno,
  la galleria e gli enigmi dei casi, senza scrivere 50 lezioni.
- **Scritte a mano solo dove servono**: un campo facoltativo `tutor` nei livelli per la
  frase chiave («Il trucco è che `uniq` vede solo le righe vicine»). Si comincia dai boss
  degli atti e dai livelli con una trappola classica.

### Storie e criteri di accettazione

**T1 – Aprire il Tutor.**
- Dopo ogni vittoria (campagna, allenamento, galleria, sfida, enigmi) c'è «🎓 TUTOR».
- Dal menu LIVELLI, sui livelli risolti, c'è «🎓» che apre il Tutor sulla soluzione ottimale.
- Con l'Avanti automatico acceso, aprire il Tutor ferma il passaggio al livello successivo.

**T2 – Un passo per comando.**
- Ogni comando del registro (`COMMANDS`) e ogni opzione usata nei livelli ha una
  spiegazione in italiano: nessun passo resta senza testo.
- Le righe prima e dopo sono quelle del motore (identiche al pannello del flusso).
- Gli slot vuoti e i reindirizzamenti (`2>/dev/null`, `2>&1`) hanno una spiegazione propria.

**T3 – Perché serve.**
- Per ogni comando il Tutor dice cosa cambierebbe togliendolo (output calcolato).
- Se togliendolo il livello resta risolto, il Tutor lo segnala: «questo comando non serve».

**T4 – Quiz, debug e celle bloccate.**
- Quiz: il Tutor spiega la pipeline della domanda e perché le risposte sbagliate lo sono
  (campo `wrong[].why` già presente).
- Debug: mostra la pipeline rotta e quella corretta, con il comando cambiato evidenziato.

**T5 – Accessibilità e telefono.**
- Finestra con focus gestito, Esc per chiudere, frecce per i passi; nessuna violazione axe.
- A 320 px le righe prima/dopo vanno a capo, niente scorrimento orizzontale.

### Verifiche automatiche nuove

- `tools/check-tutor.js` (in CI): genera il Tutor per ogni livello, ricetta dell'allenamento
  e della sfida (366 giorni), livello della galleria ed enigma; fallisce se un passo non ha
  spiegazione o contiene «undefined».
- Test nel browser: apertura dopo una vittoria, passi ◀ ▶, livello di quiz e di debug, menu.

### File toccati

`tutor.js` (nuovo), `index.html` (finestra), `app.js` (pulsante dopo la vittoria),
`levels.js` (campo `tutor` facoltativo, a mano dove serve), `style.css`, `sw.js`,
`version.js`, `tools/check-tutor.js`, test.

---

## 3. Sezione LPI in italiano (v1.22.0) ✅ strada 1

Fatto il 9/11/2026 (strada 1: titoli, pesi, link e contenuti nostri, nessun testo delle lezioni):
`lpi.js` (dati: 61 obiettivi di 101, 102 e Linux Essentials 1.6, da learning.lpi.org/it e
wiki.lpi.org), `lpi-view.js` (sezione «📘 Certificazioni LPI»), casella «studiato» nei progressi e
nel backup, pulsante «📘 LPI» nel Tutor, `tools/check-lpi.js` (in CI; `--online` controlla i 67
link). Fase 0 risolta: licenza **CC BY-NC-ND 4.0** (uso non commerciale; copie integrali e non
modificate permesse con attribuzione; niente riassunti o tagli del testo LPI). Strada 2 (lezioni
integrali offline) in attesa della risposta di LPI alla mail in `docs/LPI-mail.md`.

### Cosa c'è di gratuito in italiano

Dalla ricerca del 9/11/2026 (`reports/Certificazioni Linux e preparazione.md`):

- **LPI Learning Materials** su learning.lpi.org: lezioni ufficiali gratuite, tradotte in
  italiano da volontari per **Linux Essentials** e **LPIC-1** (esami 101-500 e 102-500).
- Gli **obiettivi d'esame** (wiki.lpi.org), con pesi e comandi da conoscere.
- Linux Essentials 2.0 è uscita a ottobre 2026; la traduzione italiana è annunciata «nei
  prossimi mesi».

### Fase 0 – Da chiarire prima di scrivere codice

1. **Licenza.** Va letta la licenza dei Learning Materials sul sito LPI.
   - Se permette di ridistribuirli (anche solo come copia integrale, citando LPI e i
     traduttori, senza scopo commerciale), si possono includere nel gioco per l'uso offline.
   - Se non lo permette, o se vieta le modifiche, la sezione **rimanda** alle pagine
     ufficiali con un link per ogni obiettivo, senza copiare testo. In ogni caso nessun
     estratto riscritto o tagliato senza permesso.
   - In dubbio si può scrivere a LPI per chiedere il permesso.
2. **Accesso.** learning.lpi.org, wiki.lpi.org e lpi.org sono bloccati nella rete di questo
   ambiente cloud: vanno aggiunti agli indirizzi consentiti, oppure i materiali vanno
   scaricati dal Mac e caricati nel repository.
3. **Versione.** Verificare quali lezioni italiane esistono davvero (Linux Essentials 1.6 o
   2.0, LPIC-1 5.0) e la data dell'ultima revisione.

### Cosa contiene la sezione «🎓 LPI»

Un nuovo pannello dal menu, con due schede: **Linux Essentials** e **LPIC-1 (101 e 102)**.

- **L'elenco degli obiettivi** con il loro peso (es. 103.2 «Elaborare flussi di testo usando
  i filtri», peso 2).
- **Per ogni obiettivo**:
  - la lezione ufficiale in italiano (link, oppure il testo se la licenza lo consente);
  - **«Allenati in Pipe Dreams»**: i livelli, i casi e gli argomenti dell'allenamento che lo
    esercitano (mappa costruita a mano e controllata da un test);
  - **cosa il gioco non copre** dell'obiettivo (es. per 103.2: `od`, `split`, `md5sum`,
    `zcat`), da studiare sulla lezione e provare nel container;
  - una casella «studiato» che resta nei progressi (e nel backup).
- **Il riepilogo**: quanta parte dell'esame 101 è coperta dai livelli che hai risolto.

### Storie e criteri di accettazione

**L1 – Trovare la lezione giusta.** Ogni obiettivo di LPIC-1 101/102 e di Linux Essentials ha
il suo titolo in italiano, il peso e il link (o il testo) della lezione ufficiale.

**L2 – Dal gioco all'esame.** Ogni obiettivo indica i livelli che lo esercitano; ogni livello
indica, nel Tutor, l'obiettivo LPI corrispondente. Un test controlla che i livelli citati
esistano e usino davvero i comandi dell'obiettivo.

**L3 – Lacune visibili.** Per ogni obiettivo è scritto cosa il gioco non copre.

**L4 – Progressi.** Gli obiettivi segnati «studiato» restano dopo un ricaricamento e passano
con il backup; il riepilogo mostra la copertura.

**L5 – Fonti e licenza.** In fondo alla sezione: fonte, versione e data dei materiali, nome
dei traduttori, licenza. Nessun testo LPI senza attribuzione.

### Contenuti originali (senza problemi di licenza)

Questi li scriviamo noi e si possono fare comunque, anche se la licenza LPI non permette di
includere le lezioni:

- la mappa obiettivo → livelli;
- i riassunti in parole nostre degli obiettivi coperti dal gioco;
- gli esercizi nel container («prova `split -l 2` su questo file»).

Niente domande d'esame copiate o «dump»: è contro le regole LPI e inutile per imparare.

### File toccati

`lpi.js` (nuovo: obiettivi, pesi, link, mappa), `lpi-view.js` (pannello), `index.html`,
`progress.js` e `backup.js` (obiettivi studiati), `tutor.js` (riferimento all'obiettivo),
`style.css`, `sw.js`, `version.js`, test e `tools/check-lpi.js` per la mappa.

---

## Idee collegate (fuori da questo piano)

- **Comandi di LPIC-1 103.2 che il gioco non ha**: `od`, `split`, `md5sum`/`sha256sum`,
  `zcat`/`bzcat`/`xzcat`. Potrebbero diventare un Atto IX «Verso l'esame».
- **Esercizi con `find`, permessi e processi**, da fare nel container di Proxmox con una
  guida passo passo.
- **Il Tutor nella pagina man del gioco**: «quali livelli usano questo comando».
