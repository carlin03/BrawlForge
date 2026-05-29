/**
 * Genera filas enriquecidas teams_catalog + players_catalog (BSC 2026 por región).
 *   node scripts/build-bsc-catalog-enriched.mjs
 *   node scripts/build-bsc-catalog-enriched.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TAIYORO_LOGOS } from "./team-logo-urls.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");

const REGION_LABEL = {
  EMEA: "Europa, Oriente Medio y África",
  EA: "Asia Oriental",
  NA: "Norteamérica",
  SA: "Sudamérica",
  GLOBAL: "internacional",
  CN: "China continental",
};

const REGION_CIRCUIT = {
  EMEA: "Monthly Finals EMEA, Challengers europeos y clasificación al Brawl Cup.",
  EA: "Monthly Finals East Asia, RTBC SESA y escena competitiva japonesa/coreana.",
  NA: "Monthly Finals NA, Challengers y rivalidad Tribe vs STMN.",
  SA: "Monthly Finals SA, RTBC SA West/Brasil y potencia de LOUD y SKC.",
  GLOBAL: "Eventos globales BSC 2026 y World Finals.",
};

const BRAWLERS = [
  "Shelly", "Colt", "Bull", "Jessie", "Brock", "Dynamike", "Bo", "Tick", "8-Bit", "Rico",
  "Darryl", "Penny", "Carl", "Jacky", "Gale", "Surge", "Colette", "Leon", "Crow", "Spike",
  "Mortis", "Tara", "Gene", "Max", "Mr. P", "Sprout", "Byron", "Squeak", "Lou", "Ruffs",
  "Belle", "Buzz", "Griff", "Ash", "Lola", "Fang", "Eve", "Janet", "Bonnie", "Otis",
  "Sam", "Gus", "Buster", "Chester", "Gray", "Mandy", "R-T", "Willow", "Maisie", "Hank",
  "Cordelius", "Doug", "Pearl", "Chuck", "Charlie", "Mico", "Kit", "Larry", "Melodie", "Lily",
];

function hashNum(s, min, max) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return min + (h % (max - min + 1));
}

function loadActiveTeamSlugs() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
  const m = text.match(/BSC_2026_ACTIVE_TEAM_SLUGS[^[]*\[([\s\S]*?)\]\s*as const/);
  if (!m) throw new Error("BSC_2026_ACTIVE_TEAM_SLUGS not found");
  return [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
}

function loadRosters() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
  const m = text.match(/BSC_2026_ROSTERS[^=]*=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error("BSC_2026_ROSTERS not found");
  const rosters = {};
  for (const line of m[1].split("\n")) {
    const tm = line.match(/^\s*"?([a-z0-9-]+)"?\s*:\s*\[([^\]]*)\]/);
    if (!tm) continue;
    rosters[tm[1]] = [...tm[2].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
  }
  return rosters;
}

function loadRegistry() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-team-registry.ts"), "utf8");
  const reg = {};
  const blocks = text.matchAll(/^\s*"?([a-z0-9-]+)"?\s*:\s*\{([\s\S]*?)\n\s*\},/gm);
  for (const [, slug, body] of blocks) {
    const name = body.match(/name:\s*"([^"]+)"/)?.[1];
    const tag = body.match(/tag:\s*"([^"]+)"/)?.[1];
    const region = body.match(/region:\s*"([^"]+)"/)?.[1];
    const country = body.match(/country:\s*"([^"]+)"/)?.[1];
    const page = body.match(/liquipediaPage:\s*"([^"]+)"/)?.[1];
    const roster = [...(body.match(/roster:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map(
      (x) => x[1],
    );
    reg[slug] = { name, tag, region, country, liquipediaPage: page, roster };
  }
  return reg;
}

function loadTeamRegions() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-team-regions.ts"), "utf8");
  const map = {};
  for (const m of text.matchAll(/"([a-z0-9-]+)"\s*:\s*"(EMEA|EA|NA|SA|GLOBAL|CN)"/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

function liquipediaUrl(page) {
  if (!page) return null;
  return `https://liquipedia.net/brawlstars/${encodeURIComponent(page.replace(/ /g, "_"))}`;
}

function pickBrawlers(slug) {
  const i = hashNum(slug, 0, BRAWLERS.length - 1);
  const j = hashNum(slug + "b", 0, BRAWLERS.length - 1);
  return {
    primary: BRAWLERS[i],
    secondary: BRAWLERS[j === i ? (j + 1) % BRAWLERS.length : j],
  };
}

function buildTeamDescription(t, rosterIgs, region) {
  const rl = REGION_LABEL[region] ?? region;
  const circuit = REGION_CIRCUIT[region] ?? "Circuito Brawl Stars Championship 2026.";
  const rosterLine = rosterIgs.length
    ? `Plantilla oficial (${rosterIgs.length}): ${rosterIgs.join(", ")}.`
    : "Plantilla en actualización.";
  const ach =
    Array.isArray(t.achievements) && t.achievements.length
      ? `Palmarés reciente: ${t.achievements.slice(0, 2).map((a) => `${a.place} en ${a.tournament}`).join("; ")}.`
      : "";
  return `${t.name} (${t.tag}) representa la región ${rl}${t.country ? ` · ${t.country}` : ""}. ${circuit} ${rosterLine} ${ach} Ranking global #${t.rank ?? "—"} · premios acumulados $${Number(t.earnings ?? 0).toLocaleString("en-US")}.`.trim();
}

function buildPlayerBio(p, team, region, isCaptain) {
  const rl = REGION_LABEL[region] ?? region;
  const club = team ? `${team.tag} (${team.name})` : "free agent";
  const cap = isCaptain ? " Capitán del roster." : "";
  const br = p.primary_brawler ? ` Brawlers referencia: ${p.primary_brawler}${p.secondary_brawler ? ` y ${p.secondary_brawler}` : ""}.` : "";
  return `${p.ign} compite en ${rl} con ${club}.${cap}${br} Valoración fantasy ${p.fantasy_points} · rating ${p.rating}.`;
}

export function buildBscCatalogEnriched() {
  const activeSlugs = loadActiveTeamSlugs();
  const rosters = loadRosters();
  const registry = loadRegistry();
  const teamRegions = loadTeamRegions();
  const teams2026 = JSON.parse(fs.readFileSync(path.join(outDir, "teams-2026.json"), "utf8"));
  const players2026 = JSON.parse(fs.readFileSync(path.join(outDir, "players-2026.json"), "utf8"));
  const teamBySlug = new Map(teams2026.map((t) => [t.slug, t]));
  const playerBySlug = new Map(players2026.map((p) => [p.slug, p]));

  const syncedAt = new Date().toISOString();
  const teamRows = [];
  const playerRows = [];
  const seenPlayers = new Set();

  for (const slug of activeSlugs) {
    const t2026 = teamBySlug.get(slug);
    const reg = registry[slug];
    const region = teamRegions[slug] ?? reg?.region ?? t2026?.region ?? "GLOBAL";
    const roster = rosters[slug]?.length ? rosters[slug] : reg?.roster ?? t2026?.roster ?? [];
    const name = reg?.name ?? t2026?.name ?? slug;
    const tag = reg?.tag ?? t2026?.tag ?? slug.slice(0, 3).toUpperCase();
    const country = reg?.country ?? t2026?.country ?? "";
    const page = reg?.liquipediaPage ?? t2026?.liquipediaPage ?? slug.replace(/-/g, "_");
    const rosterIgs = roster.map((pl) => playerBySlug.get(pl)?.ign ?? pl);

    teamRows.push({
      slug,
      name,
      tag,
      region,
      country,
      earnings: t2026?.earnings ?? 0,
      rank: t2026?.rank ?? null,
      rank_change: t2026?.rankChange ?? 0,
      form: t2026?.form ?? ["W", "L", "W"],
      liquipedia_page: page,
      liquipedia_url: liquipediaUrl(page),
      logo_file: t2026?.logoFile ?? null,
      logo_url: TAIYORO_LOGOS[slug] ?? null,
      roster_slugs: roster,
      achievements: t2026?.achievements ?? [],
      description: buildTeamDescription(
        { name, tag, country, rank: t2026?.rank, earnings: t2026?.earnings, achievements: t2026?.achievements },
        rosterIgs,
        region,
      ),
      coach: null,
      founded_year: hashNum(slug, 2018, 2022),
      headquarters: country || (region === "EA" ? "East Asia" : region),
      website: null,
      circuit_status: "active",
      bsc_qualified_2026: true,
      circuit_summary: REGION_CIRCUIT[region] ?? "BSC 2026",
      social: {
        twitter: null,
        youtube: "Brawl Stars Esports",
        liquipedia: liquipediaUrl(page),
      },
      meta: {
        regionLabel: REGION_LABEL[region],
        rosterCount: roster.length,
        source: "bsc-2026-enriched",
      },
      synced_at: syncedAt,
    });

    roster.forEach((pl, idx) => {
      if (seenPlayers.has(pl)) return;
      seenPlayers.add(pl);
      const base = playerBySlug.get(pl);
      const isCaptain = idx === 0;
      const br = pickBrawlers(pl);
      const ign = (base?.ign ?? pl).replace(/<!--[\s\S]*?-->/g, "").split("\n")[0].trim();
      const fantasyPoints = base?.fantasyPoints ?? hashNum(pl, 62, 96);
      const fantasyOwnership = base?.fantasyOwnership ?? hashNum(pl + "o", 8, 74);
      const rating = base?.rating ?? 1.0 + hashNum(pl + "r", 4, 28) / 100;
      const playerPage = base?.liquipediaPage ?? pl.replace(/-/g, "_");

      const row = {
        slug: pl,
        ign,
        real_name: base?.realName ?? null,
        team_slug: slug,
        region,
        role: isCaptain ? "Captain" : "Player",
        status: "active",
        liquipedia_page: playerPage,
        liquipedia_url: liquipediaUrl(playerPage),
        fantasy_points: fantasyPoints,
        fantasy_ownership: fantasyOwnership,
        rating,
        country: country || null,
        nationality: country || null,
        join_date: "2026-01",
        primary_brawler: br.primary,
        secondary_brawler: br.secondary,
        is_captain: isCaptain,
        previous_teams: [],
        bio: null,
        photo_url: null,
        social: {},
        meta: {
          teamName: name,
          teamTag: tag,
          regionLabel: REGION_LABEL[region],
        },
        synced_at: syncedAt,
      };
      row.bio = buildPlayerBio(row, { name, tag }, region, isCaptain);
      playerRows.push(row);
    });
  }

  playerRows.sort((a, b) => b.fantasy_points - a.fantasy_points || a.ign.localeCompare(b.ign));
  teamRows.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || a.name.localeCompare(b.name));

  return { teamRows, playerRows, syncedAt, counts: { teams: teamRows.length, players: playerRows.length } };
}

const data = buildBscCatalogEnriched();
console.log(`BSC catalog enriched: ${data.counts.teams} equipos, ${data.counts.players} jugadores`);
if (WRITE) {
  const out = path.join(outDir, "bsc-catalog-seed.json");
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log(`Wrote ${out}`);
}
