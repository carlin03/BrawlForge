/** Build Liquipedia commons CDN URLs for team logo PNGs (not the wiki UI). */
export function liquipediaCommonsUrl(filename) {
  const a = filename[0];
  const b = filename.slice(0, 2);
  return `https://liquipedia.net/commons/images/${a}/${b}/${filename}`;
}

/** Team slug → Liquipedia commons filename */
export const LIQUIPEDIA_TEAM_LOGOS = {
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
