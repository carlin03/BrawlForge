import { TeamsView } from "@/components/platform/TeamsView";
import { getTeam } from "@/lib/data/teams";
import { WORLDS_2026_TEAM_SLUGS } from "@/lib/data/worlds-2026-field";

export const metadata = {
  title: "Equipos · World Finals 2026",
  description: "Los 16 equipos del Mundial de Brawl Stars en Tokio.",
};

export default function TeamsPage() {
  const worldsTeams = WORLDS_2026_TEAM_SLUGS.map((slug) => getTeam(slug)).filter(Boolean);
  return <TeamsView teams={worldsTeams as NonNullable<(typeof worldsTeams)[number]>[]} />;
}
