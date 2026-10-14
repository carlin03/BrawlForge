import { BSC_TOURNAMENT_PARTICIPANTS } from "./bsc-tournament-participants";
import { BSC_2026_ROSTERS } from "./bsc-2026-rosters";
import { getTeam } from "./teams";
import { getPlayer } from "./players";
import { getTeamDisplayName } from "./team-display-resolve";

export const WORLDS_2026_SLUG = "world-finals-2026";
export const WORLDS_2026_VENUE = {
  city: "Tokyo",
  country: "Japan",
  label: "Tokio, Japón",
  labelJp: "東京",
} as const;

/** Campo provisional World Finals 2026 (16 equipos). */
export const WORLDS_2026_TEAM_SLUGS: readonly string[] =
  BSC_TOURNAMENT_PARTICIPANTS["world-finals-2026"] ?? [];

export type WorldsRegion = "EMEA" | "EA" | "NA" | "SA" | "CN";

const REGION_HINT: Record<string, WorldsRegion> = {
  "crazy-raccoon": "EA",
  "zeta-division": "EA",
  reject: "EA",
  "ace-xero": "CN",
  "toxic-lotus": "CN",
  "sk-gaming": "EMEA",
  "team-heretics": "EMEA",
  hmble: "EMEA",
  "fut-esports": "EMEA",
  "natus-vincere": "EMEA",
  "tribe-gaming": "NA",
  "only-realm": "NA",
  loud: "SA",
  skcalalas: "SA",
  "bounty-hunters-esports": "SA",
  "eternal-esports": "SA",
};

export function worldsTeamRegion(slug: string): WorldsRegion {
  if (REGION_HINT[slug]) return REGION_HINT[slug];
  const t = getTeam(slug);
  const r = (t?.region || "").toUpperCase();
  if (r === "EA" || r === "EMEA" || r === "NA" || r === "SA") return r as WorldsRegion;
  return "EMEA";
}

export type WorldsTeamCard = {
  slug: string;
  name: string;
  region: WorldsRegion;
  tag?: string;
  roster: { slug: string; ign: string }[];
};

export function getWorlds2026Teams(): WorldsTeamCard[] {
  return WORLDS_2026_TEAM_SLUGS.map((slug) => {
    const team = getTeam(slug);
    const rosterSlugs = BSC_2026_ROSTERS[slug] ?? team?.roster ?? [];
    return {
      slug,
      name: getTeamDisplayName(slug, team?.name),
      region: worldsTeamRegion(slug),
      tag: team?.tag,
      roster: rosterSlugs.map((ps) => {
        const p = getPlayer(ps);
        return { slug: ps, ign: p?.ign || ps };
      }),
    };
  });
}

export function getWorlds2026Players() {
  const out: { slug: string; ign: string; teamSlug: string; teamName: string; region: WorldsRegion }[] = [];
  for (const team of getWorlds2026Teams()) {
    for (const p of team.roster) {
      out.push({
        slug: p.slug,
        ign: p.ign,
        teamSlug: team.slug,
        teamName: team.name,
        region: team.region,
      });
    }
  }
  return out.sort((a, b) => a.ign.localeCompare(b.ign));
}

/** Semillas QF (estilo pick'em): 8 cruces iniciales. */
export const WORLDS_PICKEM_QF: { id: string; a: string; b: string }[] = [
  { id: "qf1", a: "crazy-raccoon", b: "eternal-esports" },
  { id: "qf2", a: "sk-gaming", b: "ace-xero" },
  { id: "qf3", a: "tribe-gaming", b: "bounty-hunters-esports" },
  { id: "qf4", a: "loud", b: "natus-vincere" },
  { id: "qf5", a: "zeta-division", b: "only-realm" },
  { id: "qf6", a: "hmble", b: "toxic-lotus" },
  { id: "qf7", a: "fut-esports", b: "skcalalas" },
  { id: "qf8", a: "team-heretics", b: "reject" },
];
