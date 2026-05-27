import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { teams } from "@/lib/data";

export function RankingsPanel() {
  return (
    <div className="panel panel-accent-top">
      <div className="panel-head">
        <h3>World Rankings</h3>
        <Link href="/rankings" className="link-more">Full board →</Link>
      </div>
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
        {teams.slice(0, 8).map((team) => (
          <Link key={team.slug} href={`/teams/${team.slug}`} className="rank-card card-shine">
            <span className={`rank-card-pos ${team.rank <= 3 ? "rank-card-pos-top" : ""}`}>{team.rank}</span>
            <TeamLogo slug={team.slug} name={team.name} size="md" />
            <CountryFlag country={team.country} size={16} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{team.name}</div>
              <RegionBadge region={team.region} />
            </div>
            <div className="text-right">
              <div className="font-display text-sm font-bold text-accent-yellow">${(team.earnings / 1000).toFixed(0)}K</div>
              <div className="flex justify-end gap-0.5 mt-0.5">
                {team.form.slice(-3).map((f, i) => (
                  <span key={i} className={`rounded px-1 text-[8px] font-bold form-${f.toLowerCase()}`}>{f}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PickemPanel() {
  return (
    <Panel title="Pick'ems" href="/pickems">
      <div className="divide-y divide-border-subtle">
        <Link href="/pickems" className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover">
          <TournamentLogo slug="world-finals-2026" name="World Finals" size={36} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">World Finals 2026 — Tokyo</div>
            <div className="mt-1 text-[11px] text-text-muted">Qualifiers ongoing · Bracket opens Jun 2026</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-hover">
              <div className="h-full w-[34%] rounded-full bg-gradient-to-r from-accent-red via-accent-yellow to-accent-blue" />
            </div>
          </div>
        </Link>
        <Link href="/tournaments/world-finals-2025" className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover">
          <TournamentLogo slug="world-finals-2025" name="World Finals" size={36} />
          <div>
            <div className="font-semibold">World Finals 2025 — Results</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
              Winner:
              <TeamLogo slug="crazy-raccoon" name="Crazy Raccoon" size={16} />
              Crazy Raccoon · 89,420 entries
            </div>
          </div>
        </Link>
      </div>
    </Panel>
  );
}
