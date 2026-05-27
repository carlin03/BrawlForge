"use client";

import { X } from "lucide-react";
import { FantasyCard } from "@/components/fantasy/FantasyCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { getPlayer, getTeam } from "@/lib/data";
import { getPlayerPrice, getTournamentMarket, isPlayerInTournament } from "@/lib/data/fantasy";
import { getFantasyTeamPlayerSlugs } from "@/lib/data/fantasy-rosters";

interface TeamDetailPanelProps {
  teamSlug: string;
  tournamentSlug: string;
  inSquad: string[];
  budgetLeft: number;
  squadFull: boolean;
  locked?: boolean;
  onClose: () => void;
  onPick: (playerSlug: string) => void;
}

export function TeamDetailPanel({
  teamSlug,
  tournamentSlug,
  inSquad,
  budgetLeft,
  squadFull,
  locked = false,
  onClose,
  onPick,
}: TeamDetailPanelProps) {
  const team = getTeam(teamSlug);
  if (!team) return null;

  const market = getTournamentMarket(tournamentSlug);
  const marketMap = new Map(market.map((m) => [m.playerSlug, m]));
  const topAchievement = team.achievements[0];

  return (
    <div className="fx-panel-overlay" onClick={onClose} role="presentation">
      <div className="fx-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fx-panel-close" onClick={onClose} aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>

        <div className="fx-panel-hero">
          <TeamLogo slug={team.slug} name={team.name} size={88} />
          <div>
            <div className="fx-panel-tag">{team.tag}</div>
            <h2 className="fx-panel-name">{team.name}</h2>
            <div className="fx-panel-badges">
              <RegionBadge region={team.region} />
              <CountryFlag country={team.country} size={20} />
              <span className="text-xs text-[var(--bf-muted)]">#{team.rank} global</span>
            </div>
          </div>
        </div>

        {topAchievement && (
          <div className="fx-panel-achievement">
            <span className="fx-panel-achievement-place">{topAchievement.place}</span>
            <span className="text-sm">{topAchievement.tournament}</span>
          </div>
        )}

        <div className="fx-panel-roster-title">Ficha jugadores · elige tu pro</div>
        <div className="fx-panel-cards-scroll">
          {getFantasyTeamPlayerSlugs(teamSlug).map((playerSlug) => {
            const player = getPlayer(playerSlug);
            if (!player) return null;
            const mp = marketMap.get(playerSlug);
            const price = getPlayerPrice(playerSlug);
            const alreadyIn = inSquad.includes(playerSlug);
            const canPick =
              !locked &&
              !alreadyIn &&
              !squadFull &&
              price <= budgetLeft &&
              isPlayerInTournament(playerSlug, tournamentSlug);

            return (
              <div key={playerSlug} className="fx-panel-card-wrap">
                <FantasyCard
                  playerSlug={playerSlug}
                  variant="market"
                  price={price}
                  priceChange={mp?.priceChange ?? 0}
                  trending={mp?.trending}
                  form={mp?.form}
                  onPick={canPick ? () => { onPick(playerSlug); onClose(); } : undefined}
                />
                {alreadyIn && (
                  <span className="fx-panel-in-squad">En plantilla</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
