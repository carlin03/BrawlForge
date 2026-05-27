import { getPlayer } from "./players";
import { getPlayerPrice, type MarketPlayer } from "./fantasy";

export type FantasyRole = "Carry" | "Support" | "Aggro" | "Control" | "Sniper";

const ROLE_MAP: Record<string, FantasyRole> = {
  moya: "Carry",
  tensai: "Control",
  milkreo: "Support",
  yoshi: "Aggro",
  ope: "Carry",
  joker: "Sniper",
  lukii: "Carry",
  boss: "Aggro",
  symantec: "Support",
  lxffy: "Carry",
  rbm: "Control",
  zeus: "Support",
  nowy297: "Aggro",
  meow: "Sniper",
  gero: "Control",
  response: "Carry",
  "sergeant-clash": "Aggro",
  x9jay: "Support",
  kaiodog: "Carry",
  edinho: "Control",
  firecrow: "Support",
  pain: "Aggro",
  tacos: "Sniper",
  levi: "Carry",
  sizuku: "Control",
  sitetampo: "Support",
  bobby: "Carry",
  patchy: "Aggro",
  sans: "Support",
  prozy: "Sniper",
  cauebr: "Carry",
  jubileu: "Aggro",
  mohtep: "Control",
  engine: "Carry",
  toc: "Aggro",
  "david-ax": "Sniper",
};

const ROLE_CYCLE: FantasyRole[] = ["Carry", "Aggro", "Control", "Support", "Sniper"];

export function getFantasyRole(slug: string): FantasyRole {
  if (ROLE_MAP[slug]) return ROLE_MAP[slug];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h += slug.charCodeAt(i);
  return ROLE_CYCLE[h % ROLE_CYCLE.length];
}

/** Pick rate % (how often selected this gameweek) */
const PICK_RATE: Record<string, number> = {
  moya: 68,
  yoshi: 61,
  lukii: 54,
  tensai: 52,
  boss: 48,
  lxffy: 45,
  response: 41,
  levi: 39,
  kaiodog: 36,
  ope: 34,
  pain: 31,
  nowy297: 28,
  bobby: 26,
  cauebr: 24,
  engine: 22,
  prozy: 18,
  guesti: 15,
  melty: 14,
  adrii: 12,
  nagi: 9,
};

export function getPickRate(slug: string): number {
  if (PICK_RATE[slug] != null) return PICK_RATE[slug];
  const p = getPlayer(slug);
  if (!p) return 5;
  return Math.max(3, Math.min(55, Math.round(p.fantasyOwnership * 0.7)));
}

export function getPriceTrend(change: number): "up" | "down" | "flat" {
  if (change > 0.05) return "up";
  if (change < -0.05) return "down";
  return "flat";
}

export function getFormStreak(form: readonly ("W" | "L")[]): number {
  let streak = 0;
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === "W") streak++;
    else break;
  }
  return streak;
}

export interface MarketSection {
  id: string;
  title: string;
  subtitle: string;
  accent: "yellow" | "blue" | "red" | "green";
  players: MarketPlayer[];
}

export function buildMarketSections(all: MarketPlayer[]): MarketSection[] {
  const hot = [...all].filter((p) => p.trending === "hot").slice(0, 4);
  const rising = [...all].sort((a, b) => b.priceChange - a.priceChange).slice(0, 4);
  const falling = [...all].sort((a, b) => a.priceChange - b.priceChange).slice(0, 4);
  const value = [...all].filter((p) => p.trending === "value" || p.priceChange < 0).slice(0, 4);
  const gems = [...all]
    .filter((p) => {
      const pl = getPlayer(p.playerSlug);
      return pl && pl.fantasyOwnership < 25 && pl.fantasyPoints >= 75;
    })
    .slice(0, 4);
  const premium = [...all].filter((p) => p.price >= 12).slice(0, 4);
  const budget = [...all].filter((p) => p.price < 8.5).slice(0, 4);

  return [
    { id: "hot", title: "Hot Picks", subtitle: "Los más fichados en este torneo", accent: "red", players: hot.length ? hot : rising.slice(0, 4) },
    { id: "rising", title: "Subiendo", subtitle: "Precio en alza", accent: "green", players: rising },
    { id: "falling", title: "Bajando", subtitle: "Oportunidades de mercado", accent: "blue", players: falling },
    { id: "value", title: "Value Picks", subtitle: "Máximo rendimiento / precio", accent: "yellow", players: value.length ? value : budget.slice(0, 4) },
    { id: "gems", title: "Low Ownership Gems", subtitle: "Diferenciales con poca propiedad", accent: "blue", players: gems },
    { id: "premium", title: "Premium", subtitle: "Estrellas del circuito", accent: "yellow", players: premium },
    { id: "budget", title: "Baratos", subtitle: "Fichajes económicos", accent: "green", players: budget },
  ];
}
