/**
 * Regenera teams-2026.json con equipos BSC 2026 Tier B+ activos.
 *   node scripts/rebuild-teams-2026-circuit.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");

const activePath = path.join(root, "src/lib/data/bsc-2026-active-teams.ts");
const activeText = fs.readFileSync(activePath, "utf8");

function extractArray(name) {
  const re = new RegExp(`${name}[^[]*\\[([\\s\\S]*?)\\]\\s*as const`);
  const m = activeText.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/"([a-z][a-z0-9-]*)"/g)].map((x) => x[1]);
}

const slugs = new Set(extractArray("BSC_2026_ACTIVE_TEAM_SLUGS"));
for (const s of extractArray("BSC_2026_EXCLUDED_TEAM_SLUGS")) {
  slugs.delete(s);
}

const allTeams = JSON.parse(fs.readFileSync(path.join(outDir, "teams.json"), "utf8"));
const picked = allTeams.filter((t) => slugs.has(t.slug)).sort((a, b) => a.name.localeCompare(b.name));
const missing = [...slugs].filter((s) => !picked.some((t) => t.slug === s));

console.log(`Active slugs: ${slugs.size}`);
console.log(`Matched in teams.json: ${picked.length}`);
if (missing.length) console.log(`Missing catalog entries: ${missing.join(", ")}`);

if (WRITE) {
  fs.writeFileSync(path.join(outDir, "teams-2026.json"), JSON.stringify(picked, null, 0));
  fs.writeFileSync(
    path.join(outDir, "team-slugs.json"),
    JSON.stringify(picked.map((t) => t.slug).sort(), null, 0),
  );
  console.log("Wrote teams-2026.json, team-slugs.json");
}
