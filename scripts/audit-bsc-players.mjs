import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rostersTs = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
const p26 = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/players-2026.json"), "utf8"));
const allP = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/players.json"), "utf8"));

const byTeam = {};
const re = /(?:"([a-z0-9-]+)"|([a-z0-9-]+)):\s*\[([^\]]+)\]/g;
let m;
while ((m = re.exec(rostersTs)) !== null) {
  byTeam[m[1] || m[2]] = [...m[3].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
}

const pByTeam = {};
for (const p of p26) {
  (pByTeam[p.teamSlug] ||= []).push(p.slug);
}

console.log("=== Roster gaps (want vs players-2026) ===");
for (const [team, want] of Object.entries(byTeam).sort()) {
  const have = new Set(pByTeam[team] || []);
  const miss = want.filter((s) => !have.has(s));
  if (miss.length) console.log(team, "MISS:", miss.join(", "));
}

console.log("\n=== In players.json on BSC team but not in bsc-2026-rosters ===");
const bscTeams = new Set(Object.keys(byTeam));
for (const p of allP) {
  if (!bscTeams.has(p.teamSlug) || /^retired/i.test(p.status || "")) continue;
  const want = new Set(byTeam[p.teamSlug] || []);
  if (!want.has(p.slug)) console.log(p.slug, "@", p.teamSlug);
}

console.log("\nplayers-2026:", p26.length);
