// La storia del gioco: sei il nuovo sistemista della Pipe & Co.
// I testi sono separati da levels.js: un livello senza messaggio (es. quelli dell'editor) funziona lo stesso.

// Schermata mostrata la prima volta che si entra in un atto
const ACTS = {
    1: {
        title: "Primo giorno",
        intro: "È il tuo primo giorno come sistemista alla Pipe & Co., una piccola azienda dove i server hanno nomi di animali e di frutta e nessuno ricorda dove sono i backup. Marco, il collega che ti fa da guida, ti accoglie con un caffè e una frase: «Qui risolviamo tutto con le pipeline. Vedrai.»"
    },
    2: {
        title: "I log non mentono",
        intro: "Hai superato la prima settimana. Giulia, la responsabile IT, ti affida i compiti veri: audit di sicurezza, utenti da aggiornare, statistiche per l'ufficio. «I log sanno tutto», ti dice Marco, «basta saperli interrogare.» Nella tua cassetta degli attrezzi arrivano wc, cut, tr e uniq -c."
    },
    3: {
        title: "Riscrivere il testo",
        intro: "Il consiglio di amministrazione non vuole più log grezzi: vuole report presentabili. Per questo servono strumenti che non si limitano a filtrare, ma trasformano il testo: sed con le espressioni regolari, awk per le colonne e paste per ricomporre le righe."
    },
    4: {
        title: "Incidente in produzione",
        intro: "Venerdì, ore 18:47. Marco è partito per le ferie, Giulia è chiusa in riunione e tutto si rompe nello stesso momento: la rubrica, la newsletter, il server di posta, il sito. Non ci sono comandi nuovi: solo tu, quello che hai imparato e pochissimo tempo."
    }
};

// Messaggio di un personaggio che introduce ogni livello, per id
const STORY = {
    1: { from: "Marco", text: "Benvenuto! Si parte facile: il backup di stanotte ha copiato anche dei file corrotti. Tieni solo quelli buoni." },
    2: { from: "Marco", text: "Qui i server si chiamano zebra, mela e cane, non chiedermi perché. La lista è piena di doppioni: sistemala." },
    3: { from: "Marco", text: "Lo script dell'inventario scrive CRASH sul terminale e Giulia si spaventa ogni volta. Fammi un elenco pulito, in maiuscolo." },
    4: { from: "Marco", text: "Stanotte restano accesi solo due server: i primi in ordine alfabetico. Dimmi quali, senza doppioni." },
    5: { from: "Giulia", text: "Ciao, sono Giulia. Il monitoraggio mescola nomi di server e avvisi: voglio solo i server, in maiuscolo, una volta sola." },
    6: { from: "Giulia", text: "Il job notturno è fallito. I suoi errori finiscono su stderr: mi servono proprio quelli, senza ripetizioni." },
    7: { from: "Giulia", text: "🚨 Alcuni nodi del cluster sono andati in crash e lo urlano su stderr. Mi servono quegli errori, subito!" },
    8: { from: "Giulia", text: "Audit di sicurezza: quanti accessi ci sono stati stanotte? Le uscite non contano." },
    9: { from: "Marco", text: "Dobbiamo aggiornare bash su tutti gli account che la usano. Mi prepari l'elenco degli utenti?" },
    10: { from: "Marco", text: "La lista della spesa per il frigo dell'ufficio è scritta peggio dei nostri log. Un frutto per riga, per favore." },
    11: { from: "Giulia", text: "Abbiamo votato il colore delle nuove felpe aziendali. Quali sono i due colori più votati?" },
    12: { from: "Giulia", text: "🚨 Il sito è lento e nessuno sa perché. Quali sono le pagine più richieste?" },
    13: { from: "Marco", text: "Orrore: il file di configurazione ha le password in chiaro! Nascondile prima che le veda qualcuno." },
    14: { from: "Giulia", text: "Per la slide sulle felpe mi serve la classifica completa dei colori. Solo i nomi, niente numeri." },
    15: { from: "Marco", text: "Il nuovo stagista legge le date solo all'italiana. Riscrivile e metti i log in ordine cronologico." },
    16: { from: "Giulia", text: "Il gestionale accetta gli utenti solo in un'unica riga, separati da virgole. Ci pensi tu?" },
    17: { from: "Giulia", text: "🚨 Presento al consiglio tra dieci minuti! Mi serve il riepilogo delle pagine più visitate, in una riga." },
    18: { from: "Giulia", text: "Il telefono aziendale ha esportato la rubrica al contrario e devo chiamare tutti prima delle sette. Aiutami!" },
    19: { from: "Marco", text: "Ti scrivo dalla spiaggia: il torneo di freccette è finito senza di me. Dimmi almeno qual è il punteggio vincente." },
    20: { from: "Giulia", text: "La newsletter parte stasera e la lista è un disastro. Quante persone diverse dobbiamo scrivere?" },
    21: { from: "Giulia", text: "🚨 Il server di posta va a singhiozzo. Quali errori dà, e quanto spesso?" },
    22: { from: "Marco", text: "Ultima cosa, giuro: l'ordine della frutta per lunedì. Una riga sola, separata da virgole." },
    23: { from: "Giulia", text: "🚨 I clienti trovano pagine rotte! Agli sviluppatori serve la lista delle pagine 404. Adesso." }
};

// Mostrato dopo l'ultimo livello
const EPILOGUE = "Lunedì mattina Giulia ti chiama nel suo ufficio. «Venerdì hai salvato la rubrica, la newsletter, la posta e il sito. Da oggi il guru delle pipeline sei tu.» Marco, appena rientrato e abbronzatissimo, sorride: «Te l'avevo detto. Si risolve tutto con le pipeline.»";
