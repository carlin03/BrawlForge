/**
 * CSV ↔ filas Supabase (teams_catalog, players_catalog, news_catalog)
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

export function csvToObjects(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((c) => String(c).trim())).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = String(cells[idx] ?? "").trim();
    });
    return obj;
  });
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

export function rowsToTeams(objects, syncedAt) {
  return objects
    .filter((o) => o.slug)
    .map((o) => ({
      slug: o.slug,
      name: o.name || o.slug,
      tag: o.tag || "",
      region: o.region || "GLOBAL",
      country: o.country || "",
      earnings: Number(o.earnings || 0) || 0,
      rank: o.rank ? Number(o.rank) : null,
      rank_change: Number(o.rank_change || 0) || 0,
      form: splitList(o.form),
      liquipedia_page: o.liquipedia_page || null,
      logo_file: o.logo_file || null,
      logo_url: o.logo_url || null,
      roster_slugs: splitList(o.roster_slugs),
      achievements: [],
      description: o.description || null,
      social: {},
      meta: {},
      synced_at: syncedAt,
    }));
}

export function rowsToPlayers(objects, syncedAt) {
  return objects
    .filter((o) => o.slug && o.ign)
    .map((o) => ({
      slug: o.slug,
      ign: o.ign,
      real_name: o.real_name || null,
      team_slug: o.team_slug || null,
      region: o.region || "GLOBAL",
      role: o.role || "Player",
      status: (o.status || "active").toLowerCase(),
      liquipedia_page: o.liquipedia_page || null,
      fantasy_points: Number(o.fantasy_points || 70) || 70,
      fantasy_ownership: Number(o.fantasy_ownership || 20) || 20,
      rating: Number(o.rating || 1) || 1,
      country: o.country || null,
      bio: o.bio || null,
      photo_url: o.photo_url || null,
      social: {},
      meta: o.photo_url ? { photo_url: o.photo_url } : {},
      synced_at: syncedAt,
    }));
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
