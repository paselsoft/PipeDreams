#!/bin/sh
# Installa Pipe Dreams dentro un sistema Alpine Linux (per esempio un container LXC di Proxmox):
# nginx serve il gioco in HTTPS con un certificato firmato da una piccola autorità (CA) locale,
# e la shell di root diventa bash con i comandi GNU, per provare davvero le righe di shell del gioco.
#
# Uso (come root, dentro Alpine):
#   sh pipedreams-setup.sh --ip 192.168.1.50 [--https-port 8443] [--repo URL]
#   sh pipedreams-setup.sh --aggiorna          scarica l'ultima versione del gioco
#   sh pipedreams-setup.sh --ip NUOVO_IP --certificato   nuovo certificato per un altro indirizzo
#
# --ip è l'indirizzo che scrivi nel browser (in modalità NAT quello di Proxmox, non del container).
# --https-port è la porta che usa il browser: serve per il rimando da http a https.
set -eu

REPO="https://github.com/paselsoft/PipeDreams.git"
DIR="/srv/pipedreams"
CONF="/etc/pipedreams"
IP=""
HTTPS_PORT="443"
ACTION="installa"

while [ $# -gt 0 ]; do
    case "$1" in
        --ip) IP="$2"; shift 2 ;;
        --https-port) HTTPS_PORT="$2"; shift 2 ;;
        --repo) REPO="$2"; shift 2 ;;
        --aggiorna) ACTION="aggiorna"; shift ;;
        --certificato) ACTION="certificato"; shift ;;
        *) echo "Opzione sconosciuta: $1" >&2; exit 2 ;;
    esac
done

# Comandi GNU come nelle verifiche del gioco, più ps completo (procps) e ss (iproute2-ss, pagina in iproute2-doc):
# senza, ps aux e ss sarebbero quelli ridotti di BusyBox. Pagine del manuale: mandoc è il
# comando man, man-pages le pagine generali, docs installa la documentazione (-doc) di ogni
# pacchetto installato, mandoc-apropos aggiunge man -k, apropos e whatis.
PACCHETTI="nginx openssl git bash coreutils grep sed gawk findutils diffutils less procps iproute2-ss mandoc mandoc-apropos man-pages docs iproute2-doc"

installa_pacchetti() {
    apk update >/dev/null
    # shellcheck disable=SC2086 # l'elenco va diviso in parole
    apk add --no-progress $PACCHETTI >/dev/null
    # Indice di man -k e apropos. mandoc lo rifà in background durante l'installazione, a volte
    # prima che arrivino tutte le pagine: si aspetta che finisca (al massimo 2 minuti) e lo si
    # rifà con tutte le pagine installate. Due makewhatis insieme rovinerebbero l'indice.
    attesa=0
    while pgrep -x makewhatis >/dev/null 2>&1 && [ "$attesa" -lt 120 ]; do
        sleep 1
        attesa=$((attesa + 1))
    done
    makewhatis >/dev/null 2>&1 || true
}

say() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }

aggiorna_gioco() {
    if [ -d "$DIR/.git" ]; then
        say "Aggiorno il gioco ($DIR)"
        git -C "$DIR" pull --ff-only
    else
        say "Scarico il gioco da $REPO"
        git clone --depth 1 "$REPO" "$DIR"
    fi
    say "Versione: $(sed -n 's/^const APP_VERSION = "\(.*\)";/\1/p' "$DIR/version.js")"
}

# Autorità locale (una volta sola, dura 10 anni) e certificato del server per IP (825 giorni:
# è il massimo che accettano Safari e macOS per i certificati dei siti)
certificati() {
    [ -n "$IP" ] || { echo "Serve --ip: l'indirizzo che scriverai nel browser" >&2; exit 2; }
    mkdir -p "$CONF"
    chmod 711 "$CONF"
    if [ ! -f "$CONF/ca.key" ]; then
        say "Creo l'autorità di certificazione locale"
        openssl genrsa -out "$CONF/ca.key" 2048 2>/dev/null
        openssl req -x509 -new -key "$CONF/ca.key" -sha256 -days 3650 \
            -subj "/CN=Pipe Dreams CA locale" \
            -addext "basicConstraints=critical,CA:TRUE" \
            -addext "keyUsage=critical,keyCertSign,cRLSign" \
            -out "$CONF/ca.crt"
    fi
    say "Creo il certificato per $IP"
    cat > "$CONF/server.ext" <<EOF
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = IP:$IP, DNS:pipedreams, DNS:pipedreams.local
EOF
    openssl genrsa -out "$CONF/server.key" 2048 2>/dev/null
    openssl req -new -key "$CONF/server.key" -subj "/CN=$IP" -out "$CONF/server.csr"
    openssl x509 -req -in "$CONF/server.csr" -CA "$CONF/ca.crt" -CAkey "$CONF/ca.key" -CAcreateserial \
        -days 825 -sha256 -extfile "$CONF/server.ext" -out "$CONF/server.crt" 2>/dev/null
    rm -f "$CONF/server.csr"
    chmod 644 "$CONF/ca.crt" "$CONF/server.crt"
    chmod 600 "$CONF/ca.key" "$CONF/server.key"
    echo "$IP" > "$CONF/ip"
}

configura_nginx() {
    # shellcheck disable=SC2016 # $host e $request_uri sono variabili di nginx
    if [ "$HTTPS_PORT" = "443" ]; then target='https://$host$request_uri'; else target="https://\$host:$HTTPS_PORT\$request_uri"; fi
    rm -f /etc/nginx/http.d/default.conf
    cat > /etc/nginx/http.d/pipedreams.conf <<EOF
# Pipe Dreams (creato da pipedreams-setup.sh)
server {
    listen 80 default_server;
    # Il certificato dell'autorità locale si scarica anche senza https
    location = /pipedreams-ca.crt {
        alias $CONF/ca.crt;
        default_type application/x-x509-ca-cert;
    }
    location / {
        return 301 $target;
    }
}

server {
    listen 443 ssl default_server;
    ssl_certificate $CONF/server.crt;
    ssl_certificate_key $CONF/server.key;
    root $DIR;
    index index.html;

    location ~ /\\. {
        deny all;
    }
    location = /pipedreams-ca.crt {
        alias $CONF/ca.crt;
        default_type application/x-x509-ca-cert;
    }
    location / {
        # Il gioco controlla da solo gli aggiornamenti: niente copie vecchie nella cache
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ =404;
    }
}
EOF
    grep -q "webmanifest" /etc/nginx/mime.types || sed -i 's#^}#    application/manifest+json webmanifest;\n}#' /etc/nginx/mime.types
    nginx -t
}

avvia_nginx() {
    if [ -n "${PIPEDREAMS_NO_OPENRC:-}" ]; then
        # Senza OpenRC (per esempio nelle prove in Docker)
        nginx -s reload 2>/dev/null || nginx
    else
        rc-update add nginx default >/dev/null
        rc-service nginx restart
    fi
}

# Niente «incolla protetta» (bracketed paste): passando per ssh e pct exec i suoi segnali
# arrivano spezzati e bash li legge come testo ([200~ ... ~), rompendo le righe incollate dal gioco
incolla_semplice() {
    grep -qs 'enable-bracketed-paste' /root/.inputrc || echo 'set enable-bracketed-paste off' >> /root/.inputrc
}

shell_gnu() {
    say "Shell di root: bash con i comandi GNU (come nel gioco)"
    sed -i 's#^\(root:.*:\)/bin/sh$#\1/bin/bash#' /etc/passwd
    cat > /etc/motd <<'EOF'

  Pipe Dreams - un vero Linux per provare le righe di shell del gioco.
  Copia la riga «$ ...» sotto la pipeline e incollala qui.
  I comandi sono quelli GNU (sort, sed, grep, xargs...), come nelle verifiche del gioco.

EOF
    cat > /root/.bashrc <<'EOF'
PS1='\[\e[1;32m\]\u@pipedreams\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]\$ '
EOF
    printf '[ -f ~/.bashrc ] && . ~/.bashrc\n' > /root/.bash_profile
    incolla_semplice
}

case "$ACTION" in
    aggiorna)
        say "Aggiorno i pacchetti"
        installa_pacchetti
        incolla_semplice
        aggiorna_gioco
        ;;
    certificato)
        certificati
        configura_nginx
        avvia_nginx
        ;;
    installa)
        say "Installo i pacchetti"
        installa_pacchetti
        aggiorna_gioco
        certificati
        configura_nginx
        avvia_nginx
        shell_gnu
        say "Fatto. sort è: $(sort --version | head -n 1)"
        ;;
esac
