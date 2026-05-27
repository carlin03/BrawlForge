import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { teamName } from "@/lib/data";
import type { EsportsTournament } from "@/lib/data/matches";

interface TournamentCardProps {
  tournament: EsportsTournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const statusLabel =
    tournament.status === "live" ? "LIVE" : tournament.status === "upcoming" ? "Próximo" : "Finalizado";
  const badgeClass =
    tournament.status === "live"
      ? "bf-badge-red"
      : tournament.status === "upcoming"
        ? "bf-badge-blue"
        : "bf-badge-yellow";

  return (
    <Link href={`/tournaments/${tournament.slug}`} className="es-event-row">
      <TournamentLogo slug={tournament.slug} name={tournament.shortName} size={40} />
      <div className="es-event-main">
        <div className="es-event-title">{tournament.shortName}</div>
        <div className="es-event-sub">{tournament.name}</div>
      </div>
      <span className={`bf-badge ${badgeClass}`}>{statusLabel}</span>
      <span className="es-event-meta">{tournament.region}</span>
      <span className="es-event-prize c-yellow">{tournament.prizePool}</span>
      {tournament.winnerSlug && (
        <span className="es-event-winner">
          <TeamLogo slug={tournament.winnerSlug} name={teamName(tournament.winnerSlug)} size={18} />
          {teamName(tournament.winnerSlug)}
        </span>
      )}
    </Link>
  );
}
