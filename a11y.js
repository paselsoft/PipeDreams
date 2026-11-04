// Accessibilità delle finestre (menu, manuale, obiettivi...): quando una si apre il focus ci entra,
// Tab resta al suo interno, Esc la chiude e alla chiusura il focus torna dov'era.

const openDialogs = [];

const visibleOverlays = () => [...document.querySelectorAll(".menu-overlay")].filter(overlay => !overlay.hidden);

const focusableIn = root => [...root.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
    .filter(element => !element.disabled && !element.hidden && element.offsetParent !== null);

function onOverlayChange(overlay) {
    const index = openDialogs.findIndex(entry => entry.overlay === overlay);
    if (!overlay.hidden && index === -1) {
        openDialogs.push({ overlay, returnTo: document.activeElement });
        const panel = overlay.querySelector("[role=dialog]") || overlay;
        if (!panel.hasAttribute("tabindex")) panel.tabIndex = -1;
        // Dopo il disegno: il contenuto della finestra può essere appena stato creato
        requestAnimationFrame(() => { if (!overlay.hidden && !overlay.contains(document.activeElement)) panel.focus({ preventScroll: true }); });
    } else if (overlay.hidden && index !== -1) {
        const [{ returnTo }] = openDialogs.splice(index, 1);
        if (returnTo && document.contains(returnTo) && !openDialogs.length) returnTo.focus({ preventScroll: true });
    }
}

function watchOverlay(overlay) {
    if (overlay.dataset.watched) return;
    overlay.dataset.watched = "1";
    new MutationObserver(() => onOverlayChange(overlay)).observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
    if (!overlay.hidden) onOverlayChange(overlay);
}

document.querySelectorAll(".menu-overlay").forEach(watchOverlay);
// Finestre create dopo (es. le novità della versione)
new MutationObserver(mutations => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => { if (node.classList && node.classList.contains("menu-overlay")) watchOverlay(node); });
    }
}).observe(document.body, { childList: true });

document.addEventListener("keydown", event => {
    const overlays = visibleOverlays();
    if (!overlays.length) return;
    // La finestra in primo piano è l'ultima aperta
    const top = openDialogs.length ? openDialogs[openDialogs.length - 1].overlay : overlays[overlays.length - 1];
    if (event.key === "Escape") {
        event.preventDefault();
        const close = top.querySelector(".menu-close");
        if (close) close.click();
        else top.click(); // le finestre senza ✕ si chiudono toccando lo sfondo
        return;
    }
    if (event.key === "Tab") {
        const items = focusableIn(top);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!top.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});
