#!/usr/bin/env bash
# Pipe Dreams in un container LXC di Proxmox VE: Alpine Linux, nginx in HTTPS con un'autorità
# di certificazione locale, bash e i comandi GNU per provare le righe di shell del gioco.
#
# Si lancia nella shell di Proxmox (come root):
#   bash proxmox-lxc.sh               installa (crea il container)
#   bash proxmox-lxc.sh aggiorna      scarica l'ultima versione del gioco
#   bash proxmox-lxc.sh certificato   nuovo certificato (se l'indirizzo di Proxmox è cambiato)
#   bash proxmox-lxc.sh stato         indirizzi e stato del container
#
# Rete (variabile MODE):
#   nat    (predefinita) il container sta su una rete interna (vmbr1, 10.10.10.0/24) e Proxmox
#          inoltra le porte 8443 (https) e 8080 (http). Funziona anche se Proxmox è in una
#          macchina virtuale collegata in bridge al Wi-Fi, dove un secondo indirizzo MAC (quello
#          del container) di solito non riceve rete.
#   bridge il container prende un indirizzo dal router (DHCP) su vmbr0, porte 443 e 80.
#          Da usare con il cavo Ethernet.
#
# Altre variabili: CTID, MEMORY (MB), HTTPS_PORT, HTTP_PORT, UPLINK (vmbr0), NAT_BRIDGE (vmbr1),
# NAT_NET (10.10.10), STORAGE (dove creare il disco), REPO.
set -euo pipefail

STATE_FILE="/etc/pipedreams-lxc.conf"
# shellcheck disable=SC1090
[ -f "$STATE_FILE" ] && . "$STATE_FILE"

MODE="${MODE:-nat}"
CTID="${CTID:-}"
MEMORY="${MEMORY:-128}"
UPLINK="${UPLINK:-vmbr0}"
# Senza un valore esplicito, rete interna e indirizzi si scelgono tra quelli liberi
NAT_BRIDGE_CHOSEN="${NAT_BRIDGE:+si}"
NAT_NET_CHOSEN="${NAT_NET:+si}"
CT_IP_CHOSEN="${CT_IP:+si}"
NAT_BRIDGE="${NAT_BRIDGE:-vmbr1}"
NAT_NET="${NAT_NET:-10.10.10}"
CT_IP="${CT_IP:-$NAT_NET.10}"
REPO="${REPO:-https://github.com/paselsoft/PipeDreams.git}"
SETUP_URL="${SETUP_URL:-https://raw.githubusercontent.com/paselsoft/PipeDreams/HEAD/deploy/pipedreams-setup.sh}"
if [ "$MODE" = "nat" ]; then
    HTTPS_PORT="${HTTPS_PORT:-8443}"
    HTTP_PORT="${HTTP_PORT:-8080}"
else
    HTTPS_PORT="${HTTPS_PORT:-443}"
    HTTP_PORT="${HTTP_PORT:-80}"
fi

say() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mErrore:\033[0m %s\n' "$*" >&2; exit 1; }

check_proxmox() {
    [ "$(id -u)" -eq 0 ] || fail "lancia lo script come root, nella shell di Proxmox"
    for tool in pct pveam pvesm pvesh; do
        command -v "$tool" >/dev/null || fail "manca il comando $tool: lo script va lanciato su Proxmox VE"
    done
}

host_ip() {
    ip -4 -o addr show dev "$UPLINK" | awk '{print $4}' | cut -d/ -f1 | head -n 1
}

# Indirizzo che si scrive nel browser: quello di Proxmox (NAT) o quello del container (bridge)
access_ip() {
    if [ "$MODE" = "nat" ]; then
        host_ip
    else
        pct exec "$CTID" -- ip -4 -o addr show dev eth0 | awk '{print $4}' | cut -d/ -f1 | head -n 1
    fi
}

url_suffix() { [ "$1" = "443" ] || [ "$1" = "80" ] && echo "" || echo ":$1"; }

# Rete interna con NAT e inoltro delle porte, nel file di rete di Proxmox
bridge_in_use() { grep -q "^iface $1 " /etc/network/interfaces || ip link show "$1" >/dev/null 2>&1; }
subnet_in_use() { grep -q "address $1\." /etc/network/interfaces || ip -4 -o addr | grep -q " $1\."; }

setup_nat_bridge() {
    local marker="# pipedreams: rete interna"
    # Rete interna già creata da questo script (anche con un altro nome): si riusa
    local ours
    ours="$(awk -v m="$marker" 'index($0, m) == 1 { getline; print $2; exit }' /etc/network/interfaces)"
    if [ -n "$ours" ]; then
        NAT_BRIDGE="$ours"
        NAT_NET="$(awk -v b="$ours" '$1 == "iface" { cur = $2 } cur == b && $1 == "address" { split($2, a, "."); print a[1] "." a[2] "." a[3]; exit }' /etc/network/interfaces)"
        [ -n "$CT_IP_CHOSEN" ] || CT_IP="$NAT_NET.10"
        say "La rete interna $NAT_BRIDGE ($NAT_NET.0/24) c'è già"
        return
    fi
    if bridge_in_use "$NAT_BRIDGE"; then
        [ -z "$NAT_BRIDGE_CHOSEN" ] \
            || fail "$NAT_BRIDGE esiste già e non l'ha creato questo script: scegli un altro nome, es. NAT_BRIDGE=vmbr9"
        local n
        for n in $(seq 2 99); do
            bridge_in_use "vmbr$n" || { NAT_BRIDGE="vmbr$n"; break; }
        done
        bridge_in_use "$NAT_BRIDGE" && fail "non trovo un nome libero per la rete interna (vmbr2..vmbr99)"
        say "vmbr1 esiste già (è una tua rete): per Pipe Dreams uso $NAT_BRIDGE"
    fi
    if subnet_in_use "$NAT_NET"; then
        [ -z "$NAT_NET_CHOSEN" ] || fail "la rete $NAT_NET.0/24 è già usata: scegline un'altra, es. NAT_NET=10.10.77"
        local n
        for n in $(seq 20 10 250); do
            subnet_in_use "10.10.$n" || { NAT_NET="10.10.$n"; break; }
        done
        subnet_in_use "$NAT_NET" && fail "non trovo una rete libera per i container (10.10.x.0/24)"
        [ -n "$CT_IP_CHOSEN" ] || CT_IP="$NAT_NET.10"
        say "La rete 10.10.10.0/24 è già usata: per Pipe Dreams uso $NAT_NET.0/24"
    fi
    say "Creo la rete interna $NAT_BRIDGE ($NAT_NET.0/24) con NAT verso $UPLINK"
    cp /etc/network/interfaces "/etc/network/interfaces.prima-di-pipedreams"
    cat >> /etc/network/interfaces <<EOF

$marker per Pipe Dreams, con NAT verso $UPLINK (aggiunta da proxmox-lxc.sh)
auto $NAT_BRIDGE
iface $NAT_BRIDGE inet static
	address $NAT_NET.1/24
	bridge-ports none
	bridge-stp off
	bridge-fd 0
	post-up   echo 1 > /proc/sys/net/ipv4/ip_forward
	post-up   iptables -t nat -A POSTROUTING -s $NAT_NET.0/24 -o $UPLINK -j MASQUERADE
	post-down iptables -t nat -D POSTROUTING -s $NAT_NET.0/24 -o $UPLINK -j MASQUERADE
	post-up   iptables -t nat -A PREROUTING -i $UPLINK -p tcp --dport $HTTPS_PORT -j DNAT --to-destination $CT_IP:443
	post-down iptables -t nat -D PREROUTING -i $UPLINK -p tcp --dport $HTTPS_PORT -j DNAT --to-destination $CT_IP:443
	post-up   iptables -t nat -A PREROUTING -i $UPLINK -p tcp --dport $HTTP_PORT -j DNAT --to-destination $CT_IP:80
	post-down iptables -t nat -D PREROUTING -i $UPLINK -p tcp --dport $HTTP_PORT -j DNAT --to-destination $CT_IP:80
EOF
    ifup "$NAT_BRIDGE"
}

# Modello Alpine più recente per l'architettura di Proxmox (amd64 su un PC Intel o AMD):
# l'elenco contiene anche i modelli per arm64, che su Intel non partono
latest_template() {
    pveam update >/dev/null
    local arch
    arch="$(dpkg --print-architecture 2>/dev/null || echo amd64)"
    pveam available --section system | awk '{print $2}' | grep '^alpine-3' | grep "_${arch}\.tar" | sort -V | tail -n 1
}

rootfs_storage() {
    if [ -n "${STORAGE:-}" ]; then echo "$STORAGE"; return; fi
    local list
    list="$(pvesm status --content rootdir | awk 'NR > 1 {print $1}')"
    if grep -qx "local-lvm" <<<"$list"; then echo "local-lvm"; else head -n 1 <<<"$list"; fi
}

setup_script() {
    local dir
    dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$dir/pipedreams-setup.sh" ]; then
        echo "$dir/pipedreams-setup.sh"
    else
        curl -fsSL "$SETUP_URL" -o /tmp/pipedreams-setup.sh
        echo /tmp/pipedreams-setup.sh
    fi
}

wait_for_network() {
    say "Aspetto la rete del container"
    for _ in $(seq 1 30); do
        if pct exec "$CTID" -- apk update -q >/dev/null 2>&1; then return; fi
        sleep 2
    done
    fail "il container non raggiunge internet: controlla la rete ($MODE) e il firewall di Proxmox"
}

run_setup() {
    pct push "$CTID" "$(setup_script)" /root/pipedreams-setup.sh
    pct exec "$CTID" -- sh /root/pipedreams-setup.sh "$@"
}

# Password di root per la console del container (solo se lo script è interattivo)
set_root_password() {
    [ -t 0 ] || return 0
    local password
    read -r -s -p "Password di root per la console del container (vuota = solo pct enter): " password
    echo
    [ -n "$password" ] || return 0
    printf 'root:%s\n' "$password" | pct exec "$CTID" -- chpasswd
    say "Password di root impostata"
}

save_state() {
    cat > "$STATE_FILE" <<EOF
# Container di Pipe Dreams (scritto da proxmox-lxc.sh)
CTID=$CTID
MODE=$MODE
HTTPS_PORT=$HTTPS_PORT
HTTP_PORT=$HTTP_PORT
UPLINK=$UPLINK
NAT_BRIDGE=$NAT_BRIDGE
NAT_NET=$NAT_NET
CT_IP=$CT_IP
EOF
}

print_instructions() {
    local ip
    ip="$(access_ip)"
    cat <<EOF

$(say "Pipe Dreams è pronto nel container $CTID")

Sul Mac:
  1. Scarica il certificato dell'autorità locale:
       http://$ip$(url_suffix "$HTTP_PORT")/pipedreams-ca.crt
     Aprilo con un doppio clic: va in Accesso Portachiavi, nel portachiavi «Sistema».
     Fai doppio clic su «Pipe Dreams CA locale» > Fidati > «Quando utilizzi questo certificato:
     Fidati sempre». Chiudi la finestra e conferma con la password.
  2. Gioca:
       https://$ip$(url_suffix "$HTTPS_PORT")/
  3. Il terminale vero: nella console web di Proxmox apri il container $CTID ($(hostname)
     > $CTID > Console), entra come root e incolla le righe «\$ ...» del gioco.
     Senza password: dalla shell di Proxmox, pct enter $CTID e poi bash -l.

Aggiornare il gioco:      bash $0 aggiorna
Se cambia l'indirizzo:    bash $0 certificato
EOF
}

installa() {
    check_proxmox
    [ -z "$CTID" ] || ! pct status "$CTID" >/dev/null 2>&1 || fail "il container $CTID esiste già (bash $0 stato)"
    CTID="${CTID:-$(pvesh get /cluster/nextid)}"
    local ip net0 template storage
    ip="$(host_ip)"
    [ -n "$ip" ] || fail "non trovo l'indirizzo di Proxmox su $UPLINK (prova UPLINK=...)"

    if [ "$MODE" = "nat" ]; then
        setup_nat_bridge
        net0="name=eth0,bridge=$NAT_BRIDGE,ip=$CT_IP/24,gw=$NAT_NET.1"
    elif [ "$MODE" = "bridge" ]; then
        net0="name=eth0,bridge=$UPLINK,ip=dhcp"
    else
        fail "MODE può essere nat o bridge"
    fi

    template="$(latest_template)"
    [ -n "$template" ] || fail "non trovo il modello Alpine per $(dpkg --print-architecture 2>/dev/null || echo amd64) (pveam available)"
    if ! pveam list local | grep -q "$template"; then
        say "Scarico il modello $template"
        pveam download local "$template"
    fi
    storage="$(rootfs_storage)"

    say "Creo il container $CTID ($template, ${MEMORY} MB di RAM, disco su $storage)"
    pct create "$CTID" "local:vztmpl/$template" \
        --hostname pipedreams --memory "$MEMORY" --swap 0 --cores 1 \
        --rootfs "$storage:1" --net0 "$net0" \
        --unprivileged 1 --features nesting=1 --onboot 1 \
        --description "Pipe Dreams: https://github.com/paselsoft/PipeDreams"
    pct start "$CTID" || fail "il container $CTID non parte (vedi il messaggio sopra). Per riprovare: pct destroy $CTID e poi di nuovo bash $0"
    save_state
    wait_for_network
    run_setup --ip "$(access_ip)" --https-port "$HTTPS_PORT" --repo "$REPO"
    set_root_password
    print_instructions
}

case "${1:-installa}" in
    installa) installa ;;
    aggiorna)
        check_proxmox
        [ -n "$CTID" ] || fail "nessun container installato ($STATE_FILE non c'è)"
        run_setup --aggiorna
        ;;
    certificato)
        check_proxmox
        [ -n "$CTID" ] || fail "nessun container installato ($STATE_FILE non c'è)"
        run_setup --certificato --ip "$(access_ip)" --https-port "$HTTPS_PORT"
        say "Nuovo certificato per $(access_ip). L'autorità locale non cambia: sul Mac non serve reinstallarla."
        ;;
    stato)
        check_proxmox
        [ -n "$CTID" ] || fail "nessun container installato ($STATE_FILE non c'è)"
        pct status "$CTID"
        print_instructions
        ;;
    *) fail "comando sconosciuto: $1 (installa, aggiorna, certificato, stato)" ;;
esac
