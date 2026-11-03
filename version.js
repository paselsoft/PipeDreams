// Versione del gioco, mostrata in fondo alla pagina, nel menu dei livelli e nell'editor.
// APP_VERSION si aggiorna a mano a ogni nuova funzione; APP_BUILD lo scrive il workflow di
// pubblicazione (commit e data), in locale resta "sviluppo".
const APP_VERSION = "1.0.0";
const APP_BUILD = "sviluppo";

const appVersionText = () => `Pipe Dreams v${APP_VERSION} · ${APP_BUILD === "sviluppo" ? "versione di sviluppo" : `build ${APP_BUILD}`}`;

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".app-version").forEach(element => { element.textContent = appVersionText(); });
});
