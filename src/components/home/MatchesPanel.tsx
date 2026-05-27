import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { MatchRow } from "@/components/ui/MatchRow";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getUpcomingMatches, getRecentMatches, teamName } from "@/lib/data";
import { openPredictions } from "@/lib/data/predictions";

export function MatchesPanel() {
  const upcoming = getUpcomingMatches();
  const recent = getRecentMatches(4);

  return (
    <Panel title="Match Center" href="/matches" linkLabel="All matches">
      {upcoming.length > 0 && (
        <>
          <div className="border-b border-border-subtle px-4 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Upcoming</span>
          </div>
          {upcoming.map((m) => (
            <div key={m.id} className="border-b border-border-subtle">
              <MatchRow match={m} />
            </div>
          ))}
        </>
      )}
      <div className="border-b border-border-subtle px-4 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Recent results</span>
      </div>
      {recent.map((m) => (
        <div key={m.id} className="border-b border-border-subtle last:border-0">
          <MatchRow match={m} compact />
        </div>
      ))}
    </Panel>
  );
}

export function PredictionsPanel() {
  const featured = openPredictions.filter((p) => p.featured).slice(0, 2);

  return (
    <Panel
      title="Predictions"
      href="/predictions"
      badge={<span className="rounded bg-accent-red/15 px-1.5 py-0.5 text-[9px] font-bold text-accent-red">Vote</span>}
    >
      <div className="space-y-3 p-3">
        {featured.map((p) => (
          <Link
            key={p.id}
            href="/predictions"
            className="block rounded-xl border border-border-subtle bg-bg-elevated p-3 transition-colors hover:border-accent-yellow/30"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-center gap-1">
                <TeamLogo slug={p.teamASlug} name={teamName(p.teamASlug)} size="lg" />
                <span className="text-center text-[11px] font-bold leading-tight">{teamName(p.teamASlug)}</span>
                <span className="font-display text-sm font-bold text-accent-blue">{p.pickAPct}%</span>
              </div>
              <span className="font-display text-xs font-bold text-text-muted">VS</span>
              <div className="flex flex-1 flex-col items-center gap-1">
                <TeamLogo slug={p.teamBSlug} name={teamName(p.teamBSlug)} size="lg" />
                <span className="text-center text-[11px] font-bold leading-tight">{teamName(p.teamBSlug)}</span>
                <span className="font-display text-sm font-bold text-accent-red">{p.pickBPct}%</span>
              </div>
            </div>
            <div className="pred-community-bar mb-1">
              <div className="pred-bar-a" style={{ width: `${p.pickAPct}%` }} />
              <div className="pred-bar-b" style={{ width: `${p.pickBPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>+{p.rewardPoints} pts</span>
              <span>{p.totalVotes.toLocaleString()} votes</span>
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
