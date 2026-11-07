---
name: pipedreams
description: Punto di partenza per lavorare su Pipe Dreams, il gioco sulle pipeline Unix. Sceglie la skill giusta per il passo successivo.
disable-model-invocation: true
---

# Pipe Dreams: da dove partire

Trova a che punto è la richiesta, poi chiama lo strumento Skill con la skill di quel passo.
Una skill per chiamata.

```text
idea -> storie-utente -> revisione-ux -> ciclo-miglioramento (codice, verifica, commit) -> check-architettura a fine milestone
```

| La richiesta | Skill |
| --- | --- |
| Una funzione nuova e grande (una modalità, un atto, un sistema) | `storie-utente` |
| Una schermata, un'azione o dei testi nuovi; «come dovrebbe funzionare?» | `revisione-ux` |
| «Vai avanti», «finisci la milestone», lavorare sul backlog | `ciclo-miglioramento` |
| Un nuovo caso a puntate, o capitoli nuovi per uno esistente | `nuovo-caso` |
| Un file troppo lungo, bug che si ripetono, fine milestone, «riorganizza il codice» | `check-architettura` |
| Controllare che tutto funzioni prima di un commit | `verifica` |

Livelli della campagna, sfida del giorno e allenamento hanno già i loro strumenti
(`tools/validate-levels.js`, `tools/check-daily.js`): li usa `verifica`.

Done when hai nominato il passo, chiamato la sua skill e detto all'utente quale viene dopo.
