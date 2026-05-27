"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { ProRow } from "@/components/esports/ProRow";
import {
  FANTASY_BUDGET,
  FANTASY_SQUAD_SIZE,
  getPlayerPrice,
  getSquadValue,
  getSquadEventTotal,
  type FantasySquadSlot,
} from "@/lib/data/fantasy";
import { tournamentName } from "@/lib/data";

interface SquadRosterProps {
  squad: FantasySquadSlot[];
  tournamentSlug: string;
  locked?: boolean;
  onRemove: (slug: string) => void;
  onSetCaptain: (slug: string) => void;
}

export function SquadRoster({
  squad,
  tournamentSlug,
  locked = false,
  onRemove,
  onSetCaptain,
}: SquadRosterProps) {
  const spent = getSquadValue(squad);
  const eventTotal = getSquadEventTotal(squad);
  const empty = FANTASY_SQUAD_SIZE - squad.length;

  const slots: (FantasySquadSlot | null)[] = [...squad];
  while (slots.length < FANTASY_SQUAD_SIZE) slots.push(null);

  return (
    <div className="bc-lineup">
      <div className="bc-lineup-head">
        <div>
          <div className="bc-lineup-kicker">
            {locked ? (
              <>
                <Lock className="h-3 w-3" /> Alineación cerrada
              </>
            ) : (
              "Tu alineación"
            )}
          </div>
          <div className="bc-lineup-event">{tournamentName(tournamentSlug)}</div>
        </div>
        <div className="bc-lineup-metrics">
          <div className="bc-metric">
            <span className="bc-metric-val c-yellow">{eventTotal}</span>
            <span className="bc-metric-lbl">Pts evento</span>
          </div>
          <div className="bc-metric">
            <span className="bc-metric-val">${spent.toFixed(1)}M</span>
            <span className="bc-metric-lbl">Usado</span>
          </div>
          <div className="bc-metric">
            <span className="bc-metric-val">${(FANTASY_BUDGET - spent).toFixed(1)}M</span>
            <span className="bc-metric-lbl">Restante</span>
          </div>
          <div className="bc-metric">
            <span className="bc-metric-val">{squad.length}/{FANTASY_SQUAD_SIZE}</span>
            <span className="bc-metric-lbl">Pros</span>
          </div>
        </div>
      </div>

      <table className="es-table es-table-premium">
        <thead>
          <tr>
            <th>#</th>
            <th>Pro</th>
            <th>Val</th>
            <th>Rating</th>
            <th>Pts</th>
            {!locked && <th />}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, i) => {
            if (!slot?.playerSlug) {
              return (
                <tr key={`empty-${i}`} className="es-pro-row es-pro-row-empty">
                  <td className="es-pro-rank">{i + 1}</td>
                  <td colSpan={locked ? 4 : 5}>
                    <span className="es-pro-empty">Slot libre — elige del pool abajo</span>
                  </td>
                </tr>
              );
            }
            return (
              <ProRow
                key={slot.playerSlug}
                playerSlug={slot.playerSlug}
                rank={i + 1}
                isCaptain={slot.isCaptain}
                eventPoints={slot.eventPoints}
                price={getPlayerPrice(slot.playerSlug)}
                showRank
                showForm={false}
                showRating
                showPrice
                showEvent
                showActions={!locked}
                onRemove={!locked ? () => onRemove(slot.playerSlug) : undefined}
                onSetCaptain={!locked && !slot.isCaptain ? () => onSetCaptain(slot.playerSlug) : undefined}
              />
            );
          })}
        </tbody>
      </table>

      {empty > 0 && !locked && (
        <p className="bc-lineup-foot">
          {empty} slot{empty > 1 ? "s" : ""} libre{empty > 1 ? "s" : ""} · <Link href="#pool">Pool de pros ↓</Link>
        </p>
      )}
    </div>
  );
}
