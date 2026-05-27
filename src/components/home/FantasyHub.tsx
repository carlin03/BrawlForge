import Link from "next/link";
import { Crown, ArrowRightLeft, ChevronRight } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getPlayer, getTeam } from "@/lib/data";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  userSquad,
  userFantasyProfile,
  getSquadEventTotal,
  getTournamentFantasyProfile,
} from "@/lib/data/fantasy";

export function FantasyHub() {
  const profile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const eventTotal = getSquadEventTotal(userSquad);
  const captain = userSquad.find((s) => s.isCaptain);
  const captainPlayer = captain ? getPlayer(captain.playerSlug) : null;

  return (
    <div className="panel panel-accent-top card-shine overflow-hidden">
      <div className="panel-head">
        <div className="flex items-center gap-2">
          <h3>Fantasy · My Squad</h3>
          <span className="badge-gw">{profile.tournamentSlug.replace("bsc-2026-", "").toUpperCase()}</span>
        </div>
        <Link href="/fantasy" className="link-more flex items-center gap-1">
          Manage <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="lineup-pitch mx-3 mt-3 mb-0 rounded-b-none border-b-0">
        <div className="lineup-pitch-grid">
          {userSquad.map((slot) => {
            const player = getPlayer(slot.playerSlug);
            const team = player ? getTeam(player.teamSlug) : null;
            if (!player) return null;
            return (
              <Link
                key={slot.playerSlug}
                href={`/players/${player.slug}`}
                className={`player-card ${slot.isCaptain ? "player-card-captain" : ""}`}
              >
                {slot.isCaptain && (
                  <div className="captain-badge">
                    <Crown className="h-3 w-3" />
                    Captain · 2×
                  </div>
                )}
                <div className="player-card-inner py-3">
                  <div className="flex justify-center">{team && <TeamLogo slug={team.slug} name={team.name} size="lg" />}</div>
                  <div className="mt-2 text-center font-display text-lg font-bold">{player.ign}</div>
                  <div className="text-center font-display text-xl font-bold text-accent-blue">{slot.eventPoints}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px border-y border-border-subtle bg-border-subtle mx-3">
        {[
          { label: "Total", value: String(userFantasyProfile.totalPoints), color: "text-accent-yellow" },
          { label: "Torneo", value: String(eventTotal), color: "text-accent-blue" },
          { label: "Rank", value: `#${userFantasyProfile.globalRank.toLocaleString()}`, color: "text-text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-bg-surface px-3 py-3 text-center">
            <div className="text-[9px] font-bold uppercase text-text-muted">{s.label}</div>
            <div className={`font-display text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mx-3 mb-3 mt-0 flex gap-2 border border-t-0 border-border-subtle rounded-b-xl bg-bg-surface p-3">
        <Link href="/fantasy/transfers" className="btn-fantasy flex-1 justify-center text-sm">
          <ArrowRightLeft className="h-4 w-4" />
          Market
        </Link>
        <Link href="/fantasy/leagues" className="btn-fantasy btn-fantasy-blue flex-1 justify-center text-sm">
          Leagues
        </Link>
      </div>
      {captainPlayer && (
        <div className="border-t border-border-subtle px-4 py-2 text-center text-[11px] text-text-muted">
          Captain <span className="font-bold text-accent-yellow">{captainPlayer.ign}</span> earns double points
        </div>
      )}
    </div>
  );
}
