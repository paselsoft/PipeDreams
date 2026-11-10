// Sezione LPI: gli obiettivi d'esame di LPIC-1 (101 e 102) e Linux Essentials con il loro peso,
// il link alla lezione ufficiale in italiano e i comandi indicati dagli obiettivi.
// Fonti (consultate il 9/11/2026): learning.lpi.org/it (titoli italiani, link e PDF delle lezioni)
// e wiki.lpi.org (pesi e comandi degli obiettivi). Le lezioni sono del Linux Professional Institute,
// con licenza CC BY-NC-ND 4.0: qui ci sono solo titoli e link, nessun testo delle lezioni.
// cmds e note sono la parte di Pipe Dreams: i comandi del gioco che allenano l'obiettivo e una
// nota scritta da noi. Dopo ogni modifica: node tools/check-lpi.js
const LPI_SOURCE = {
    checked: "2026-11-09",
    license: "CC BY-NC-ND 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/4.0/deed.it",
    portal: "https://learning.lpi.org/it/",
    objectivesUrl: { lpic: "https://wiki.lpi.org/wiki/LPIC-1_Objectives_V5.0", le: "https://wiki.lpi.org/wiki/Linux_Essentials_Objectives_V1.6" },
    newEssentials: "https://learning.lpi.org/it/learning-materials/010-200/"
};

const LPI_EXAMS = [
    {
        id: "101-500",
        name: "LPIC-1 · esame 101",
        version: "5.0",
        pdf: "https://learning.lpi.org/pdfstore/LPI-Learning-Material-101-500-it.pdf",
        url: "https://learning.lpi.org/it/learning-materials/101-500/",
        objectives: [
            {
                id: "101.1",
                title: "Determinare e Configurare le Impostazioni dell'Hardware",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/101/101.1/",
                lessons: 1,
                terms: ["/sys/", "/proc/", "/dev/", "modprobe", "lsmod", "lspci", "lsusb"]
            },
            {
                id: "101.2",
                title: "Avviare il sistema",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/101/101.2/",
                lessons: 1,
                terms: ["dmesg", "journalctl", "BIOS", "UEFI", "bootloader", "kernel", "initramfs", "init", "SysVinit", "systemd"]
            },
            {
                id: "101.3",
                title: "Modificare runlevel / target di avvio e spegnere o riavviare il sistema",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/101/101.3/",
                lessons: 1,
                terms: ["/etc/inittab", "shutdown", "init", "/etc/init.d/", "telinit", "systemd", "systemctl", "/etc/systemd/", "/usr/lib/systemd/", "wall"]
            },
            {
                id: "102.1",
                title: "Progettare il layout del disco rigido",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/102/102.1/",
                lessons: 1,
                terms: ["/ (root) filesystem", "/var filesystem", "/home filesystem", "/boot filesystem", "EFI System Partition (ESP)", "swap space", "mount points", "partitions"]
            },
            {
                id: "102.2",
                title: "Installare un boot manager",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/102/102.2/",
                lessons: 1,
                terms: ["menu.lst", "grub.cfg and grub.conf", "grub-install", "grub-mkconfig", "MBR"]
            },
            {
                id: "102.3",
                title: "Gestire le librerie condivise",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/101-500/102/102.3/",
                lessons: 1,
                terms: ["ldd", "ldconfig", "/etc/ld.so.conf", "LD_LIBRARY_PATH"]
            },
            {
                id: "102.4",
                title: "Utilizzare la gestione dei pacchetti Debian",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/102/102.4/",
                lessons: 1,
                terms: ["/etc/apt/sources.list", "dpkg", "dpkg-reconfigure", "apt-get", "apt-cache"]
            },
            {
                id: "102.5",
                title: "Utilizzare la gestione dei pacchetti RPM e YUM",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/102/102.5/",
                lessons: 1,
                terms: ["rpm", "rpm2cpio", "/etc/yum.conf", "/etc/yum.repos.d/", "yum", "zypper"]
            },
            {
                id: "102.6",
                title: "Linux come sistema virtualizzato",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/101-500/102/102.6/",
                lessons: 1,
                terms: ["Virtual machine", "Linux container", "Application container", "Guest drivers", "SSH host keys", "D-Bus machine id"]
            },
            {
                id: "103.1",
                title: "Lavorare con la Command Line",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.1/",
                lessons: 2,
                terms: ["bash", "echo", "env", "export", "pwd", "set", "unset", "type", "which", "man", "uname", "history", ".bash_history", "Quoting"],
                cmds: [],
                note: "Nel gioco: la modalità terminale ⌨️ (scrivere i comandi, le virgolette, ↑↓ per la cronologia) e le pagine man. Quoting, variabili e PATH invece vanno provati in un terminale vero."
            },
            {
                id: "103.2",
                title: "Elaborare flussi di testo utilizzando i filtri",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.2/",
                lessons: 1,
                terms: ["bzcat", "cat", "cut", "head", "less", "md5sum", "nl", "od", "paste", "sed", "sha256sum", "sha512sum", "sort", "split", "tail", "tr", "uniq", "wc", "xzcat", "zcat"],
                cmds: ["cut", "head", "tail", "nl", "paste", "sed", "upper", "sort", "tr", "squeeze", "uniq", "wc", "wcw", "wcc"],
                note: "È il cuore di Pipe Dreams: quasi tutti i filtri dell'obiettivo sono comandi del gioco. Restano da studiare od, split, i checksum e i comandi per i file compressi."
            },
            {
                id: "103.3",
                title: "Eseguire la gestione di base dei file",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.3/",
                lessons: 2,
                terms: ["cp", "find", "mkdir", "mv", "ls", "rm", "rmdir", "touch", "tar", "cpio", "dd", "file", "gzip", "gunzip", "bzip2", "bunzip2", "xz", "unxz", "file globbing"]
            },
            {
                id: "103.4",
                title: "Utilizzare flussi, pipe e reindirizzamenti",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.4/",
                lessons: 2,
                terms: ["tee", "xargs"],
                cmds: ["devnull", "merge", "tee", "xargs"],
                note: "Ogni livello è una pipe; 2>/dev/null, 2>&1, tee e xargs sono nel gioco. Da studiare: i reindirizzamenti verso file (>, >>, <) e il here document (<<)."
            },
            {
                id: "103.5",
                title: "Creare, controllare e terminare i processi",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.5/",
                lessons: 2,
                terms: ["&", "bg", "fg", "jobs", "kill", "nohup", "ps", "top", "free", "uptime", "pgrep", "pkill", "killall", "watch", "screen", "tmux"]
            },
            {
                id: "103.6",
                title: "Modificare le priorità di esecuzione del processo",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.6/",
                lessons: 1,
                terms: ["nice", "ps", "renice", "top"]
            },
            {
                id: "103.7",
                title: "Cercare file di testo utilizzando espressioni regolari",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.7/",
                lessons: 2,
                terms: ["grep", "egrep", "fgrep", "sed", "regex(7)"],
                cmds: ["grep", "sed"],
                note: "grep e sed -E con le espressioni regolari sono nel gioco (nel gioco grep cerca testo semplice). Da studiare: egrep, fgrep, grep -E e le classi come [[:digit:]]."
            },
            {
                id: "103.8",
                title: "Modifica base di un file",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/103/103.8/",
                lessons: 1,
                terms: ["vi", "/", "?", "h", "j", "k", "l", "i", "o", "a", "d", "p", "y", "dd", "yy", "ZZ", ":w!", ":q!", "EDITOR"]
            },
            {
                id: "104.1",
                title: "Creare partizioni e filesystem",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/104/104.1/",
                lessons: 1,
                terms: ["fdisk", "gdisk", "parted", "mkfs", "mkswap"]
            },
            {
                id: "104.2",
                title: "Mantenere l'integrità dei filesystem",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/104/104.2/",
                lessons: 1,
                terms: ["du", "df", "fsck", "e2fsck", "mke2fs", "tune2fs", "xfs_repair", "xfs_fsr", "xfs_db"]
            },
            {
                id: "104.3",
                title: "Verificare il montaggio e lo smontaggio dei filesystem",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/104/104.3/",
                lessons: 1,
                terms: ["/etc/fstab", "/media/", "mount", "umount", "blkid", "lsblk"]
            },
            {
                id: "104.5",
                title: "Gestire le autorizzazioni e la proprietà dei file",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/101-500/104/104.5/",
                lessons: 1,
                terms: ["chmod", "umask", "chown", "chgrp"]
            },
            {
                id: "104.6",
                title: "Creare e modificare collegamenti hard e soft",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/104/104.6/",
                lessons: 1,
                terms: ["ln", "ls"]
            },
            {
                id: "104.7",
                title: "Trovare i file di sistema e collocarli nella posizione corretta",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/101-500/104/104.7/",
                lessons: 1,
                terms: ["find", "locate", "updatedb", "whereis", "which", "type", "/etc/updatedb.conf", "Objectives: Exam 102"]
            }
        ]
    },
    {
        id: "102-500",
        name: "LPIC-1 · esame 102",
        version: "5.0",
        pdf: "https://learning.lpi.org/pdfstore/LPI-Learning-Material-102-500-it.pdf",
        url: "https://learning.lpi.org/it/learning-materials/102-500/",
        objectives: [
            {
                id: "105.1",
                title: "Personalizzare e utilizzare l'ambiente di shell",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/105/105.1/",
                lessons: 3,
                terms: [".", "source", "/etc/bash.bashrc", "/etc/profile", "env", "export", "set", "unset", "~/.bash_profile", "~/.bash_login", "~/.profile", "~/.bashrc", "~/.bash_logout", "function", "alias"]
            },
            {
                id: "105.2",
                title: "Personalizzare o scrivere semplici script",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/105/105.2/",
                lessons: 2,
                terms: ["for", "while", "test", "if", "read", "seq", "exec", "||", "&&"],
                cmds: [],
                note: "Il gioco non scrive script: prova if, for, while e test nel container, partendo dalle pipeline dei livelli."
            },
            {
                id: "106.1",
                title: "Installare e configurare X11",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/102-500/106/106.1/",
                lessons: 1,
                terms: ["/etc/X11/xorg.conf", "/etc/X11/xorg.conf.d/", "~/.xsession-errors", "xhost", "xauth", "DISPLAY", "X"]
            },
            {
                id: "106.2",
                title: "Desktop grafici",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/102-500/106/106.2/",
                lessons: 1,
                terms: ["KDE", "Gnome", "Xfce", "X11", "XDMCP", "VNC", "Spice", "RDP"]
            },
            {
                id: "106.3",
                title: "Accessibilità",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/102-500/106/106.3/",
                lessons: 1,
                terms: ["High Contrast/Large Print Desktop Themes.", "Screen Reader.", "Braille Display.", "Screen Magnifier.", "On-Screen Keyboard.", "Sticky/Repeat keys.", "Slow/Bounce/Toggle keys.", "Mouse keys.", "Gestures.", "Voice recognition."]
            },
            {
                id: "107.1",
                title: "Gestire account utente e gruppo e file di sistema correlati",
                weight: 5,
                url: "https://learning.lpi.org/it/learning-materials/102-500/107/107.1/",
                lessons: 2,
                terms: ["/etc/passwd", "/etc/shadow", "/etc/group", "/etc/skel/", "chage", "getent", "groupadd", "groupdel", "groupmod", "passwd", "useradd", "userdel", "usermod"]
            },
            {
                id: "107.2",
                title: "Automatizzare le attività di amministrazione del sistema attraverso la pianificazione",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/107/107.2/",
                lessons: 2,
                terms: ["/etc/cron.{d", "daily", "hourly", "monthly", "weekly}/", "/etc/at.deny", "/etc/at.allow", "/etc/crontab", "/etc/cron.allow", "/etc/cron.deny", "/var/spool/cron/", "crontab", "at", "atq", "atrm", "systemctl", "systemd-run"]
            },
            {
                id: "107.3",
                title: "Localizzazione e internazionalizzazione",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/102-500/107/107.3/",
                lessons: 1,
                terms: ["/etc/timezone", "/etc/localtime", "/usr/share/zoneinfo/", "LC_*", "LC_ALL", "LANG", "TZ", "/usr/bin/locale", "tzselect", "timedatectl", "date", "iconv", "UTF-8", "ISO-8859", "ASCII", "Unicode"]
            },
            {
                id: "108.1",
                title: "Mantenere l'orario di sistema",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/102-500/108/108.1/",
                lessons: 2,
                terms: ["/usr/share/zoneinfo/", "/etc/timezone", "/etc/localtime", "/etc/ntp.conf", "/etc/chrony.conf", "date", "hwclock", "timedatectl", "ntpd", "ntpdate", "chronyc", "pool.ntp.org"]
            },
            {
                id: "108.2",
                title: "Logging di sistema",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/108/108.2/",
                lessons: 2,
                terms: ["/etc/rsyslog.conf", "/var/log/", "logger", "logrotate", "/etc/logrotate.conf", "/etc/logrotate.d/", "journalctl", "systemd-cat", "/etc/systemd/journald.conf", "/var/log/journal/"]
            },
            {
                id: "108.3",
                title: "Concetti base dei Mail Transfer Agent (MTA)",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/102-500/108/108.3/",
                lessons: 1,
                terms: ["~/.forward", "sendmail emulation layer commands", "newaliases", "mail", "mailq", "postfix", "sendmail", "exim"]
            },
            {
                id: "108.4",
                title: "Gestire stampa e stampanti",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/102-500/108/108.4/",
                lessons: 1,
                terms: ["CUPS configuration files", "tools and utilities", "/etc/cups/", "lpd legacy interface (lpr", "lprm", "lpq)"]
            },
            {
                id: "109.1",
                title: "Fondamenti dei protocolli Internet",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/109/109.1/",
                lessons: 2,
                terms: ["/etc/services", "IPv4", "IPv6", "Subnetting", "TCP", "UDP", "ICMP"]
            },
            {
                id: "109.2",
                title: "Configurazione di rete persistente",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/109/109.2/",
                lessons: 2,
                terms: ["/etc/hostname", "/etc/hosts", "/etc/nsswitch.conf", "/etc/resolv.conf", "nmcli", "hostnamectl", "ifup", "ifdown"]
            },
            {
                id: "109.3",
                title: "Risoluzione dei problemi di base di una rete",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/109/109.3/",
                lessons: 2,
                terms: ["ip", "hostname", "ss", "ping", "ping6", "traceroute", "traceroute6", "tracepath", "tracepath6", "netcat", "ifconfig", "netstat", "route"]
            },
            {
                id: "109.4",
                title: "Configurare un client DNS",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/102-500/109/109.4/",
                lessons: 1,
                terms: ["/etc/hosts", "/etc/resolv.conf", "/etc/nsswitch.conf", "host", "dig", "getent"]
            },
            {
                id: "110.1",
                title: "Eseguire attività di amministrazione della sicurezza",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/102-500/110/110.1/",
                lessons: 1,
                terms: ["find", "passwd", "fuser", "lsof", "nmap", "chage", "netstat", "sudo", "/etc/sudoers", "su", "usermod", "ulimit", "who", "w", "last"]
            },
            {
                id: "110.2",
                title: "Configurare la sicurezza dell'host",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/102-500/110/110.2/",
                lessons: 1,
                terms: ["/etc/nologin", "/etc/passwd", "/etc/shadow", "/etc/xinetd.d/", "/etc/xinetd.conf", "systemd.socket", "/etc/inittab", "/etc/init.d/", "/etc/hosts.allow", "/etc/hosts.deny"]
            },
            {
                id: "110.3",
                title: "Proteggere i dati con la crittografia",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/102-500/110/110.3/",
                lessons: 2,
                terms: ["ssh", "ssh-keygen", "ssh-agent", "ssh-add", "~/.ssh/id_rsa and id_rsa.pub", "~/.ssh/id_dsa and id_dsa.pub", "~/.ssh/id_ecdsa and id_ecdsa.pub", "~/.ssh/id_ed25519 and id_ed25519.pub", "/etc/ssh/ssh_host_rsa_key and ssh_host_rsa_key.pub", "/etc/ssh/ssh_host_dsa_key and ssh_host_dsa_key.pub", "/etc/ssh/ssh_host_ecdsa_key and ssh_host_ecdsa_key.pub", "/etc/ssh/ssh_host_ed25519_key and ssh_host_ed25519_key.pub", "~/.ssh/authorized_keys", "ssh_known_hosts", "gpg", "gpg-agent", "~/.gnupg/", "Future Change Considerations", "Future changes to the objective will/may include:", "Remove ifup/ifdown and legacy net-tools command", "Remove TCP wrappers"]
            }
        ]
    },
    {
        id: "010-160",
        name: "Linux Essentials",
        version: "1.6",
        pdf: "https://learning.lpi.org/pdfstore/LPI-Learning-Material-010-160-it.pdf",
        url: "https://learning.lpi.org/it/learning-materials/010-160/",
        objectives: [
            {
                id: "1.1",
                title: "Evoluzione di Linux e Sistemi Operativi più Diffusi",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/1/1.1/",
                lessons: 1,
                terms: ["Debian", "Ubuntu (LTS)", "CentOS", "openSUSE", "Red Hat", "SUSE", "Linux Mint", "Scientific Linux", "Raspberry Pi", "Raspbian", "Android"]
            },
            {
                id: "1.2",
                title: "Principali Applicazioni Open Source",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/1/1.2/",
                lessons: 1,
                terms: ["OpenOffice.org", "LibreOffice", "Thunderbird", "Firefox", "GIMP", "Nextcloud", "ownCloud", "Apache HTTPD", "NGINX", "MariaDB", "MySQL", "NFS", "Samba", "C", "Java", "JavaScript", "Perl", "shell", "Python", "PHP", "dpkg", "apt-get", "rpm", "yum"]
            },
            {
                id: "1.3",
                title: "Software e Licenze Open Source",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/010-160/1/1.3/",
                lessons: 1,
                terms: ["Copyleft", "Permissive", "GPL", "BSD", "Creative Commons", "Free Software", "Open Source Software", "FOSS", "FLOSS", "Open source business models"]
            },
            {
                id: "1.4",
                title: "Competenze ICT - Lavorare con Linux",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/1/1.4/",
                lessons: 1,
                terms: ["Using a browser", "privacy concerns", "configuration options", "searching the web and saving content", "Terminal and console", "Password issues", "Privacy issues and tools", "Use of common open source applications in presentations and projects"]
            },
            {
                id: "2.1",
                title: "Nozioni di Base sulla Command Line",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/010-160/2/2.1/",
                lessons: 2,
                terms: ["Bash", "echo", "history", "PATH environment variable", "export", "type"],
                cmds: [],
                note: "Nel gioco: la modalità terminale ⌨️ e la riga di shell equivalente sotto ogni pipeline."
            },
            {
                id: "2.2",
                title: "Utilizzo della Command Line per Ottenere Aiuto",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/2/2.2/",
                lessons: 1,
                terms: ["man", "info", "/usr/share/doc/", "locate"],
                cmds: [],
                note: "Nel gioco: le pagine man di ogni comando (pulsante 📄 man, o man sort nel terminale) e comando --help."
            },
            {
                id: "2.3",
                title: "Utilizzo di Directory e Elenchi di File",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/2/2.3/",
                lessons: 2,
                terms: ["Common options for ls", "Recursive listings", "cd", ".", "and", "..", "home and ~"]
            },
            {
                id: "2.4",
                title: "Creazione, Spostamento ed Eliminazione di File",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/2/2.4/",
                lessons: 1,
                terms: ["mv", "cp", "rm", "touch", "mkdir", "rmdir"]
            },
            {
                id: "3.1",
                title: "Archiviazione dei File sulla Command Line",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/3/3.1/",
                lessons: 1,
                terms: ["tar", "Common tar options", "gzip", "bzip2", "xz", "zip", "unzip"]
            },
            {
                id: "3.2",
                title: "Ricerca ed Estrazione di Dati dai File",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/010-160/3/3.2/",
                lessons: 2,
                terms: ["grep", "less", "cat", "head", "tail", "sort", "cut", "wc"],
                cmds: ["grep", "sort", "cut", "wc", "head", "tail"],
                note: "Tutti i comandi dell'obiettivo sono nel gioco, tranne less e cat. Anche le pipe e i reindirizzamenti di questo obiettivo si allenano nei livelli."
            },
            {
                id: "3.3",
                title: "Trasformare i Comandi in uno Script",
                weight: 4,
                url: "https://learning.lpi.org/it/learning-materials/010-160/3/3.3/",
                lessons: 2,
                terms: ["#! (shebang)", "/bin/bash", "Variables", "Arguments", "for loops", "echo", "Exit status"]
            },
            {
                id: "4.1",
                title: "Scelta di un Sistema Operativo",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/010-160/4/4.1/",
                lessons: 1,
                terms: ["GUI versus command line", "desktop configuration", "Maintenance cycles", "beta and stable"]
            },
            {
                id: "4.2",
                title: "Comprendere l'Hardware del Computer",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/4/4.2/",
                lessons: 1,
                terms: ["Motherboards", "processors", "power supplies", "optical drives", "peripherals", "Hard drives", "solid state disks and partitions", "/dev/sd*", "Drivers"]
            },
            {
                id: "4.3",
                title: "Dove Sono Memorizzati i Dati",
                weight: 3,
                url: "https://learning.lpi.org/it/learning-materials/010-160/4/4.3/",
                lessons: 2,
                terms: ["ps", "top", "free", "syslog", "dmesg", "/etc/", "/var/log/", "/boot/", "/proc/", "/dev/", "/sys/"]
            },
            {
                id: "4.4",
                title: "Il Tuo Computer in Rete",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/4/4.4/",
                lessons: 1,
                terms: ["route", "ip route show", "ifconfig", "ip addr show", "netstat", "ss", "/etc/resolv.conf", "/etc/hosts", "IPv4", "IPv6", "ping", "host"]
            },
            {
                id: "5.1",
                title: "Sicurezza di Base e Identificazione dei Tipi di Utente",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/5/5.1/",
                lessons: 1,
                terms: ["/etc/passwd", "/etc/shadow", "/etc/group", "id", "last", "who", "w", "sudo", "su"]
            },
            {
                id: "5.2",
                title: "Creazione di Utenti e Gruppi",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/5/5.2/",
                lessons: 1,
                terms: ["/etc/passwd", "/etc/shadow", "/etc/group", "/etc/skel/", "useradd", "groupadd", "passwd"]
            },
            {
                id: "5.3",
                title: "Gestione delle Autorizzazioni e delle Proprietà dei File",
                weight: 2,
                url: "https://learning.lpi.org/it/learning-materials/010-160/5/5.3/",
                lessons: 1,
                terms: ["ls -l", "ls -a", "chmod", "chown"]
            },
            {
                id: "5.4",
                title: "Directory e File Speciali",
                weight: 1,
                url: "https://learning.lpi.org/it/learning-materials/010-160/5/5.4/",
                lessons: 1,
                terms: ["/tmp/", "/var/tmp/ and Sticky Bit", "ls -d", "ln -s", "Retrieved from \"", "https://wiki.lpi.org/w/index.php?title=Linux_Essentials_Objectives_V1.6&oldid=5896", "\"", "Navigation menu", "Page actions", "Page", "Discussion", "Read", "View source", "History", "More", "Tools", "Personal tools", "Log in", "Exam Objectives", "Linux Essentials v1.6", "Linux Essentials v2.0", "Security Essentials v1.0", "Web Development Essentials v1.0", "Open Source Essentials v1.0", "LPIC-1 v5.0", "LPIC-2 v4.5", "300 Objectives v3.0", "303 Objectives v3.0", "305 Objectives v3.0", "306 Objectives v3.0", "DevOps Tools Engineer Objectives v1.0", "DevOps Tools Engineer Objectives v2.0", "BSD Specialist Objectives v1.0", "Search", "Navigation", "Main page", "Recent changes", "LPI Website", "What links here", "Related changes", "Printable version", "Permanent link", "Page information", "This page was last edited on 4 February 2026", "at 13:33.", "About LPI Wiki", "(RLQ=window.RLQ||[]).push(function(){mw.config.set({\"wgBackendResponseTime\":108", "\"wgPageParseReport\":{\"limitreport\":{\"cputime\":\"0.033\"", "\"walltime\":\"0.036\"", "\"ppvisitednodes\":{\"value\":145", "\"limit\":1000000}", "\"revisionsize\":{\"value\":15528", "\"limit\":2097152}", "\"postexpandincludesize\":{\"value\":0", "\"templateargumentsize\":{\"value\":0", "\"expansiondepth\":{\"value\":2", "\"limit\":100}", "\"expensivefunctioncount\":{\"value\":0", "\"unstrip-depth\":{\"value\":0", "\"limit\":20}", "\"unstrip-size\":{\"value\":0", "\"limit\":5000000}", "\"timingprofile\":[\"100.00%    0.000      1 -total\"]}", "\"cachereport\":{\"timestamp\":\"20261108200131\"", "\"ttl\":86400", "\"transientcontent\":false}}});});"]
            }
        ]
    }
];
