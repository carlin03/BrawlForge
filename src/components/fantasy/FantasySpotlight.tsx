import Link from "next/link";
import { SquadRoster } from "@/components/esports/SquadRoster";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getUserSquad,
  getTournamentFantasyProfile,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { tournamentName } from "@/lib/data";

export function FantasySpotlight() {
  const slug = DEFAULT_FANTASY_TOURNAMENT;
  const squad = getUserSquad(slug);
  const profile = getTournamentFantasyProfile(slug);
  const config = getFantasyTournaments(true).find((t) => t.slug === slug);

  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {config && <TournamentLogo slug={slug} name={config.tournament.shortName} size={36} />}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--nv-blue)" }}>Pro Picks activo</div>
          <div style={{ fontFamily: "var(--nv-display)", fontWeight: 700, textTransform: "uppercase" }}>{tournamentName(slug)}</div>
        </div>
        {profile.rank > 0 && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div className="nv-mono c-yellow" style={{ fontSize: "1.25rem" }}>#{profile.rank.toLocaleString()}</div>
            <div className="nv-dim">{profile.totalPoints} pts</div>
          </div>
        )}
      </div>

      <SquadRoster
        squad={squad}
        tournamentSlug={slug}
        locked
        onRemove={() => {}}
        onSetCaptain={() => {}}
      />

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <Link href={`/fantasy?tournament=${slug}`} className="nv-btn nv-btn-yellow">Alineación</Link>
        <Link href="/players" className="nv-btn nv-btn-blue">Jugadores</Link>
      </div>
    </div>
  );
}
