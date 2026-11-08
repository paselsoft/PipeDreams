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
    5: {
        title: "Il nuovo stagista",
        intro: "Lunedì arriva Tommaso, lo stagista, e Giulia te lo affida: «Insegnagli tutto quello che sai.» Tommaso fa domande, scrive script pieni di bug e deve fare i conti con i vecchi script aziendali, quelli che nessuno osa toccare. Stavolta non basta scrivere pipeline: devi leggerle, correggerle e rispettare dei vincoli."
    },
    4: {
        title: "Incidente in produzione",
        intro: "Venerdì, ore 18:47. Marco è partito per le ferie, Giulia è chiusa in riunione e tutto si rompe nello stesso momento: la rubrica, la newsletter, il server di posta, il sito. Non ci sono comandi nuovi: solo tu, quello che hai imparato e pochissimo tempo."
    },
    6: {
        title: "Il grande trasloco",
        intro: "La Pipe & Co. trasloca i server nel nuovo datacenter, e Giulia ti nomina responsabile della migrazione. I vecchi sistemi esportano dati assurdi: log al contrario, nomi scritti allo specchio, codici senza separatori. Nella cassetta degli attrezzi arrivano tac e rev, sort con le chiavi (-t -k), grep -o, uniq -d e cut -c."
    },
    7: {
        title: "Patch Tuesday",
        intro: "Nel nuovo datacenter convivono tre famiglie di Linux: Debian con apt, Arch con pacman (e yay per l'AUR), Fedora con dnf e rpm. È il secondo martedì del mese, il giorno delle patch, e Giulia vuole tutto aggiornato entro sera. Non lancerai tu gli aggiornamenti: leggerai i loro output. Arrivano nl per numerare, tee per vedere i dati a metà strada, comm e join per confrontare due elenchi."
    },
    8: {
        title: "Reperibilità notturna",
        intro: "Giulia ti consegna il telefono della reperibilità: questa settimana, di notte, i server sono affar tuo. Alle tre il monitoraggio suona e davanti a te ci sono solo gli output dei comandi di sistema: ps, du, df, ss, i log di SSH. Sono colonne allineate con gruppi di spazi e dimensioni scritte con K, M e G. Nella cassetta degli attrezzi arrivano tr -s per comprimere gli spazi, sort -h per le dimensioni, xargs per mettere le parole in fila e fold per andare a capo."
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
    23: { from: "Giulia", text: "🚨 I clienti trovano pagine rotte! Agli sviluppatori serve la lista delle pagine 404. Adesso." },
    24: { from: "Tommaso", text: "Ciao! Sono Tommaso, il nuovo stagista. Prima domanda: cosa stampa questa pipeline? Io avrei detto «1 pera»..." },
    25: { from: "Tommaso", text: "Ho scritto il mio primo script! Però dà dei doppioni... Giulia dice di cambiare il meno possibile. Mi aiuti?" },
    26: { from: "Giulia", text: "Lo script di backup è del 2009 e la prima riga non si tocca: l'ultima volta che ci hanno provato è saltato tutto." },
    27: { from: "Tommaso", text: "Altra domanda: quante righe conta questa? Io scommetto zero." },
    28: { from: "Marco", text: "Rientrato dalle ferie! Il monitoraggio notturno ha inizio e fine bloccati dal vecchio sistema. Riesci a contare i tipi di errore lo stesso?" },
    29: { from: "Giulia", text: "🚨 Lo script di Tommaso va in produzione stasera, ma non stampa niente! Trova il bug cambiando il meno possibile." },
    30: { from: "Marco", text: "Primo giorno di trasloco. Il vecchio server di backup scrive il log al contrario, dal fondo. Mi servono i backup, nell'ordine giusto." },
    31: { from: "Tommaso", text: "Ho aperto l'export del gestionale del '98 e i nomi dei server sono... scritti allo specchio?! 'arbez' sarebbe zebra?" },
    32: { from: "Giulia", text: "Prima del trasloco l'amministrazione vuole controllare le note spese più alte. Ordinale per importo, ma lasciami le righe intere." },
    33: { from: "Marco", text: "La copia dei file ha dei buchi. Ogni ERR è un file perso: quanti ne abbiamo persi, esattamente?" },
    34: { from: "Giulia", text: "La sicurezza del nuovo datacenter segnala badge clonati. Trovami quelli assegnati a più persone." },
    35: { from: "Tommaso", text: "Sto etichettando gli armadi del datacenter: in quali paesi abbiamo server? I codici sono tutti attaccati, senza trattini..." },
    36: { from: "Giulia", text: "🚨 Il vecchio server si spegne a mezzanotte e il disco va svuotato. Prima di copiare, voglio sapere quanti file abbiamo per estensione." },
    37: { from: "Giulia", text: "Buon Patch Tuesday! Si parte dal server Debian: ho lanciato apt list --upgradable. Mi prepari l'elenco numerato per il registro delle modifiche?" },
    38: { from: "Marco", text: "Sul server Arch uso pacman -Qu (yay -Qua per l'AUR). Al monitoraggio basta il numero, ma io voglio vedere anche i nomi mentre la pipeline lavora." },
    39: { from: "Tommaso", text: "Ho fatto rpm -qa sul server Fedora. Giulia mi ha dato la lista dei pacchetti critici: come faccio a vedere quali ci sono?" },
    40: { from: "Marco", text: "Su Debian dpkg-query mi dà le versioni installate, e ho un file con le ultime uscite. Mettile una accanto all'altra, che le confronto a occhio." },
    41: { from: "Tommaso", text: "Ultima domanda della giornata, promesso: cosa stampa comm -13? Io direi le righe in comune..." },
    42: { from: "Giulia", text: "Fedora: dnf check-update elenca tutto, ma il kernel lo aggiorniamo stanotte con un riavvio. Gli altri pacchetti, senza architettura, per favore." },
    43: { from: "Giulia", text: "🚨 È uscito il bollettino delle vulnerabilità! Ho l'inventario di tutti i server: dimmi subito quali vanno patchati per primi." },
    44: { from: "Marco", text: "🚨 Ti sveglio io: il server web è al 100% di CPU. Ho lanciato ps aux, guarda chi sta mangiando tutto. Ho un sospetto su Tommaso..." },
    45: { from: "Giulia", text: "🚨 Allarme disco: /var è al 97%. Ecco du -sh /var/*. Prima di cancellare qualcosa voglio sapere dove sta lo spazio." },
    46: { from: "Marco", text: "Nei log di SSH c'è qualcuno che prova password a raffica. Il firewall vecchio vuole due IP per regola, non chiedermi perché." },
    47: { from: "Tommaso", text: "Scusa per lo script di stanotte... Per farmi perdonare scrivo io l'avviso per il display del rack, ma è minuscolo: 16 caratteri per riga!" },
    48: { from: "Giulia", text: "Il nuovo firewall parte domattina. Mi serve l'elenco delle porte aperte verso l'esterno, in una riga, da incollare nella configurazione." },
    49: { from: "Tommaso", text: "Domanda veloce prima di andare a dormire: sort -h cosa fa con queste dimensioni? Io direi che 1.5G è la più piccola..." },
    50: { from: "Giulia", text: "🚨 Ultima notte di reperibilità, e il NAS non risponde. Prima del rapporto voglio i dischi NVMe in una riga, dal più grande: così vediamo dove spostare i backup." }
};

// Mostrato dopo l'ultimo livello
const EPILOGUE = "La settimana di reperibilità finisce all'alba di lunedì: hai fermato lo script di Tommaso, liberato il disco, chiuso le porte e bloccato chi provava le password, e il rapporto della notte è pronto prima del caffè. Qualche settimana prima, il secondo martedì del mese si era chiuso con tutti i server aggiornati, Debian, Arch e Fedora, e nessuno ha dovuto riavviare in orario di lavoro. Settimane prima, a mezzanotte e un minuto, il vecchio server si era spento e il trasloco era finito. Giulia ti chiama nel suo ufficio. «Hai salvato il sito, la newsletter e la posta, hai trasformato Tommaso in un sistemista vero e hai portato ogni byte nel nuovo datacenter. Da oggi il guru delle pipeline sei tu.» Marco sorride: «Te l'avevo detto. Si risolve tutto con le pipeline.» Ma i guai non finiscono mai: ogni giorno ti aspetta una nuova sfida, e nel menu LIVELLI trovi l'allenamento per ogni comando.";
