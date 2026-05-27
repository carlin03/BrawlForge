import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { liquipediaCommonsUrl } from "./liquipedia-commons.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genDir = path.join(__dirname, "..", "src", "lib", "data", "generated");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(genDir, name), "utf8"));
}

export const ALL_TEAM_SLUGS = readJson("team-slugs-all.json");
export const TEAMS_CATALOG = readJson("teams.json");
export const TOURNAMENTS_CATALOG = readJson("tournaments.json");

/** slug → liquipedia commons CDN URL from catalog logoFile */
export const CATALOG_TEAM_LOGO_URLS = Object.fromEntries(
  TEAMS_CATALOG.filter((t) => t.logoFile).map((t) => [t.slug, liquipediaCommonsUrl(t.logoFile)]),
);

export const TEAM_TAGS = Object.fromEntries(TEAMS_CATALOG.map((t) => [t.slug, t.tag || t.slug.slice(0, 3).toUpperCase()]));

/** slug → liquipedia commons URL for tournaments */
export const CATALOG_TOURNAMENT_LOGO_URLS = Object.fromEntries(
  TOURNAMENTS_CATALOG.filter((t) => t.logoFile).map((t) => [t.slug, liquipediaCommonsUrl(t.logoFile)]),
);

export async function resolveLiquipediaApiUrl(logoFile) {
  const title = `File:${logoFile.replace(/ /g, "_")}`;
  const apiUrl = `https://liquipedia.net/brawlstars/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}`;
  const res = await fetch(apiUrl, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) return null;
  const data = await res.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
}
