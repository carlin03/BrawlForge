/**
 * CSV ↔ filas Supabase (catálogo BrawlForge)
 */

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushCell();
      i++;
      continue;
    }
    if (ch === "\r" && text[i + 1] === "\n") {
      pushCell();
      pushRow();
      i += 2;
      continue;
    }
    if (ch === "\n") {
      pushCell();
      pushRow();
      i++;
      continue;
    }
    cell += ch;
    i++;
  }
  pushCell();
  pushRow();
  return rows;
}

const SKIP_SLUGS = new Set([
  "_ayuda",
  "_columna",
  "_descripcion",
  "_ejemplo",
  "ejemplo-noticia",
]);

export function shouldSkipCatalogCsvRow(obj) {
  const primary = String(obj.slug || obj.id || obj.tournament_slug || "")
    .trim()
    .toLowerCase();
  if (!primary) return true;
  if (primary.startsWith("#")) return true;
  if (SKIP_SLUGS.has(primary) || primary.startsWith("_ejemplo")) return true;
  return false;
}

export function csvToObjects(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => {
      const first = String(r[0] ?? "").trim();
      return r.some((c) => String(c).trim()) && first && !first.startsWith("#");
    })
    .map((cells) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = String(cells[idx] ?? "").trim();
      });
      return obj;
    })
    .filter((obj) => !shouldSkipCatalogCsvRow(obj));
}

export function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function objectsToCsv(headers, objects) {
  const lines = [headers.join(",")];
  for (const obj of objects) {
    lines.push(headers.map((h) => escapeCsvCell(obj[h] ?? "")).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

function splitList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[|;]/)
    .flatMap((part) => part.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

function bool(raw) {
  const x = String(raw ?? "").toLowerCase();
  return x === "1" || x === "true" || x === "sí" || x === "si" || x === "yes";
}

function parseMetaJsonOptional(raw) {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return Object.keys(parsed).length ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function parseSocialJson(raw) {
  return parseMetaJsonOptional(raw);
}

function parseAchievementsJson(raw) {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function stripUndefined(row) {
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function rowsToTeams(objects, syncedAt) {
  return objects
    .filter((o) => o.slug)
    .map((o) =>
      stripUndefined({
        slug: o.slug,
        name: o.name || o.slug,
        tag: o.tag || "",
        region: o.region || "GLOBAL",
        country: o.country || undefined,
        earnings: Number(o.earnings || 0) || 0,
        rank: o.rank ? Number(o.rank) : undefined,
        rank_change: o.rank_change ? Number(o.rank_change) : undefined,
        form: o.form ? splitList(o.form) : undefined,
        logo_file: o.logo_file || undefined,
        logo_url: o.logo_url || undefined,
        roster_slugs: o.roster_slugs ? splitList(o.roster_slugs) : undefined,
        description: o.description || undefined,
        coach: o.coach || undefined,
        founded_year: o.founded_year ? Number(o.founded_year) : undefined,
        headquarters: o.headquarters || undefined,
        website: o.website || undefined,
        circuit_summary: o.circuit_summary || undefined,
        circuit_status: o.circuit_status || undefined,
        bsc_qualified_2026: o.bsc_qualified_2026
          ? o.bsc_qualified_2026 !== "0" && o.bsc_qualified_2026 !== "false"
          : undefined,
        achievements: parseAchievementsJson(o.achievements_json),
        social: parseSocialJson(o.social_json),
        meta: parseMetaJsonOptional(o.meta_json),
        synced_at: syncedAt,
      }),
    );
}

function buildPlayerMetaFromCsv(o) {
  const fromJson = parseMetaJsonOptional(o.meta_json);
  if (fromJson) return fromJson;
  if (o.photo_url) return { photo_url: o.photo_url };
  return undefined;
}

export function rowsToPlayers(objects, syncedAt) {
  return objects
    .filter((o) => o.slug && o.ign)
    .map((o) =>
      stripUndefined({
        slug: o.slug,
        ign: o.ign,
        real_name: o.real_name || undefined,
        team_slug: o.team_slug || undefined,
        region: o.region || "GLOBAL",
        role: o.role || "Player",
        status: (o.status || "active").toLowerCase(),
        fantasy_points: o.fantasy_points ? Number(o.fantasy_points) : undefined,
        fantasy_ownership: o.fantasy_ownership ? Number(o.fantasy_ownership) : undefined,
        rating: o.rating ? Number(o.rating) : undefined,
        country: o.country || undefined,
        nationality: o.nationality || o.country || undefined,
        join_date: o.join_date || undefined,
        primary_brawler: o.primary_brawler || undefined,
        secondary_brawler: o.secondary_brawler || undefined,
        is_captain: o.is_captain ? bool(o.is_captain) : undefined,
        previous_teams: o.previous_teams ? splitList(o.previous_teams) : undefined,
        bio: o.bio || undefined,
        photo_url: o.photo_url || undefined,
        social: parseSocialJson(o.social_json),
        meta: buildPlayerMetaFromCsv(o),
        synced_at: syncedAt,
      }),
    );
}

export function rowsToNews(objects, syncedAt) {
  return objects
    .filter((o) => o.slug && o.title)
    .map((o) => ({
      slug: o.slug,
      title: o.title,
      excerpt: o.excerpt || "",
      body: o.body
        ? String(o.body)
            .split(/\|\|\|/)
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
      category: o.category || "Esports",
      published_at: o.published_at || null,
      author: o.author || "BrawlForge",
      read_minutes: Number(o.read_minutes || 3) || 3,
      cover_accent: o.cover_accent || "gold",
      related_teams: splitList(o.related_teams),
      related_tournament: o.related_tournament || null,
      hot: bool(o.hot),
      updated_at: syncedAt,
    }));
}

export function rowsToTournaments(objects, syncedAt) {
  return objects
    .filter((o) => o.slug && o.name)
    .map((o) => ({
      slug: o.slug,
      name: o.name || o.slug,
      short_name: o.short_name || null,
      region: o.region || "GLOBAL",
      prize_pool: o.prize_pool || null,
      teams_count: Number(o.teams_count || 0) || 0,
      status: o.status || "upcoming",
      start_date: o.start_date || null,
      end_date: o.end_date || null,
      location: o.location || null,
      stage: o.stage || null,
      tier: o.tier ? Number(o.tier) : null,
      logo_file: o.logo_url || o.logo_file || null,
      participant_slugs: splitList(o.participant_slugs),
      meta: {},
      synced_at: syncedAt,
    }));
}

export function rowsToTournamentRosters(objects) {
  return objects
    .filter((o) => o.tournament_slug && o.team_slug)
    .map((o) => ({
      tournament_slug: o.tournament_slug,
      team_slug: o.team_slug,
      player_slugs: splitList(o.player_slugs),
    }));
}

function parseMetaJson(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function rowsToMatches(objects, syncedAt) {
  return objects
    .filter((o) => o.id && o.tournament_slug && o.team_a_slug && o.team_b_slug && o.scheduled_at)
    .map((o) => {
      const mapOrder = splitList(o.map_order);
      const meta = parseMetaJson(o.meta_json);
      if (mapOrder.length) {
        meta.maps = { order: mapOrder, possible: mapOrder };
      }
      return {
        id: o.id,
        tournament_slug: o.tournament_slug,
        team_a_slug: o.team_a_slug,
        team_b_slug: o.team_b_slug,
        scheduled_at: o.scheduled_at,
        status: o.status || "upcoming",
        stage: o.stage || null,
        region: o.region || null,
        format: o.format || "Bo3",
        score_a: Number(o.score_a || 0) || 0,
        score_b: Number(o.score_b || 0) || 0,
        published: o.published === "" || o.published == null ? true : bool(o.published),
        meta,
        synced_at: syncedAt,
        updated_at: syncedAt,
      };
    });
}

export function rowsToFantasyMarket(objects) {
  return objects
    .filter((o) => o.tournament_slug && o.player_slug && o.team_slug)
    .map((o) => ({
      tournament_slug: o.tournament_slug,
      player_slug: o.player_slug,
      team_slug: o.team_slug,
      price: Number(o.price || 0) || 0,
      price_change: Number(o.price_change || 0) || 0,
      pick_rate: Number(o.pick_rate || 0) || 0,
      form: splitList(o.form),
      meta: {},
    }));
}
