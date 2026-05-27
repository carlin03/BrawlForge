"use client";

import { Crown, X } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getPlayer, getTeam } from "@/lib/data";
import { FANTASY_BUDGET, FANTASY_SQUAD_SIZE, getPlayerPrice } from "@/lib/data/fantasy";
import type { FantasySquadSlot } from "@/lib/data/fantasy";

interface SquadDockProps {
  squad: FantasySquadSlot[];
  spent: number;
  onRemove: (playerSlug: string) => void;
  onSetCaptain: (playerSlug: string) => void;
}

export function SquadDock({ squad, spent, onRemove, onSetCaptain }: SquadDockProps) {
  const slots = [...squad];
  while (slots.length < FANTASY_SQUAD_SIZE) {
    slots.push({ playerSlug: "", isCaptain: false, eventPoints: 0 });
  }
  const remaining = FANTASY_BUDGET - spent;
  const pct = Math.min(100, (spent / FANTASY_BUDGET) * 100);

  return (
    <div className="ff-dock">
      <div className="ff-dock-header">
        <div>
          <div className="ff-dock-title">Tu plantilla</div>
          <div className="ff-dock-sub">
            {squad.length}/{FANTASY_SQUAD_SIZE} jugadores · capitán ×2
          </div>
        </div>
        <div className="ff-dock-budget">
          <span className="ff-dock-budget-val">{remaining.toFixed(1)}M</span>
          <span className="ff-dock-budget-lbl">disponible</span>
        </div>
      </div>
      <div className="ff-dock-bar">
        <div className="ff-dock-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="ff-dock-slots">
        {slots.map((slot, i) => {
          if (!slot.playerSlug) {
            return (
              <div key={`empty-${i}`} className="ff-dock-slot ff-dock-slot-empty">
                <span className="ff-dock-slot-num">{i + 1}</span>
                <span className="ff-dock-slot-placeholder">Vacío</span>
              </div>
            );
          }
          const player = getPlayer(slot.playerSlug);
          const team = player ? getTeam(player.teamSlug) : null;
          if (!player) return null;

          return (
            <div
              key={slot.playerSlug}
              className={`ff-dock-slot ${slot.isCaptain ? "ff-dock-slot-captain" : ""}`}
            >
              {slot.isCaptain && (
                <span className="ff-dock-captain">
                  <Crown className="h-3 w-3" />
                  CAP
                </span>
              )}
              <button
                type="button"
                className="ff-dock-remove"
                onClick={() => onRemove(slot.playerSlug)}
                aria-label="Quitar jugador"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {team && <TeamLogo slug={team.slug} name={team.name} size={44} />}
              <div className="ff-dock-player-name">{player.ign}</div>
              <div className="ff-dock-player-meta">{getPlayerPrice(slot.playerSlug).toFixed(1)}M</div>
              {!slot.isCaptain && (
                <button
                  type="button"
                  className="ff-dock-cap-btn"
                  onClick={() => onSetCaptain(slot.playerSlug)}
                >
                  Hacer capitán
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
