/**
 * Liquipedia MediaWiki API helpers (gzip required — see api-terms-of-use).
 */
import https from "node:https";
import zlib from "node:zlib";

const API = "https://liquipedia.net/brawlstars/api.php";
const UA = "BrawlForge/1.0 (local esports data sync; not for redistribution)";

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function apiGet(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": UA, "Accept-Encoding": "gzip" } }, (res) => {
        const chunks = [];
        const stream = res.headers["content-encoding"] === "gzip" ? res.pipe(zlib.createGunzip()) : res;
        stream.on("data", (c) => chunks.push(c));
        stream.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch {
            reject(new Error(`JSON parse failed HTTP ${res.statusCode}`));
          }
        });
        stream.on("error", reject);
      })
      .on("error", reject);
  });
}

/** Paginate category members */
export async function fetchCategoryMembers(categoryTitle, delayMs = 300) {
  const all = [];
  let cmcontinue;
  do {
    const params = {
      action: "query",
      list: "categorymembers",
      cmtitle: categoryTitle,
      cmlimit: "500",
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    const data = await apiGet(params);
    all.push(...(data.query?.categorymembers ?? []));
    cmcontinue = data.continue?.cmcontinue;
    if (cmcontinue) await sleep(delayMs);
  } while (cmcontinue);
  return all;
}

/** Batch-fetch wikitext for up to 50 titles */
export async function fetchWikitextBatch(titles) {
  if (!titles.length) return {};
  const params = {
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    titles: titles.join("|"),
  };
  const data = await apiGet(params);
  const out = {};
  for (const page of Object.values(data.query?.pages ?? {})) {
    if (page.missing !== undefined) continue;
    const text = page.revisions?.[0]?.slots?.main?.["*"] ?? "";
    out[page.title] = text;
    if (page.title) out[page.title.replace(/ /g, "_")] = text;
  }
  return out;
}

export function pageToSlug(title) {
  return title
    .replace(/\//g, "-")
    .replace(/ /g, "-")
    .replace(/_/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseInfoboxFields(wikitext) {
  const fields = {};
  const re = /\|([a-zA-Z0-9_]+)\s*=\s*([^\n|]*(?:\n(?!\|)[^\n|]*)*)/g;
  const box = wikitext.match(/\{\{Infobox (team|player|league)[\s\S]*?\n\}\}/i)?.[0] ?? wikitext.slice(0, 4000);
  let m;
  while ((m = re.exec(box)) !== null) {
    const raw = m[2].trim().replace(/\{\{[^}]+\}\}/g, "").replace(/<!--[\s\S]*?-->/g, "");
    fields[m[1].toLowerCase()] = raw.split("\n")[0].trim();
  }
  return fields;
}

function cleanWikiValue(raw) {
  return String(raw || "")
    .replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\[https?:\/\/[^\s\]]+\s+([^\]]+)\]/gi, "$1")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")[0]
    .trim();
}

function extractInfoboxBlock(wikitext) {
  const start = wikitext.search(/\{\{Infobox\s+league/i);
  if (start < 0) return wikitext.slice(0, 6000);
  let depth = 0;
  let i = start;
  while (i < wikitext.length) {
    if (wikitext.slice(i, i + 2) === "{{") {
      depth++;
      i += 2;
      continue;
    }
    if (wikitext.slice(i, i + 2) === "}}") {
      depth--;
      i += 2;
      if (depth === 0) return wikitext.slice(start, i);
      continue;
    }
    i++;
  }
  return wikitext.slice(start, start + 12000);
}

/** Campos de {{Infobox league}} — torneos BSC en Liquipedia */
export function parseLeagueInfobox(wikitext) {
  const box = extractInfoboxBlock(wikitext);
  const fields = parseInfoboxFields(box);
  const usd = Number(String(fields.prizepoolusd || fields.usdprize || "0").replace(/[^0-9.]/g, ""));
  const prizePool =
    usd > 0
      ? `$${usd.toLocaleString("en-US")}`
      : fields.prizepool || fields.prize || fields.localprize || "";

  let location = "Online";
  if (fields.type?.toLowerCase() === "offline") {
    const parts = [fields.city, fields.country].filter(Boolean).map(cleanWikiValue);
    location = parts.length ? parts.join(", ") : cleanWikiValue(fields.venue) || "Offline";
  } else if (fields.country) {
    location = cleanWikiValue(fields.country);
  }

  const prizeBreakdown = [];
  for (let n = 1; n <= 16; n++) {
    const place = fields[`place${n}`] || (n === 1 && fields.place ? fields.place : "");
    const prize = fields[`usdprize${n}`] || fields[`prize${n}`] || (n === 1 && fields.usdprize ? fields.usdprize : "");
    if (!place && !prize) continue;
    const usdP = Number(String(prize).replace(/[^0-9.]/g, ""));
    prizeBreakdown.push({
      place: cleanWikiValue(place) || `${n}º`,
      prize: usdP > 0 ? `$${usdP.toLocaleString("en-US")}` : cleanWikiValue(prize),
    });
  }

  const winnerRaw = cleanWikiValue(fields.winner || fields.first || "");
  const winnerPage = winnerRaw.replace(/_/g, " ").trim();

  return {
    name: cleanWikiValue(fields.name || fields.tickername || ""),
    shortName: cleanWikiValue(fields.shortname || fields.tickername || ""),
    prizePool: prizePool || undefined,
    startDate: cleanWikiValue(fields.sdate || fields.startdate || ""),
    endDate: cleanWikiValue(fields.edate || fields.enddate || ""),
    location,
    city: cleanWikiValue(fields.city || ""),
    country: cleanWikiValue(fields.country || ""),
    venue: cleanWikiValue(fields.venue || ""),
    type: cleanWikiValue(fields.type || ""),
    format: cleanWikiValue(fields.format || ""),
    organizer: [fields.organizer, fields.organizer2].filter(Boolean).map(cleanWikiValue).join(" · "),
    liquipediaTier: Number(fields.liquipediatier || fields.tier || 0) || undefined,
    teamCount: Number(fields.team_number || fields.teamnumber || 0) || undefined,
    series: cleanWikiValue(fields.series || ""),
    website: cleanWikiValue(fields.web || fields.website || ""),
    winnerPage: winnerPage || undefined,
    prizeBreakdown,
  };
}

export function liquipediaCommonsUrl(filename) {
  const f = filename.trim().replace(/ /g, "_");
  return `https://liquipedia.net/commons/images/${f[0]}/${f.slice(0, 2)}/${f}`;
}

/** Resolve File: page → direct CDN URL via MediaWiki API */
export async function resolveCommonsImageUrl(filename) {
  if (!filename) return null;
  const fileTitle = `File:${filename.trim().replace(/ /g, "_")}`;
  const data = await apiGet({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url",
  });
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
}

const REGION_MAP = {
  europe: "EMEA",
  emea: "EMEA",
  "north america": "NA",
  na: "NA",
  "south america": "SA",
  sa: "SA",
  "east asia": "EA",
  ea: "EA",
  asia: "EA",
  china: "EA",
  "chinese mainland": "EA",
  global: "GLOBAL",
  international: "GLOBAL",
};

export function mapRegion(raw) {
  if (!raw) return "GLOBAL";
  const key = raw.toLowerCase().trim();
  return REGION_MAP[key] ?? (key.includes("america") && key.includes("south") ? "SA" : key.includes("america") ? "NA" : "EMEA");
}

export function inferRegionFromCountry(country) {
  if (!country) return "GLOBAL";
  const c = country.toLowerCase();
  if (/(brazil|argentina|chile|peru|colombia|mexico|uruguay|paraguay|ecuador|bolivia|venezuela)/.test(c)) return "SA";
  if (/(japan|korea|china|taiwan|hong kong)/.test(c)) return "EA";
  if (/(united states|canada|usa)/.test(c)) return "NA";
  if (c.includes("south america")) return "SA";
  return "EMEA";
}

export function tournamentStatus(sdate, edate) {
  const today = new Date().toISOString().slice(0, 10);
  if (!sdate) return "upcoming";
  if (edate && edate < today) return "finished";
  if (sdate > today) return "upcoming";
  if (edate && edate >= today) return "live";
  if (sdate <= today) return "live";
  return "upcoming";
}

export function isYear2026(dateStr) {
  return Boolean(dateStr && String(dateStr).startsWith("2026"));
}

export function cleanLabel(s) {
  return String(s || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")[0]
    .trim();
}

/** Extract team names from Liquipedia wikitext */
export function parseParticipantTeams(wikitext) {
  const names = new Set();
  const patterns = [
    /\{\{Team(?:Opponent|Card)?\s*\|\s*([^|\}\n]+)/gi,
    /\{\{Team\s*\|\s*([^|\}\n]+)/gi,
    /\|team\d\s*=\s*([^\n|]+)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(wikitext)) !== null) {
      const raw = m[1].replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
      if (raw && raw.length > 1 && !/^(TBD|tbd|None)$/i.test(raw)) names.add(raw);
    }
  }
  return [...names];
}

/** Parse match rows from wikitext */
export function parseMatchesFromWikitext(wikitext, tournamentSlug, region, resolveTeam) {
  const out = [];
  const today = new Date().toISOString().slice(0, 10);
  const chunks = wikitext.split(/\{\{Match2?/i).slice(1);
  for (const chunk of chunks) {
    const fields = {};
    const re = /\|([a-zA-Z0-9_]+)\s*=\s*([^\n|]*)/g;
    let m;
    const slice = chunk.slice(0, 1200);
    while ((m = re.exec(slice)) !== null) {
      fields[m[1].toLowerCase()] = m[2].trim();
    }
    const t1 = fields.team1 || fields.team1score?.team1;
    const t2 = fields.team2;
    if (!t1 || !t2) continue;
    const teamASlug = resolveTeam(t1);
    const teamBSlug = resolveTeam(t2);
    if (!teamASlug || !teamBSlug) continue;
    const scoreA = Number(fields.score1 ?? fields.team1score ?? 0) || 0;
    const scoreB = Number(fields.score2 ?? fields.team2score ?? 0) || 0;
    let date = fields.date || fields.datetime || fields.matchdate || "";
    date = date.replace(/ /g, "T").slice(0, 19);
    if (date && !date.includes("T")) date += "T12:00:00";
    if (!date) date = `${today}T12:00:00Z`;
    else if (!date.endsWith("Z")) date += "Z";
    const finished = fields.finished === "true" || (scoreA + scoreB > 0 && fields.winner);
    const status = finished ? "finished" : date.slice(0, 10) >= today ? "upcoming" : "finished";
    const id = `${tournamentSlug}-${teamASlug}-${teamBSlug}-${date.slice(0, 10)}`.replace(/[^a-z0-9-]/gi, "-");
    out.push({
      id,
      teamASlug,
      teamBSlug,
      scoreA,
      scoreB,
      tournamentSlug,
      stage: fields.round || fields.stage || fields.tab || "Match",
      date,
      status,
      region,
      format: fields.bestof ? `Bo${fields.bestof}` : "Bo3",
    });
  }
  return out;
}

export function buildTeamResolver(teams) {
  const map = new Map();
  for (const t of teams) {
    map.set(t.slug, t.slug);
    map.set(t.name.toLowerCase(), t.slug);
    map.set(t.tag.toLowerCase(), t.slug);
    map.set(pageToSlug(t.name), t.slug);
    map.set(pageToSlug(t.liquipediaPage?.replace(/_/g, " ") || t.name), t.slug);
  }
  return (name) => {
    const clean = name.replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
    const key = clean.toLowerCase();
    if (map.has(key)) return map.get(key);
    const slug = pageToSlug(clean.replace(/\*/g, ""));
    if (map.has(slug)) return map.get(slug);
    return slug;
  };
}
