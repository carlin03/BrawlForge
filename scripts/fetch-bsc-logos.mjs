/**
 * Fetch team logos from official Supercell BSC event API + download to public/logos/
 * Run: node scripts/fetch-bsc-logos.mjs
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Our slugs → keywords to match in Supercell team names */
const TEAM_MAP = {
  "crazy-raccoon": ["crazy raccoon", "crazy-raccoon"],
  "sk-gaming": ["sk gaming", "sk-gaming"],
  hmble: ["hmble", "humble"],
  "tribe-gaming": ["tribe gaming", "tribe-gaming"],
  "fut-esports": ["fut esports", "fut-esports"],
  "totem-esports": ["totem", "reply totem"],
  loud: ["loud"],
  "stmn-esports": ["stmn", "stmn esports"],
  "team-heretics": ["heretics", "team heretics"],
  "novo-esports": ["novo"],
  "zeta-division": ["zeta"],
  "revenant-xspark": ["revenant", "xspark"],
  "natus-vincere": ["navi", "natus vincere"],
  "spacestation-gaming": ["spacestation", "ssg"],
  reject: ["reject"],
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 BrawlForge/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON"));
        }
      });
    }).on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", reject);
  });
}

function walk(obj, fn) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) walk(item, fn);
    return;
  }
  fn(obj);
  for (const v of Object.values(obj)) walk(v, fn);
}

function normalizeName(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchSlug(teamObj) {
  const name = normalizeName(
    teamObj.name || teamObj.teamName || teamObj.displayName || teamObj.title || teamObj.shortName || ""
  );
  if (!name) return null;
  for (const [slug, keywords] of Object.entries(TEAM_MAP)) {
    if (keywords.some((k) => name.includes(k))) return slug;
  }
  return null;
}

function extractLogoUrl(teamObj) {
  const candidates = [
    teamObj.logoUrl,
    teamObj.logo,
    teamObj.imageUrl,
    teamObj.image,
    teamObj.iconUrl,
    teamObj.icon,
    teamObj.badgeUrl,
    teamObj.badge,
    teamObj.avatarUrl,
    teamObj.avatar,
    teamObj.teamLogo,
    teamObj.teamLogoUrl,
    teamObj.profileImage,
    teamObj.profileImageUrl,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && (c.startsWith("http") || c.startsWith("/"))) {
      return c.startsWith("/") ? `https://event.supercell.com${c}` : c;
    }
    if (c && typeof c === "object" && c.url) return c.url;
  }
  return null;
}

console.log("Fetching official BSC event data from Supercell...");
const events = await fetchJson("https://event.supercell.com/brawlstars/v1/event");
fs.writeFileSync(path.join(__dirname, "bsc-event.json"), JSON.stringify(events, null, 2));

const teams = [];
walk(events, (node) => {
  const slug = matchSlug(node);
  const logo = extractLogoUrl(node);
  if (slug && logo) {
    teams.push({ slug, logo, name: node.name || node.teamName || slug });
  }
});

// Deduplicate by slug (keep first)
const bySlug = new Map();
for (const t of teams) {
  if (!bySlug.has(t.slug)) bySlug.set(t.slug, t);
}

console.log(`Found ${bySlug.size} teams with logos from Supercell API`);

const dir = path.join(root, "public", "logos", "teams");
fs.mkdirSync(dir, { recursive: true });

let ok = 0;
for (const [slug, team] of bySlug) {
  const dest = path.join(dir, `${slug}.png`);
  process.stdout.write(`  ${slug}... `);
  try {
    await download(team.logo, dest);
    const size = fs.statSync(dest).size;
    if (size < 200) throw new Error("too small");
    console.log(`ok (${size}b) ← ${team.logo.slice(0, 60)}...`);
    ok++;
  } catch (e) {
    console.log(`FAIL (${e.message})`);
  }
}

// Fallback: TAIYORO CDN for missing teams
const TAIYORO = {
  "crazy-raccoon": "https://taiyoro-prod-media.s3.amazonaws.com/team_organization/4NwyTXWhWS.png",
  "sk-gaming": "https://taiyoro-prod-media.s3.amazonaws.com/team/hloCRfPjiy.png",
  hmble: "https://taiyoro-prod-media.s3.amazonaws.com/team/uN3jHnHEYY.png",
  "tribe-gaming": "https://taiyoro-prod-media.s3.amazonaws.com/team/VMrF2FfWfe.png",
  "fut-esports": "https://taiyoro-prod-media.s3.amazonaws.com/team/m4AcgzfdWQ.png",
  "totem-esports": "https://taiyoro-prod-media.s3.amazonaws.com/team/HftcHjuA5m.png",
  loud: "https://taiyoro-prod-media.s3.amazonaws.com/team/efvQ7HtKlM.png",
  "stmn-esports": "https://taiyoro-prod-media.s3.amazonaws.com/team/10h5rsV5Gs.png",
  "team-heretics": "https://taiyoro-prod-media.s3.amazonaws.com/team/przYZPwpu2.png",
  "novo-esports": "https://taiyoro-prod-media.s3.amazonaws.com/team/ewynTmwYpE.png",
  "zeta-division": "https://taiyoro-prod-media.s3.amazonaws.com/team/RXUjjDElIc.png",
  "revenant-xspark": "https://taiyoro-prod-media.s3.amazonaws.com/team/8T5KJjYJSw.png",
  "natus-vincere": "https://taiyoro-prod-media.s3.amazonaws.com/team/xbw8pWdpeS.png",
  "spacestation-gaming": "https://taiyoro-prod-media.s3.amazonaws.com/team/PhCwNiHP8K.png",
  reject: "https://taiyoro-prod-media.s3.amazonaws.com/team/bpx0uvINKC.png",
};

console.log("\nFilling missing from esports CDN...");
for (const [slug, url] of Object.entries(TAIYORO)) {
  const dest = path.join(dir, `${slug}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 200) continue;
  process.stdout.write(`  ${slug} (fallback)... `);
  try {
    await download(url, dest);
    console.log(`ok (${fs.statSync(dest).size}b)`);
    ok++;
  } catch (e) {
    console.log(`FAIL`);
  }
}

// Export discovered Supercell URLs
const exportUrls = {};
for (const [slug, team] of bySlug) exportUrls[slug] = team.logo;
fs.writeFileSync(
  path.join(__dirname, "discovered-logos.json"),
  JSON.stringify({ supercell: exportUrls, taiyoro: TAIYORO }, null, 2)
);

console.log(`\nDone. ${ok} logos in public/logos/teams/`);
