import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName, tournamentName } from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface MatchRowProps {
  match: EsportsMatch;
  compact?: boolean;
  rich?: boolean;
}

export function MatchRow({ match, compact, rich = true }: MatchRowProps) {
  const winnerA = match.status === "finished" && match.scoreA > match.scoreB;
  const winnerB = match.status === "finished" && match.scoreB > match.scoreA;
  const meta = rich && !compact ? getMatchEnrichment(match) : null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`bf-match ${match.status === "live" ? "bf-match-live" : ""} ${rich && !compact ? "bf-match-rich" : ""}`}
    >
      {!compact && (
        <div className="w-16 shrink-0 text-center">
          {match.status === "live" ? (
            <span className="bf-badge bf-badge-live text-[9px]">
              <span className="bf-pulse" />
              LIVE
            </span>
          ) : match.status === "upcoming" ? (
            <span className="text-[10px] font-bold text-[var(--bf-muted)]">
              {new Date(match.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[var(--bf-dim)]">FT</span>
          )}
        </div>
      )}

      <div className={`bf-match-team ${winnerA ? "font-bold" : ""}`}>
        <span className={`truncate text-sm ${winnerA ? "text-[var(--bf-yellow)]" : "text-[var(--bf-muted)]"}`}>
          {teamName(match.teamASlug, match)}
        </span>
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={rich && !compact ? 40 : 32} />
      </div>

      <div className="bf-match-score">
        {match.status === "upcoming" ? (
          <span className="text-[var(--bf-red)] text-base font-black">VS</span>
        ) : (
          <>
            <span className={winnerA ? "text-[var(--bf-yellow)]" : "text-[var(--bf-dim)]"}>{match.scoreA}</span>
            <span className="text-[var(--bf-dim)] mx-1">:</span>
            <span className={winnerB ? "text-[var(--bf-yellow)]" : "text-[var(--bf-dim)]"}>{match.scoreB}</span>
          </>
        )}
      </div>

      <div className={`bf-match-team end ${winnerB ? "font-bold" : ""}`}>
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={rich && !compact ? 40 : 32} />
        <span className={`truncate text-sm ${winnerB ? "text-[var(--bf-yellow)]" : "text-[var(--bf-muted)]"}`}>
          {teamName(match.teamBSlug, match)}
        </span>
      </div>

      {!compact && (
        <div className="hidden shrink-0 sm:block w-36 text-right">
          <div className="text-[11px] font-semibold text-[var(--bf-blue)]">{tournamentName(match.tournamentSlug)}</div>
          {meta ? (
            <>
              <div className="text-[10px] text-[var(--bf-yellow)] mt-0.5">{meta.map}</div>
              <div className="text-[9px] text-[var(--bf-dim)] mt-0.5 truncate">
                Ban: {meta.bans.slice(0, 2).join(", ")}
              </div>
              <div className="text-[9px] font-bold text-[var(--bf-muted)] mt-1">{meta.quickStat}</div>
            </>
          ) : (
            <div className="text-[10px] text-[var(--bf-dim)]">{match.stage}</div>
          )}
        </div>
      )}
    </Link>
  );
}
