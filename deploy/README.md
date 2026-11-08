# Pipe Dreams su Proxmox (container LXC)

Un container Alpine Linux da 128 MB che serve il gioco in **HTTPS** sulla tua rete, con
**bash e i comandi GNU** per provare davvero le righe di shell del gioco.

- `proxmox-lxc.sh`: si lancia nella shell di Proxmox; crea il container e lo configura.
- `pipedreams-setup.sh`: gira dentro il container (lo copia `proxmox-lxc.sh`): nginx, certificati,
  gioco scaricato da GitHub, bash come shell di root.

Verificati in un Alpine vero (3.24, GNU coreutils 9.11): HTTPS, rimandi, download della CA,
service worker e appunti in Chromium. Tutte le verifiche del gioco contro bash
(`PIPEDREAMS_DOCKER=nome node tools/check-shell.js`) danno lo stesso risultato anche con
coreutils 9.11. I comandi di Proxmox (`pct`, `pveam`) sono stati simulati: la prima volta
su un Proxmox vero controlla l'output.

## 1. Installazione (shell di Proxmox)

Dall'interfaccia web di Proxmox: nodo > **Shell**, poi:

```bash
wget https://raw.githubusercontent.com/paselsoft/PipeDreams/HEAD/deploy/proxmox-lxc.sh
```

```bash
bash proxmox-lxc.sh
```

Alla fine lo script stampa gli indirizzi da aprire sul Mac.

### Rete

Predefinita: **NAT**. Il container sta su una rete interna (`vmbr1`, 10.10.10.0/24) e Proxmox
inoltra le porte **8443** (https) e **8080** (http) al container. È la scelta giusta se Proxmox
gira in VirtualBox con la scheda in bridge sul **Wi-Fi**: il Wi-Fi accetta un solo indirizzo MAC
per scheda, e un container collegato direttamente al bridge di solito non riceve rete.
Lo script aggiunge `vmbr1` a `/etc/network/interfaces` (copia di prima in
`/etc/network/interfaces.prima-di-pipedreams`).

Con il **cavo Ethernet** puoi usare il container direttamente sulla rete di casa:

```bash
MODE=bridge bash proxmox-lxc.sh
```

In VirtualBox, la scheda della VM di Proxmox va in «Scheda con bridge» con
**Modalità promiscua: Permetti tutto** (Impostazioni > Rete > Avanzate).

## 2. Sul Mac

1. Apri `http://IP-DI-PROXMOX:8080/pipedreams-ca.crt` e scarica il certificato.
2. Doppio clic sul file: si apre **Accesso Portachiavi**. Mettilo nel portachiavi **Sistema**.
3. Doppio clic su **Pipe Dreams CA locale** > **Fidati** > «Quando utilizzi questo certificato:
   **Fidati sempre**». Chiudi e conferma con la password.
4. Apri `https://IP-DI-PROXMOX:8443/` con Safari o Chrome.

Con il certificato accettato funzionano anche l'app installabile, l'uso offline e i pulsanti
«Copia». Firefox può usare un archivio suo: se si lamenta, Impostazioni > Privacy e sicurezza >
Certificati > Mostra certificati > Autorità > Importa.

**Progressi**: restano nel browser del Mac, legati all'indirizzo. Se l'indirizzo di Proxmox
cambia, il browser lo vede come un altro sito: dai a Proxmox un indirizzo fisso nel router, oppure
usa Menu > Backup dei progressi prima di cambiarlo.

## 3. Il terminale vero

Nell'interfaccia web di Proxmox: container **pipedreams** > **Console**, accesso come `root`
con la password scelta durante l'installazione (si cambia con `pct enter ID` e poi `passwd`).
Senza password: dalla shell di Proxmox `pct enter ID`, poi `bash -l`. Metti il browser del gioco a sinistra
e la console a destra: copia la riga `$ ...` sotto la pipeline e incollala nella console.

Oltre ai comandi GNU ci sono `ps` completo (procps) e `ss` (iproute2), così anche le righe
«sul sistema vero» dei livelli con `ps aux` e `ss -Htln` girano come su un server.
Una trappola classica da provare: `ps aux | grep 'python3'` trova anche la riga di `grep`
stesso, perché anche grep è un processo con «python3» nella sua riga di comando.

## Comandi utili

```bash
bash proxmox-lxc.sh aggiorna
```

```bash
bash proxmox-lxc.sh certificato
```

```bash
bash proxmox-lxc.sh stato
```

`aggiorna` scarica l'ultima versione del gioco e installa i pacchetti che mancano; `certificato` rifà il certificato se l'indirizzo
di Proxmox è cambiato (la CA resta la stessa: sul Mac non serve reinstallarla).
Variabili: `CTID`, `MEMORY`, `HTTPS_PORT`, `HTTP_PORT`, `UPLINK`, `NAT_BRIDGE`, `NAT_NET`,
`STORAGE` (vedi in cima a `proxmox-lxc.sh`).

Se il firewall di Proxmox è attivo a livello di datacenter, consenti le porte 8443 e 8080 sul nodo.
