#!/usr/bin/env node
/** En Vercel/CI no descargamos miles de logos (falla o excede tiempo). En local es opcional. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const onVercel =
  process.env.SKIP_LOGO_DOWNLOAD === "1" ||
  process.env.VERCEL === "1" ||
  !!process.env.VERCEL_ENV ||
  !!process.env.VERCEL_URL ||
  process.env.CI === "true" ||
  process.env.CI === "1";

if (onVercel) {
  console.log("[postinstall] Skip en Vercel/CI — logos remotos (bsc-2026.png ya está en el repo).");
  process.exit(0);
}

for (const script of ["ensure-bsc-logo.mjs", "sync-bsc-tournament-logos.mjs"]) {
  const args = [join(root, "scripts", script)];
  if (script.includes("tournament")) args.push("--force");
  const r = spawnSync(process.execPath, args, { stdio: "inherit", cwd: root });
  if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1);
}
process.exit(0);
