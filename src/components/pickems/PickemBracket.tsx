import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teamName } from "@/lib/data";
import type { PickemEvent, PickemMatch } from "@/lib/data/pickems";

function BracketMatch({ match }: { match: PickemMatch }) {
  const winner = match.scoreA > match.scoreB ? match.teamASlug : match.teamBSlug;

  return (
    <div className="bf-pickem-match">
      <Link
        href={`/teams/${match.teamASlug}`}
        className={`bf-pickem-team ${winner === match.teamASlug ? "bf-pickem-team-winner" : ""}`}
      >
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={28} />
        <span className="truncate font-semibold">{teamName(match.teamASlug, match)}</span>
        <span className="bf-pickem-score">{match.scoreA}</span>
      </Link>
      <Link
        href={`/teams/${match.teamBSlug}`}
        className={`bf-pickem-team ${winner === match.teamBSlug ? "bf-pickem-team-winner" : ""}`}
      >
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={28} />
        <span className="truncate font-semibold">{teamName(match.teamBSlug, match)}</span>
        <span className="bf-pickem-score">{match.scoreB}</span>
      </Link>
    </div>
  );
}

export function PickemBracket({ event }: { event: PickemEvent }) {
  if (event.stages.length === 0) {
    return (
      <div className="rounded-[var(--bf-r-md)] border border-dashed border-[var(--bf-blue)] bg-[rgba(59,130,246,0.08)] p-10 text-center">
        <div className="bf-display text-xl">Bracket próximamente</div>
        <p className="mt-2 text-sm text-[var(--bf-muted)]">
          Clasificatorias en curso — el pick&apos;em se desbloquea cuando el bracket esté listo.
        </p>
        <div className="mx-auto mt-6 h-3 max-w-xs overflow-hidden rounded-full bg-[var(--bf-bg)]">
          <div
            className="h-full rounded-full bg-[var(--bf-blue)]"
            style={{ width: `${event.completionPct}%` }}
          />
        </div>
        <span className="mt-2 block text-xs text-[var(--bf-muted)]">{event.completionPct}% revelado</span>
      </div>
    );
  }

  return (
    <div className="bf-pickem-bracket">
      {event.stages.map((stage) => (
        <div key={stage.id} className="bf-pickem-stage">
          <h3 className="bf-pickem-stage-label">{stage.label}</h3>
          {stage.matches.map((m) => (
            <BracketMatch key={m.id} match={m} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PickemStats({ event }: { event: PickemEvent }) {
  const stats = [
    { label: "Entradas", value: event.entries.toLocaleString(), color: "bf-stat-pill-yellow" },
    {
      label: "Tus puntos",
      value: event.userPoints != null ? `${event.userPoints}/${event.userMaxPoints}` : "—",
      color: "bf-stat-pill-blue",
    },
    {
      label: "Tu posición",
      value: event.userRank != null ? `#${event.userRank.toLocaleString()}` : "—",
      color: "bf-stat-pill-red",
    },
    { label: "Recompensas", value: event.rewardPool, color: "bf-stat-pill-yellow" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className={`bf-stat-pill ${s.color} text-center`}>
          <div className="bf-kicker opacity-70">{s.label}</div>
          <div className="bf-display text-xl">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
