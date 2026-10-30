// Traduce la pipeline del giocatore in una riga di shell reale, eseguibile in bash con GNU coreutils.
// Il programma sorgente è ricostruito dall'input del livello: printf per il solo stdout,
// un gruppo { ...; } di echo quando alcune righe vanno su stderr (>&2).

const quoteArg = text => `'${text.replace(/'/g, "'\\''")}'`;

// echo è più leggibile, ma interpreterebbe opzioni come "-n" o escape: in quei casi si usa printf
const printLine = text => /^-|\\/.test(text) ? `printf '%s\\n' ${quoteArg(text)}` : `echo ${quoteArg(text)}`;

function sourceCommand(stdin) {
    const lines = normalizeInput(stdin);
    if (lines.every(line => line.fd === 1)) {
        return `printf '%s\\n' ${lines.map(line => quoteArg(line.text)).join(" ")}`;
    }
    const parts = lines.map(line => printLine(line.text) + (line.fd === 2 ? " >&2" : ""));
    return `{ ${parts.join("; ")}; }`;
}

// Il gioco ordina byte per byte: LC_ALL=C rende sort identico anche con locale italiano
function shellCommand(step) {
    const label = stepLabel(step);
    return step.cmd === "sort" ? `LC_ALL=C ${label}` : label;
}

// I reindirizzamenti si attaccano al comando precedente; gli slot vuoti vengono ignorati.
// Con separator " |\n  " si ottiene un comando per riga: bash continua dopo una pipe a fine riga.
function buildShellLine(stdin, steps, separator = " | ") {
    const segments = [sourceCommand(stdin)];
    for (const step of steps) {
        if (step.cmd === null) continue;
        if (COMMANDS[step.cmd].redirect) {
            segments[segments.length - 1] += ` ${stepLabel(step)}`;
        } else {
            segments.push(shellCommand(step));
        }
    }
    return segments.join(separator);
}
