/**
 * Genera plantillas CSV en data/import/ desde el catálogo BSC del repo.
 * Edítalas en Excel / Google Sheets y vuelve a importar con npm run supabase:import:csv
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { objectsToCsv } from "./lib/catalog-csv.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "data", "import");

function parseActiveSlugs() {
  const src = readFileSync(resolve(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
  const block = src.match(/BSC_2026_ACTIVE_TEAM_SLUGS[^[]*\[([\s\S]*?)\]\s*as const/)?.[1] ?? "";
  return [...block.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

function parseRosters() {
  const src = readFileSync(resolve(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
  const out = {};
  for (const m of src.matchAll(/"([a-z0-9-]+)":\s*\[([^\]]+)\]/g)) {
    const players = [...m[2].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
    out[m[1]] = players;
  }
  return out;
}

function parseRegions() {
  const src = readFileSync(resolve(root, "src/lib/data/bsc-2026-team-regions.ts"), "utf8");
  const out = {};
  for (const m of src.matchAll(/"([a-z0-9-]+)":\s*"(EMEA|EA|NA|SA|GLOBAL|CN)"/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

function parseRegistry() {
  const src = readFileSync(resolve(root, "src/lib/data/bsc-2026-team-registry.ts"), "utf8");
  const out = {};
  const blocks = src.split(/\n  [a-z"\/-]+: \{/);
  for (const block of blocks) {
    const slugM = block.match(/^([a-z0-9-]+)/);
    if (!slugM) continue;
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const tag = block.match(/tag:\s*"([^"]+)"/)?.[1];
    const region = block.match(/region:\s*"([^"]+)"/)?.[1];
    const country = block.match(/country:\s*"([^"]+)"/)?.[1];
    if (name) out[slugM[1]] = { name, tag, region, country };
  }
  return out;
}

const teams2026 = JSON.parse(
  readFileSync(resolve(root, "src/lib/data/generated/teams-2026.json"), "utf8"),
);
const players2026 = JSON.parse(
  readFileSync(resolve(root, "src/lib/data/generated/players-2026.json"), "utf8"),
);
const teamBySlug = new Map(teams2026.map((t) => [t.slug, t]));
const rosters = parseRosters();
const regions = parseRegions();
const registry = parseRegistry();
const activeSlugs = parseActiveSlugs();

const teamObjects = activeSlugs.map((slug) => {
  const t = teamBySlug.get(slug);
  const reg = registry[slug];
  const roster = rosters[slug] ?? t?.roster ?? [];
  return {
    slug,
    name: reg?.name ?? t?.name ?? slug,
    tag: reg?.tag ?? t?.tag ?? "",
    region: regions[slug] ?? reg?.region ?? t?.region ?? "GLOBAL",
    country: reg?.country ?? t?.country ?? "",
    earnings: t?.earnings ?? 0,
    rank: t?.rank ?? "",
    rank_change: t?.rankChange ?? 0,
    description: `${reg?.name ?? t?.name ?? slug} — circuito BSC 2026`,
    logo_url: "",
    roster_slugs: roster.join("|"),
  };
});

const playerSlugs = new Set();
const playerObjects = [];
for (const p of players2026) {
  if (!p.slug || !p.ign) continue;
  if (!p.teamSlug || !activeSlugs.includes(p.teamSlug)) continue;
  if (playerSlugs.has(p.slug)) continue;
  playerSlugs.add(p.slug);
  playerObjects.push({
    slug: p.slug,
    ign: String(p.ign).replace(/<!--[\s\S]*?-->/g, "").trim(),
    real_name: p.realName ?? "",
    team_slug: p.teamSlug ?? "",
    region: regions[p.teamSlug] ?? p.region ?? "GLOBAL",
    role: p.role ?? "Player",
    status: (p.status ?? "active").toLowerCase(),
    fantasy_points: p.fantasyPoints ?? 70,
    fantasy_ownership: p.fantasyOwnership ?? 20,
    rating: p.rating ?? 1,
    bio: "",
    photo_url: "",
  });
}

mkdirSync(outDir, { recursive: true });

writeFileSync(
  resolve(outDir, "teams.csv"),
  objectsToCsv(
    [
      "slug",
      "name",
      "tag",
      "region",
      "country",
      "earnings",
      "rank",
      "rank_change",
      "description",
      "logo_url",
      "roster_slugs",
    ],
    teamObjects,
  ),
);

writeFileSync(
  resolve(outDir, "players.csv"),
  objectsToCsv(
    [
      "slug",
      "ign",
      "real_name",
      "team_slug",
      "region",
      "role",
      "status",
      "fantasy_points",
      "fantasy_ownership",
      "rating",
      "bio",
      "photo_url",
    ],
    playerObjects,
  ),
);

writeFileSync(
  resolve(outDir, "news.csv"),
  objectsToCsv(
    [
      "slug",
      "title",
      "excerpt",
      "body",
      "category",
      "published_at",
      "author",
      "read_minutes",
      "cover_accent",
      "related_teams",
      "related_tournament",
      "hot",
    ],
    [
      {
        slug: "ejemplo-noticia",
        title: "Título de la noticia",
        excerpt: "Resumen corto que aparece en la lista",
        body: "Primer párrafo del artículo.|||Segundo párrafo (usa ||| entre párrafos).",
        category: "Esports",
        published_at: "2026-05-29",
        author: "BrawlForge",
        read_minutes: 3,
        cover_accent: "gold",
        related_teams: "sk-gaming|hmble",
        related_tournament: "bsc-2026-brawl-cup",
        hot: "false",
      },
    ],
  ),
);

console.log(`Plantillas en ${outDir}`);
console.log(`  teams.csv    → ${teamObjects.length} equipos BSC`);
console.log(`  players.csv  → ${playerObjects.length} jugadores`);
console.log(`  news.csv     → ejemplo + cabeceras`);
console.log("\nEdita en Excel/Sheets → Guardar como CSV UTF-8 → npm run supabase:import:csv");
