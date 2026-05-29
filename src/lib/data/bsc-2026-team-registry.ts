import type { Region } from "../types";

/** Metadatos BSC 2026 para equipos fuera de teams-2026 o con región/plantilla incorrecta en Liquipedia sync. */
export type Bsc2026TeamEntry = {
  name: string;
  tag: string;
  region: Region;
  country?: string;
  roster: string[];
  liquipediaPage?: string;
};

export const BSC_2026_TEAM_REGISTRY: Record<string, Bsc2026TeamEntry> = {
  madridmira: {
    name: "MadridMira",
    tag: "MAD",
    region: "EMEA",
    country: "Spain",
    roster: ["rup", "yoko", "jusorange"],
    liquipediaPage: "Madrid",
  },
  fennel: {
    name: "FENNEL",
    tag: "FEN",
    region: "EA",
    country: "Japan",
    roster: ["achapi", "i-see", "ken-g"],
    liquipediaPage: "FENNEL",
  },
  insomnia: {
    name: "INSOMNIA",
    tag: "INS",
    region: "EA",
    country: "Japan",
    roster: ["jene-azure", "koga", "wahochi"],
    liquipediaPage: "INSOMNIA",
  },
  "f-a-homeless": {
    name: "F/A Homeless",
    tag: "HML",
    region: "NA",
    country: "North America",
    roster: ["ducky", "tyrant", "xemp"],
    liquipediaPage: "F/A Homeless",
  },
  "vic-day": {
    name: "Vic Day",
    tag: "VIC",
    region: "NA",
    country: "North America",
    roster: ["belal", "ezlivi", "duckie"],
    liquipediaPage: "Vic Day",
  },
  "legacy-esports": {
    name: "Legacy Esports",
    tag: "LGC",
    region: "NA",
    country: "United States",
    roster: ["rafiki", "zoulan", "zeus"],
    liquipediaPage: "Legacy Esports",
  },
  oddyssey: {
    name: "Oddyssey",
    tag: "ODS",
    region: "SA",
    country: "South America",
    roster: ["dreww", "lipizin", "magic"],
    liquipediaPage: "Oddyssey",
  },
  "acre-lovers": {
    name: "Acre Lovers",
    tag: "AL",
    region: "SA",
    country: "South America",
    roster: ["fire-murilo", "satisfyer", "lipizin"],
    liquipediaPage: "Acre Lovers",
  },
  "f-a-zurita-gaming": {
    name: "F/A Zurita Gaming",
    tag: "FZG",
    region: "SA",
    country: "South America",
    roster: ["bryan", "exic", "jxcr"],
    liquipediaPage: "Zurita Gang",
  },
};

export const BSC_2026_REGISTRY_SLUGS = new Set(Object.keys(BSC_2026_TEAM_REGISTRY));

export function getBsc2026TeamEntry(slug: string): Bsc2026TeamEntry | undefined {
  return BSC_2026_TEAM_REGISTRY[slug.trim().toLowerCase()];
}

export function getBsc2026TeamRegion(slug: string): Region | undefined {
  return getBsc2026TeamEntry(slug)?.region;
}
