#!/usr/bin/env node
/**
 * Imprime enlaces para abrir BrawlForge en el móvil (misma WiFi o túnel).
 * Uso: npm run dev:mobile   (otra terminal)
 *      npm run mobile:link
 *      npm run mobile:tunnel  (URL pública temporal)
 */
import os from "node:os";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT || 3000);
const PATH = "/m";

function lanIp() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const net of ifaces ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

function printLinks(base) {
  const url = `${base.replace(/\/$/, "")}${PATH}`;
  console.log("\n📱 Enlace móvil BrawlForge (ruta /m):\n");
  console.log(`   ${url}\n`);
  console.log("   Misma WiFi → abre en Safari/Chrome del móvil.");
  console.log("   Pantalla de inicio → Compartir → «Añadir a inicio».\n");
  return url;
}

const ip = lanIp();
if (ip) printLinks(`http://${ip}:${PORT}`);
printLinks(`http://localhost:${PORT}`);

if (process.argv.includes("--tunnel")) {
  console.log("Abriendo túnel público (localtunnel)…\n");
  const lt = spawn(
    "npx",
    ["--yes", "localtunnel", "--port", String(PORT)],
    { stdio: ["ignore", "pipe", "inherit"], shell: true },
  );
  let buf = "";
  lt.stdout.on("data", (chunk) => {
    buf += chunk.toString();
    const m = buf.match(/https:\/\/[^\s]+/);
    if (m) {
      printLinks(m[0]);
      buf = "";
    }
  });
  lt.on("close", (code) => process.exit(code ?? 0));
}
