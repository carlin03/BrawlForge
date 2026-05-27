/** Remote logo CDN fallbacks — NO liquipedia.net wiki pages in UI */
import teamSlugs from "./generated/team-slugs-all.json";
import allTeams from "./generated/teams.json";
import type { GeneratedTeam } from "./catalog-types";

export const TAIYORO_LOGOS: Record<string, string> = {
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
  "toxic-lotus": "https://taiyoro-prod-media.s3.amazonaws.com/team/5xKkvo8Z4w.png",
  "papara-supermassive": "https://taiyoro-prod-media.s3.amazonaws.com/team/JICOezSHuS.png",
  "bc-gaming-sa": "https://taiyoro-prod-media.s3.amazonaws.com/team/u8Z4JbKnQW.png",
  qlash: "https://taiyoro-prod-media.s3.amazonaws.com/team/djojUxS93I.png",
  skcalalas: "https://taiyoro-prod-media.s3.amazonaws.com/team/fsHB1i6l6W.png",
};

export const ORG_OFFICIAL_LOGOS: Record<string, string> = {
  "bounty-hunters-esports":
    "https://dcdn-us.mitiendanube.com/stores/005/755/160/themes/common/logo-1895168094-1754889616-f340878967c6d193071f9fd53738e9821754889616.png",
  "eternal-esports": "https://www.eternalesports.org/assets/img/logo/logo-transperent.png",
  "only-realm": "https://unavatar.io/x/OnlyRealmgg",
};

export const ROYALEAPI_LOGOS: Record<string, string> = {
  skcalalas: "https://cdn.royaleapi.com/static/img/team/logo/skcalalas.png",
  qlash: "https://cdn.royaleapi.com/static/img/team/logo/qlash.png",
  "crazy-raccoon": "https://cdn.royaleapi.com/static/img/team/logo/crazy-raccoon.png",
  "sk-gaming": "https://cdn.royaleapi.com/static/img/team/logo/sk-gaming.png",
  "tribe-gaming": "https://cdn.royaleapi.com/static/img/team/logo/tribe-gaming.png",
  loud: "https://cdn.royaleapi.com/static/img/team/logo/loud.png",
  "team-heretics": "https://cdn.royaleapi.com/static/img/team/logo/team-heretics.png",
  "totem-esports": "https://cdn.royaleapi.com/static/img/team/logo/totem-esports.png",
  "zeta-division": "https://cdn.royaleapi.com/static/img/team/logo/zeta-division.png",
  "spacestation-gaming": "https://cdn.royaleapi.com/static/img/team/logo/spacestation-gaming.png",
  "stmn-esports": "https://cdn.royaleapi.com/static/img/team/logo/stmn-esports.png",
};

export const WIKIMEDIA_LOGOS: Record<string, string> = {
  "crazy-raccoon": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Crazy_Raccoon_2021_allmode.png",
  "sk-gaming": "https://upload.wikimedia.org/wikipedia/commons/6/6d/SK_Gaming_2022_lightmode.png",
  hmble: "https://upload.wikimedia.org/wikipedia/commons/0/0b/HMBLE_2024_lightmode.png",
  "tribe-gaming": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Tribe_Gaming_allmode.png",
  "fut-esports": "https://upload.wikimedia.org/wikipedia/commons/2/20/FUT_Esports_2024_allmode.png",
  "totem-esports": "https://upload.wikimedia.org/wikipedia/commons/3/34/Totem_Esports_allmode.png",
  loud: "https://upload.wikimedia.org/wikipedia/commons/8/8b/LOUD_allmode.png",
  "stmn-esports": "https://upload.wikimedia.org/wikipedia/commons/1/1e/STMN_Esports_allmode.png",
  "team-heretics": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Team_Heretics_2022_allmode.png",
  "novo-esports": "https://upload.wikimedia.org/wikipedia/commons/0/04/NOVO_Esports_2024_allmode.png",
  "zeta-division": "https://upload.wikimedia.org/wikipedia/commons/4/4f/ZETA_DIVISION_lightmode.png",
  "revenant-xspark": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Revenant_XSpark_2026_allmode.png",
  "natus-vincere": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Natus_Vincere_2021_lightmode.png",
  "spacestation-gaming": "https://upload.wikimedia.org/wikipedia/commons/8/80/Spacestation_Gaming_allmode.png",
  reject: "https://upload.wikimedia.org/wikipedia/commons/2/20/REJECT_2020_lightmode.png",
};

const LIQUIPEDIA_FILES: Record<string, string> = {
  "papara-supermassive": "Papara_SuperMassive_Aug_2023_full_lightmode.png",
  skcalalas: "SKCalalas_allmode.png",
  qlash: "QLASH_allmode.png",
  "bounty-hunters-esports": "Bounty_Hunters_Esports_full_lightmode.png",
  "only-realm": "Only_Realm_allmode.png",
  "eternal-esports": "Eternal_Esports_2026_allmode.png",
  "toxic-lotus": "Toxic_Lotus_lightmode.png",
  "ace-xero": "Ace_Xero_allmode.png",
  "bc-gaming-sa": "BC_Gaming_lightmode.png",
};

function liquipediaCommonsUrl(filename: string): string {
  return `https://liquipedia.net/commons/images/${filename[0]}/${filename.slice(0, 2)}/${filename}`;
}

export const LIQUIPEDIA_COMMONS_LOGOS: Record<string, string> = Object.fromEntries(
  Object.entries(LIQUIPEDIA_FILES).map(([slug, file]) => [slug, liquipediaCommonsUrl(file)]),
);

/** All catalog logoFile entries from Liquipedia sync */
export const CATALOG_TEAM_LOGO_URLS: Record<string, string> = Object.fromEntries(
  (allTeams as GeneratedTeam[])
    .filter((t) => t.logoFile)
    .map((t) => [t.slug, liquipediaCommonsUrl(t.logoFile!)]),
);

export const FAVICON_LOGOS: Record<string, string> = {
  "bc-gaming-sa": "https://icons.duckduckgo.com/ip3/berlincityclub.com.ico",
};

export const ALL_TEAM_SLUGS: readonly string[] = teamSlugs as string[];

export function buildRemoteLogoChain(slug: string): string[] {
  const chain: string[] = [];
  if (TAIYORO_LOGOS[slug]) chain.push(TAIYORO_LOGOS[slug]);
  if (ORG_OFFICIAL_LOGOS[slug]) chain.push(ORG_OFFICIAL_LOGOS[slug]);
  if (ROYALEAPI_LOGOS[slug]) chain.push(ROYALEAPI_LOGOS[slug]);
  if (WIKIMEDIA_LOGOS[slug]) chain.push(WIKIMEDIA_LOGOS[slug]);
  if (CATALOG_TEAM_LOGO_URLS[slug]) chain.push(CATALOG_TEAM_LOGO_URLS[slug]);
  if (LIQUIPEDIA_COMMONS_LOGOS[slug]) chain.push(LIQUIPEDIA_COMMONS_LOGOS[slug]);
  if (FAVICON_LOGOS[slug]) chain.push(FAVICON_LOGOS[slug]);
  return [...new Set(chain)];
}

export function getBestRemoteLogo(slug: string): string | undefined {
  return buildRemoteLogoChain(slug)[0];
}

export const TEAM_LOGOS: Record<string, string> = Object.fromEntries(
  ALL_TEAM_SLUGS.filter((slug) => getBestRemoteLogo(slug)).map((slug) => [slug, getBestRemoteLogo(slug)!]),
);
