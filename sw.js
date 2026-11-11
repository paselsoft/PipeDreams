// Service worker: il gioco funziona anche senza connessione.
// Strategia "prima la rete": online si riceve sempre la versione pubblicata più recente (e la
// copia locale si aggiorna), offline si usa l'ultima copia salvata.
// Il workflow di pubblicazione aggiunge il commit: sw.js cambia e il browser installa la nuova versione
const CACHE = "pipedreams-v1";

const FILES = [
    "./", "index.html", "version.js", "avatars.js", "advisor.js", "backup.js", "compare.js", "training.js", "tutorial.js", "a11y.js", "community.js", "gallery.js", "stories.js", "stories-view.js", "editor.html", "style.css", "editor.css", "manifest.webmanifest", "icon-192.png", "icon-512.png",
    "commands.js", "levels.js", "solver.js", "progress.js", "shell.js", "render.js", "daily.js", "story.js", "terminal.js",
    "manual.js", "command-form.js", "fx.js", "achievements.js", "marathon.js", "share.js", "app.js", "manual-view.js", "manpage.js", "terminal-keys.js", "tutor.js", "tutor-view.js", "lpi.js", "lpi-view.js", "lpi-lesson-view.js", "lpi-lessons.js",
    "lab.js", "editor.js"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
    // Elimina le copie di versioni precedenti del service worker
    event.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
        .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
    event.respondWith(fetch(request)
        .then(response => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE).then(cache => cache.put(request, copy));
            }
            return response;
        })
        // Offline: la copia salvata, ignorando parametri come ?sfida o ?maratona
        .catch(() => caches.match(request, { ignoreSearch: true })));
});
