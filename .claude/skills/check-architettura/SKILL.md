---
name: check-architettura
description: Check-in di architettura per il codice JavaScript di Pipe Dreams. Trova i punti caldi, propone moduli più profondi e riorganizza un passo per commit con il comportamento provato identico. Use a fine milestone, prima di una funzione grande, quando un file supera le 1.000 righe, quando una funzione tocca più di 6 file, quando i bug si ripetono nella stessa zona, o quando l'utente chiede di riorganizzare il codice.
---

# Check-in di architettura

Le funzioni si accumulano e un gioco facile da cambiare diventa difficile. Il check-in lo
nota presto: rilievo, proposta, scelta dell'utente, poi piccoli passi che non cambiano il
comportamento.

## Quando

Basta un segnale:

- fine di una milestone (la chiama `ciclo-miglioramento`);
- un file oltre 1.000 righe (`app.js` lo è già) o una funzione oltre 80 righe;
- una funzione nuova tocca più di 6 file;
- la stessa zona compare 3 volte in `docs/FIXLOG.md`;
- lo stesso caso speciale ripetuto in molti punti (es. `stopMarathon(); stopTraining();
  stopGallery(); stopMystery();` in ogni modalità).

## Parole

- **Modulo**: qualcosa con un'interfaccia e un'implementazione (una funzione, un file).
- **Profondità**: quanto fa un modulo per unità di interfaccia. Un modulo profondo nasconde
  molto dietro poche funzioni; uno superficiale passa solo le chiamate.
- **Cucitura**: un punto dove si cambia comportamento senza toccare chi chiama (es.
  `COMMANDS`: un comando nuovo non tocca il motore).
- **Località**: una modifica tocca un posto solo.

## 1. Rilievo

Non cambiare codice in questo passo.

```bash
git log --since=30.days --name-only --format= | sort | uniq -c | sort -rn | head -15
wc -l *.js | sort -n | tail -10
grep -hoE "^(function|const|let) [A-Za-z_]+" *.js | sort | uniq -d   # nomi globali ripetuti
```

Cerca anche:

- stato globale modificato da molti file (`dailyLevel`, `progress`, `gridState`);
- la stessa logica copiata (es. i calcoli delle stelle in campagna, sfida, allenamento,
  galleria e casi);
- funzioni dell'interfaccia con dentro logica pura che i test in `tools/` non possono usare
  da Node: spostala in un file senza DOM, come `commands.js` e `solver.js`.

**Test della cancellazione** per ogni candidato: se cancellassi questo modulo, la
complessità si concentrerebbe in un punto (allora tienilo) o si spargerebbe in ogni
chiamante (allora si guadagna il posto)? I moduli che passano solo le chiamate falliscono.

## 2. Proposta

Scrivi `docs/architettura-<AAAA-MM-GG>.md`, una scheda per candidato:

```markdown
## <Titolo con i nomi del gioco>  [Forte | Da esplorare | Speculativo]

File: app.js (1.004 righe), training.js, gallery.js, stories-view.js
Segnale: <quale dei segnali sopra>
Problema: <cosa è difficile da cambiare oggi, con un esempio>
Proposta: <il modulo nuovo e la sua interfaccia, al massimo 15 righe>
Vantaggi: <località, test più semplici>
Prova di stesso comportamento: <test e2e, strumenti in tools/, screenshot>
Piano: <un commit per passo>
```

Chiudi con una raccomandazione principale e un elenco «considerati, non consigliati».
«Il codice va bene così» è un risultato valido.

Fermati e chiedi all'utente quale candidato fare. Senza nessuno che guarda, fai solo la
raccomandazione principale e solo se è `Forte`.

## 3. Riorganizza

- Prima: lancia tutta la `verifica` e salva i risultati (numero di test, pipeline identiche).
- Un passo per commit. Il comportamento resta identico, niente funzioni nuove insieme.
- Il gioco funziona dopo ogni passo: `node --check`, test e2e verdi.
- Un file nuovo va anche in `index.html` (ordine degli script) e in `FILES` di `sw.js`.

## 4. Registra

Aggiorna la tabella «Struttura» nel `README.md`. Un bug trovato durante il lavoro va in
`docs/FIXLOG.md` con la sua `Regola:`.

Done when il file di proposta esiste, il passo scelto è in commit separati, la verifica dà
gli stessi risultati prima e dopo, e il README descrive il codice com'è.
