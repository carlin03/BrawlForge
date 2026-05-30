/** Catálogo visual Brawl Stars (CDN Brawlify — imágenes públicas). */

export type BsMapDef = {
  name: string;
  slug: string;
  mode: string;
  imageUrl: string;
};

export type BsBrawlerDef = {
  name: string;
  slug: string;
  imageUrl: string;
};

const MAP_MODES: Record<string, string> = {
  "Belle's Rock": "Bounty",
  "Bridge Too Far": "Heist",
  "Center Stage": "Bounty",
  "Double Swoosh": "Brawl Ball",
  "Flaring Phoenix": "Hot Zone",
  "Gem Fort": "Gem Grab",
  "Hard Rock Mine": "Gem Grab",
  "Hot Potato": "Hot Zone",
  "Kaboom Canyon": "Heist",
  "Layer Cake": "Brawl Ball",
  "Pinhole Punt": "Brawl Ball",
  "Safe Zone": "Hot Zone",
  "Shooting Star": "Bounty",
  "Sneaky Fields": "Brawl Ball",
  "Triple Dribble": "Brawl Ball",
  "Hot Zone": "Hot Zone",
  "Bounty": "Bounty",
  "Knockout": "Knockout",
  "Gem Grab": "Gem Grab",
  "Heist": "Heist",
  "Basket Brawl": "Basket Brawl",
};

export function slugifyBsName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function mapImageUrl(slug: string): string {
  return `https://cdn.brawlify.com/map-bgs/${slug}.png`;
}

export function brawlerImageUrl(slug: string): string {
  return `https://cdn.brawlify.com/brawlers/borders/${slug}.png`;
}

export function getMapDef(name: string): BsMapDef {
  const slug = slugifyBsName(name);
  return {
    name,
    slug,
    mode: MAP_MODES[name] ?? "Modo competitivo",
    imageUrl: mapImageUrl(slug),
  };
}

export function getBrawlerDef(name: string): BsBrawlerDef {
  const slug = slugifyBsName(name);
  return {
    name,
    slug,
    imageUrl: brawlerImageUrl(slug),
  };
}

export const BS_MAP_CATALOG: BsMapDef[] = [
  "Belle's Rock",
  "Bridge Too Far",
  "Center Stage",
  "Double Swoosh",
  "Flaring Phoenix",
  "Gem Fort",
  "Hard Rock Mine",
  "Hot Potato",
  "Kaboom Canyon",
  "Layer Cake",
  "Pinhole Punt",
  "Safe Zone",
  "Shooting Star",
  "Sneaky Fields",
  "Triple Dribble",
  "Hot Zone",
  "Bounty",
  "Knockout",
  "Gem Grab",
  "Heist",
].map(getMapDef);

export const BS_BRAWLER_CATALOG: BsBrawlerDef[] = [
  "Kit",
  "Cordelius",
  "Mico",
  "Surge",
  "Charlie",
  "Gray",
  "Buster",
  "Melodie",
  "Angelo",
  "Lily",
  "Kenji",
  "Draco",
  "Shelly",
  "Colt",
  "Spike",
  "Leon",
  "Crow",
  "Poco",
  "Emz",
  "Grom",
].map(getBrawlerDef);
