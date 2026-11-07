---
name: revisione-ux
description: Revisione UX di una funzione di Pipe Dreams, con nomi, flusso, dove si apre (in linea, barra, finestra, toast), stati, parole in italiano e accessibilità. Use prima di scrivere una storia che aggiunge una schermata, un'azione o dei testi, quando storie-utente o ciclo-miglioramento la chiamano, o quando l'utente chiede testi più chiari o una revisione di una schermata.
argument-hint: "[storia o schermata]"
---

# Revisione UX

Una funzione che funziona può confondere lo stesso. Questa revisione decide come si chiamano
le cose, come ci si muove, dove si apre la funzione e cosa dice, prima del codice. Per
rivedere una schermata già fatta, applica gli stessi passi al suo screenshot ed elenca i
problemi, dal più grave.

Il risultato è un blocco `UX:` nella storia in `docs/STORIES.md` e i termini nuovi in
`docs/GLOSSARIO.md`.

## 1. I nomi

Ogni cosa ha un solo nome, e ogni nome è nel glossario (`Termine | Significa | Non dire`).

- Usa le parole di chi gioca, non del codice: «indizio», non «target nascosto».
- I comandi Unix restano come sono (`grep`, `sort -rn`): sono ciò che si impara.
- Una parola per idea in pulsanti, titoli, console, toast e manuale.

Controllo: ogni nome e verbo che la storia mette sullo schermo è nel glossario, e nessun
termine del glossario ha un secondo nome da qualche parte.

## 2. Il flusso

Scrivilo su una riga, da ogni ingresso a una fine visibile:

```text
LIVELLI > 📚 Casi a puntate > ▶ APRI > ▶ GIOCA > racconto > 🔎 INDAGA > enigma > deduzione > CAPITOLO SUCCESSIVO ▶
```

- Elenca ogni ingresso: menu LIVELLI, link (`?sfida`, `?maratona`, `#livello=`), barre.
- Ogni passo ha un'uscita: ✕ o Esc chiude la finestra, «✕ Esci» lascia la modalità.
- La fine si vede: un toast, il riquadro del confronto, il livello successivo.

## 3. Dove si apre

Scegli la prima riga che va bene: più leggero è meglio.

| La funzione | Si apre come |
| --- | --- |
| Cambia un valore già sullo schermo | In linea (pulsante, cella, interruttore) |
| Una conferma breve che non chiede niente | Toast |
| Uno stato che dura per tutta la modalità | Barra sotto il titolo (come Maratona, allenamento, casi) |
| Una spiegazione dopo l'esecuzione | Console, o il riquadro sotto la console |
| Un racconto o un passaggio importante | Schermata della storia (come l'introduzione degli atti) |
| Una lista da cui scegliere, o un contenuto lungo | Finestra (`menu-overlay` con titolo e ✕) |
| Un'azione che cancella dati | `confirm()` con l'azione nel testo |

- Una finestra alla volta. Una finestra nuova va in `index.html` con `role="dialog"`: a
  focus, Tab ed Esc ci pensa `a11y.js`.
- Il titolo della finestra dice cosa fa: «💾 BACKUP PROGRESSI», non «Impostazioni».

## 4. Gli stati

Per ogni vista toccata: **vuoto** (cosa serve e la prima azione), **bloccato** (come si
sblocca: «Si sblocca completando l'Atto III»), **errore** (vicino al problema, con la
correzione), **troppo** (testi e URL lunghi vanno a capo a 320 px), **fatto** (riscontro
subito: toast, stelle, coriandoli).

## 5. Le parole

- Italiano semplice, frasi brevi, si dà del tu.
- Pulsanti in maiuscolo con un verbo e, se aiuta, un'emoji: «🧪 LABORATORIO», «PROSSIMO ▶».
- Messaggi in console con il prefisso `> ` e l'esito tra quadre: `[SUCCESSO]`, `[FALLIMENTO]`.
- Un errore dice cosa è successo e come rimediare, senza colpe: «L'indizio ha 1 riga, la tua
  uscita 4.»
- Gli aiuti vanno a gradini: prima dove guardare, poi il piano, poi la soluzione.

Controllo: leggi ogni testo ad alta voce. È breve, usa solo termini del glossario, e chi
gioca per la prima volta capisce cosa fa ogni pulsante.

## 6. Accessibilità

- Tutto il flusso funziona da tastiera, in un ordine logico (Tab, Invio, Esc, frecce sulle celle).
- Ogni pulsante con sola icona ha `aria-label`; una regione che cambia ha `role="status"` o
  `aria-live`.
- Il significato non sta solo nel colore: ✓ ✗, «2>», testo barrato. Controlla anche con
  `body.cvd` (modalità daltonici).
- Movimento ridotto: rispetta `prefersReducedMotion()`.
- Il controllo axe in `tests/e2e/tutorial-accessibilita.test.js` include la vista nuova e non
  trova violazioni.

## 7. Il blocco UX

```markdown
UX:
- Flusso: LIVELLI > 🎯 Allenamento > argomento > livelli in fila > ✕ Esci
- Dove: finestra per la scelta, barra verde durante il gioco (stato di tutta la modalità)
- Stati: argomento mai giocato «» / giocato «✓ 3»; livello lungo -> confronto
- Parole: «🎯 Allenamento», «⏭ Cambia», «risolti oggi: 2 · in totale: 5»
- Accesso: Esc chiude la scelta; barra raggiungibile con Tab; axe senza violazioni
```

Done when la storia ha un blocco `UX:`, ogni termine è in `docs/GLOSSARIO.md` e i passi da 1
a 6 passano sui suoi screenshot.
