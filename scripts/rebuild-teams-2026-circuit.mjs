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
const discovered = fs.existsSync(path.join(outDir, "teams-discovered.json"))
  ? JSON.parse(fs.readFileSync(path.join(outDir, "teams-discovered.json"), "utf8"))
  : [];
const registryText = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-team-registry.ts"), "utf8");

function registryStub(slug) {
  const esc = slug.replace(/-/g, "\\-");
  const block =
    registryText.match(new RegExp(`"${esc}"\\s*:\\s*\\{([\\s\\S]*?)\\n  \\}`, "m")) ??
    registryText.match(new RegExp(`${esc}\\s*:\\s*\\{([\\s\\S]*?)\\n  \\}`, "m"));
  if (!block) return null;
  const body = block[1];
  const pick = (k) => body.match(new RegExp(`${k}:\\s*"([^"]+)"`))?.[1];
  const roster = [...(body.match(/roster:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return {
    slug,
    name: pick("name") ?? slug,
    tag: pick("tag") ?? slug.slice(0, 3).toUpperCase(),
    region: pick("region") ?? "GLOBAL",
    country: pick("country") ?? "",
    earnings: 0,
    rank: 99,
    rankChange: 0,
    form: [],
    liquipediaPage: pick("liquipediaPage") ?? slug,
    logoFile: null,
    roster,
  };
}

const bySlug = new Map(allTeams.map((t) => [t.slug, t]));
for (const d of discovered) bySlug.set(d.slug, { ...bySlug.get(d.slug), ...d });

const picked = [];
for (const slug of [...slugs].sort()) {
  if (bySlug.has(slug)) {
    picked.push(bySlug.get(slug));
    continue;
  }
  const stub = registryStub(slug);
  if (stub) {
    picked.push(stub);
    continue;
  }
  picked.push({
    slug,
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    tag: slug.slice(0, 3).toUpperCase(),
    region: "GLOBAL",
    country: "",
    earnings: 0,
    rank: 99,
    rankChange: 0,
    form: [],
    liquipediaPage: slug,
    logoFile: null,
    roster: [],
  });
}
picked.sort((a, b) => a.name.localeCompare(b.name));
const missing = [...slugs].filter((s) => !allTeams.some((t) => t.slug === s) && !registryStub(s));

console.log(`Active slugs: ${slugs.size}`);
console.log(`Matched in teams.json: ${picked.filter((t) => bySlug.has(t.slug)).length}`);
console.log(`Stubs from registry: ${picked.filter((t) => registryStub(t.slug)).length}`);
if (missing.length) console.log(`Still missing meta: ${missing.join(", ")}`);

if (WRITE) {
  fs.writeFileSync(path.join(outDir, "teams-2026.json"), JSON.stringify(picked, null, 0));
  fs.writeFileSync(
    path.join(outDir, "team-slugs.json"),
    JSON.stringify(picked.map((t) => t.slug).sort(), null, 0),
  );
  console.log("Wrote teams-2026.json, team-slugs.json");
}
