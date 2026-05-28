#!/usr/bin/env node
/** En Vercel/CI no descargamos miles de logos (falla o excede tiempo). En local es opcional. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.VERCEL === "1" || process.env.CI === "true" || process.env.SKIP_LOGO_DOWNLOAD === "1") {
  console.log("[postinstall] Omitido download-logos (Vercel/CI). La app usa logos remotos.");
  process.exit(0);
}

const r = spawnSync(process.execPath, [join(root, "scripts", "ensure-bsc-logo.mjs")], {
  stdio: "inherit",
  cwd: root,
});
process.exit(r.status ?? 0);
