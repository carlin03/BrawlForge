/**
 * Regenera teams-2026.json con todos los equipos del circuito BSC 2026.
 *   node scripts/rebuild-teams-2026-circuit.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");

/** Mantener en sync con src/lib/data/bsc-2026-circuit-teams.ts */
const CURATED = [
  "hmble", "fut-esports", "tribe-gaming", "zeta-division", "crazy-raccoon", "only-realm",
  "bounty-hunters-esports", "ace-xero", "bc-gaming-sa", "eternal-esports", "revenant-xspark", "toxic-lotus",
  "sk-gaming", "team-heretics", "natus-vincere", "totem-esports", "novo-esports", "metizport", "big",
  "big-talents", "kebap", "papara-supermassive", "qlash", "oddyssey", "reject", "fut-esports-academy",
  "stmn-esports", "nova-esports", "spacestation-gaming", "vatic-esports", "zoos-esports", "team-elektros",
  "skcalalas", "skcalalas-na", "loud", "elevate", "oddyssey", "zurita-gang", "olimpo-squad", "acre-lovers",
];

const SKIP = new Set([
  "february", "march", "april", "may", "june", "july", "august",
  "bsc-2026-brawl-cup", "bsc-2026-psi-emea", "bsc-2026-psi-ea", "bsc-2026-psi-na", "bsc-2026-psi-sa",
  "world-finals-2026", "bsc-2026-s3-emea-mf", "bsc-2026-s3-ea-mf", "bsc-2026-s3-na-mf",
]);

const slugs = new Set(CURATED);
const fantasyPath = path.join(root, "src/lib/data/bsc-fantasy-participants.ts");
const fantasyText = fs.readFileSync(fantasyPath, "utf8");
for (const m of fantasyText.matchAll(/"([a-z][a-z0-9-]*)"/g)) {
  const s = m[1];
  if (SKIP.has(s) || s.startsWith("bsc-2026-")) continue;
  slugs.add(s);
}
slugs.delete("oddyssey-eu");
slugs.add("oddyssey");

const discPath = path.join(outDir, "bsc-2026-circuit-teams.json");
if (fs.existsSync(discPath)) {
  const disc = JSON.parse(fs.readFileSync(discPath, "utf8"));
  for (const s of disc.teamSlugs || []) {
    if (s !== "toc-team") slugs.add(s);
  }
}

const allTeams = JSON.parse(fs.readFileSync(path.join(outDir, "teams.json"), "utf8"));
const picked = allTeams.filter((t) => slugs.has(t.slug)).sort((a, b) => a.name.localeCompare(b.name));
const missing = [...slugs].filter((s) => !picked.some((t) => t.slug === s));

console.log(`Circuit slugs: ${slugs.size}`);
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
