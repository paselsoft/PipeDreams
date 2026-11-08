// Esegue una riga di bash per le verifiche: stdout e stderr separati, come righe.
// Lo stderr passa da una pipe (con lo stderr collegato a un socket, come fa Node,
// "tee /dev/stderr" non funzionerebbe) e i comandi girano in una cartella temporanea,
// così "tee copia.txt" non scrive file nel repository.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), "pipedreams-"));
process.on("exit", () => fs.rmSync(workdir, { recursive: true, force: true }));

const toLines = text => text === "" ? [] : text.replace(/\n$/, "").split("\n");

function runBash(line) {
    // Un tempo massimo: un comando bloccato non deve fermare le verifiche
    // PIPEDREAMS_DOCKER=nome: esegue dentro un container Docker (es. Alpine, per un'altra versione di coreutils)
    const docker = process.env.PIPEDREAMS_DOCKER;
    const script = `exec 2> >(cat >&2)\n${line}`;
    const real = docker
        ? spawnSync("docker", ["exec", "-w", "/tmp", docker, "bash", "-c", script], { timeout: 20000 })
        : spawnSync("bash", ["-c", script], { env: { PATH: process.env.PATH }, cwd: workdir, timeout: 10000 });
    if (real.error) return { stdout: [], stderr: [`(bash non ha risposto: ${real.error.code || real.error.message})`] };
    return { stdout: toLines(real.stdout.toString()), stderr: toLines(real.stderr.toString()) };
}

module.exports = { runBash, toLines };
