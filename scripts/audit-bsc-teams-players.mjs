import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const all = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/players.json"), "utf8"));
const slugs = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/team-slugs.json"), "utf8"));
const teams = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/teams.json"), "utf8"));

const ALIASES = {
  "ninguem-segura": "alguem-segura",
  "f-a-kaioperro": "kaioperro",
  fennel: "abc-ea-team",
};

function resolveTeam(ts) {
  const n = (ts || "").toLowerCase();
  return ALIASES[n] ?? n;
}

for (const t of slugs) {
  const ps = all.filter((p) => resolveTeam(p.teamSlug) === t);
  const roster = teams.find((x) => x.slug === t)?.roster ?? [];
  console.log(`${t}: catalog=${ps.length} roster=${roster.length} [${ps.map((p) => p.slug).join(", ")}]`);
}
