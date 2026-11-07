---
name: storie-utente
description: Backlog di storie utente per Pipe Dreams in docs/STORIES.md, con criteri di accettazione verificabili e milestone. Use prima di una funzione grande (un atto, una modalità, un sistema nuovo), quando l'utente chiede un piano, un backlog, «cosa facciamo prima», o dopo aver approvato un piano.
---

# Storie utente

Le schermate dicono com'è il gioco; le storie dicono cosa fa chi gioca. Si costruiscono e si
verificano storie, non schermate.

Leggi la richiesta dell'utente, `README.md`, `docs/GLOSSARIO.md` e, se esiste,
`docs/STORIES.md`. Scrivi o aggiorna `docs/STORIES.md`.

## Formato

```markdown
### S-012 Rivedere il tutorial dal menu
Chi gioca apre LIVELLI e sceglie «Rivedi il tutorial»: riparte dal livello 1, passo 1.
Dipende da: S-004
Accettazione:
- [e2e] Il riquadro mostra «Tutorial 1/5» e illumina l'input.
- [e2e] Andare in un altro livello chiude il tutorial.
- [axe] Nessuna violazione con il riquadro aperto.
- [tool] tools/check-stories.js esce con 0 problemi.
- [manuale] Su telefono il riquadro non copre il pulsante ESEGUI.
Stato: da fare
```

- Un'azione per storia: «Rivedere il tutorial dal menu», non «Gestire il tutorial».
- Ogni riga di accettazione dice come si controlla: `[e2e]` test nel browser, `[tool]` uno
  strumento in `tools/`, `[bash]` confronto con bash, `[axe]` controllo di accessibilità,
  `[manuale]` deve provarlo una persona. «Funziona bene» non si può controllare.
- `Dipende da:` (facoltativo) le storie da fare prima.
- Stato: `da fare`, `in corso`, `fatta`, `scartata`.
- Le parole sullo schermo usano i nomi di `docs/GLOSSARIO.md`.

## Milestone

Ogni milestone finisce con qualcosa che l'utente può giocare e pubblicare (una versione).
Esempio per una modalità nuova:

1. **M1 Il giro base**: la modalità si apre, si gioca una volta dall'inizio alla fine, i
   progressi restano dopo un ricaricamento.
2. **M2 Contenuti**: tutti i livelli, capitoli o ricette previsti, verificati con bash.
3. **M3 Aiuti e feedback**: aiuti, confronto con la soluzione, messaggi d'errore utili.
4. **M4 Integrazioni**: obiettivi, statistiche, backup, link condivisibili, terminale.
5. **M5 Rifinitura**: tutorial, accessibilità, telefono, novità della versione.

Dentro una milestone, prima le storie da cui dipendono le altre.

## Cosa lasciare fuori

Scrivi sotto `## Scartate` (una riga ciascuna) quello che richiederebbe un server, un account
o la rete (classifiche online, accessi), e quello che bash non può verificare: Pipe Dreams
gira tutto nel browser e ogni pipeline deve coincidere con GNU coreutils.

## Controllo delle dimensioni

M1 ha da 3 a 8 storie. Più di 40 storie in tutto: sposta il resto sotto `## Più avanti`.

Per ogni storia di M1 che aggiunge una schermata, un'azione o dei testi, chiama lo strumento
Skill con `revisione-ux`.

Done when ogni parte della richiesta corrisponde a una storia o a una riga in `Scartate`,
ogni storia ha criteri con un tag di controllo, e le storie di M1 con interfaccia hanno un
blocco `UX:`.
