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

function extractOpponentName(raw) {
  if (!raw) return "";
  const teamOpp = raw.match(/\{\{TeamOpponent\|([^}|\n]+)/i);
  if (teamOpp) return teamOpp[1].trim();
  const team = raw.match(/\{\{Team\|([^}|\n]+)/i);
  if (team) return team[1].trim();
  return raw
    .replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\{\{[^}]+\}\}/g, "")
    .trim();
}

function countSeriesWinsFromMaps(chunk) {
  let winsA = 0;
  let winsB = 0;
  const mapBlocks = chunk.match(/\|map\d+\s*=\s*\{\{Map[\s\S]*?(?=\|map\d+\s*=|\}\})/gi) ?? [];
  for (const block of mapBlocks) {
    const s1 = Number(block.match(/\|score1\s*=\s*(\d+)/i)?.[1] ?? NaN);
    const s2 = Number(block.match(/\|score2\s*=\s*(\d+)/i)?.[1] ?? NaN);
    if (Number.isNaN(s1) || Number.isNaN(s2)) continue;
    if (s1 > s2) winsA++;
    else if (s2 > s1) winsB++;
  }
  return { winsA, winsB };
}

/** Parse {{Match}} rows (Liquipedia BSC 2026 — opponent1/opponent2 + map scores). */
export function parseMatchesFromWikitext(wikitext, tournamentSlug, region, resolveTeam, liquipediaPage) {
  const out = [];
  const today = new Date().toISOString().slice(0, 10);
  const chunks = wikitext.split(/\{\{Match\b/i).slice(1);

  for (const chunk of chunks) {
    const opp1Raw = chunk.match(/\|opponent1\s*=\s*([^\n]+)/i)?.[1] ?? "";
    const opp2Raw = chunk.match(/\|opponent2\s*=\s*([^\n]+)/i)?.[1] ?? "";
    const t1 = extractOpponentName(opp1Raw);
    const t2 = extractOpponentName(opp2Raw);
    if (!t1 || !t2) continue;

    const teamASlug = resolveTeam(t1);
    const teamBSlug = resolveTeam(t2);
    if (!teamASlug || !teamBSlug || teamASlug === teamBSlug) continue;

    const fields = {};
    const fieldRe = /\|([a-zA-Z0-9_]+)\s*=\s*([^\n|]*)/g;
    let fm;
    const header = chunk.slice(0, 900);
    while ((fm = fieldRe.exec(header)) !== null) {
      fields[fm[1].toLowerCase()] = fm[2].trim();
    }

    let scoreA = Number(fields.score1 ?? fields.opponent1score ?? NaN);
    let scoreB = Number(fields.score2 ?? fields.opponent2score ?? NaN);
    const fromMaps = countSeriesWinsFromMaps(chunk);
    if (fromMaps.winsA + fromMaps.winsB > 0) {
      scoreA = fromMaps.winsA;
      scoreB = fromMaps.winsB;
    }
    if (Number.isNaN(scoreA)) scoreA = 0;
    if (Number.isNaN(scoreB)) scoreB = 0;

    let date = (fields.date || fields.datetime || fields.matchdate || "").replace(/\{\{[^}]+\}\}/g, "").trim();
    date = date.replace(/ - /, "T").replace(/ /g, "T").slice(0, 19);
    if (date && !date.includes("T")) date += "T12:00:00";
    if (!date) date = `${today}T12:00:00`;
    if (!date.endsWith("Z")) date += "Z";

    const hasResult = scoreA + scoreB > 0 && scoreA !== scoreB;
    const finished = fields.finished === "true" || hasResult;
    const status = finished ? "finished" : date.slice(0, 10) > today ? "upcoming" : scoreA + scoreB > 0 ? "finished" : "upcoming";

    const stage = cleanLabel(
      fields.round || fields.roundname || fields.stage || fields.tab || fields.title || "Match",
    );
    const bestof = fields.bestof || fields.bo || "";
    const id = `lp-${tournamentSlug}-${teamASlug}-vs-${teamBSlug}-${date.slice(0, 10)}`.replace(/[^a-z0-9-]/gi, "-");
    const lpPage = liquipediaPage ? String(liquipediaPage).replace(/^\/+/, "") : null;
    const lpUrl = lpPage ? `https://liquipedia.net/brawlstars/${lpPage}` : null;

    out.push({
      id,
      teamASlug,
      teamBSlug,
      scoreA,
      scoreB,
      tournamentSlug,
      stage,
      date,
      status,
      region,
      format: bestof ? `Bo${bestof}` : "Bo5",
      meta: {
        schedule_trust: "confirmed",
        team_display: { a: t1, b: t2 },
        ...(lpPage ? { liquipedia_page: lpPage, liquipedia_url: lpUrl, data_source: "liquipedia" } : {}),
      },
    });
  }
  return out;
}

/** Nombres Liquipedia → slug BrawlForge */
const LIQUIPEDIA_TEAM_ALIASES = {
  "big talents": "big",
  navi: "natus-vincere",
  "natus vincere": "natus-vincere",
  hmble: "hmble",
  "fut esports": "fut-esports",
  "fut esports academy": "fut-esports-academy",
  "sk gaming": "sk-gaming",
  "team heretics": "team-heretics",
  "crazy raccoon": "crazy-raccoon",
  "zeta division": "zeta-division",
  "tribe gaming": "tribe-gaming",
  "only realm": "only-realm",
  "bounty hunters esports": "bounty-hunters-esports",
  "bounty hunters": "bounty-hunters-esports",
  madrid: "madridmira",
  "madrid mira": "madridmira",
  "totem esports": "totem-esports",
  "novo esports": "novo-esports",
  "eternal esports": "eternal-esports",
  "revenant xspark": "revenant-xspark",
  "ace xero": "ace-xero",
  "toxic lotus": "toxic-lotus",
  "bc* gaming sa": "bc-gaming-sa",
  "bc gaming sa": "bc-gaming-sa",
  "stmn esports": "stmn-esports",
  "zoos esports": "f-a-homeless",
  loud: "loud",
  reject: "reject",
};

export function buildTeamResolver(teams) {
  const map = new Map();
  for (const t of teams) {
    map.set(t.slug, t.slug);
    map.set(t.name.toLowerCase(), t.slug);
    map.set(t.tag.toLowerCase(), t.slug);
    map.set(pageToSlug(t.name), t.slug);
    map.set(pageToSlug(t.liquipediaPage?.replace(/_/g, " ") || t.name), t.slug);
  }
  for (const [alias, slug] of Object.entries(LIQUIPEDIA_TEAM_ALIASES)) {
    if (map.has(slug) || teams.some((t) => t.slug === slug)) map.set(alias, slug);
  }
  return (name) => {
    const clean = name.replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
    const key = clean.toLowerCase();
    if (map.has(key)) return map.get(key);
    const slug = pageToSlug(clean.replace(/\*/g, ""));
    if (map.has(slug)) return map.get(slug);
    return map.get(slug) ?? slug;
  };
}
