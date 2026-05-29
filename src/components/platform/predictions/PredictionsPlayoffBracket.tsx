"use client";

import Link from "next/link";
import type { PlayoffBracketSlot, PlayoffBracketView } from "@/lib/data/predictions-ui";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

function bracketTeamShort(slug: string): string {
  const full = teamName(slug);
  if (full.length <= 6) return full;
  const words = full.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((w) => w.slice(0, 3))
      .join(" ")
      .slice(0, 8);
  }
  return full.slice(0, 6);
}

function BracketDuelChip({ slot }: { slot: PlayoffBracketSlot }) {
  if (slot.status === "tbd" || !slot.teamASlug || !slot.teamBSlug) {
    return (
      <div className="bf-bracket-chip is-tbd" title="Por decidir">
        <span>TBD</span>
      </div>
    );
  }

  const nameA = teamName(slot.teamASlug);
  const nameB = teamName(slot.teamBSlug);
  const shortA = bracketTeamShort(slot.teamASlug);
  const shortB = bracketTeamShort(slot.teamBSlug);

  return (
    <Link
      href={slot.matchId ? `/predictions#pick-${slot.matchId}` : "/predictions"}
      className="bf-bracket-chip"
      title={`${nameA} vs ${nameB}`}
    >
      <span className="bf-bracket-chip-side">
        <TeamLogo slug={slot.teamASlug} name="" size={20} glow={false} />
        <span className="bf-bracket-chip-name">{shortA}</span>
      </span>
      <span className="bf-bracket-chip-vs">vs</span>
      <span className="bf-bracket-chip-side">
        <TeamLogo slug={slot.teamBSlug} name="" size={20} glow={false} />
        <span className="bf-bracket-chip-name">{shortB}</span>
      </span>
    </Link>
  );
}

export function PredictionsPlayoffBracket({ bracket }: { bracket: PlayoffBracketView }) {
  const totalDuels = bracket.rounds.reduce((n, r) => n + r.slots.length, 0);

  return (
    <section className="bf-predict-bracket is-compact" aria-labelledby="predict-bracket-title">
      <div className="bf-predict-bracket-head">
        <div>
          <h2 id="predict-bracket-title" className="bf-predict-bracket-title">
            Ruta playoff
          </h2>
          <p className="bf-predict-bracket-sub">
            {bracket.tournamentName}
            {bracket.region ? ` · ${bracket.region}` : ""}
            {" · "}
            {totalDuels} {totalDuels === 1 ? "duelo" : "duelos"}
          </p>
        </div>
      </div>

      <div className="bf-bracket-flow" role="list" aria-label="Fases del bracket">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.key} className="bf-bracket-flow-group" role="presentation">
            {roundIndex > 0 && (
              <span className="bf-bracket-flow-arrow" aria-hidden>
                →
              </span>
            )}
            <div className={`bf-bracket-flow-stage is-${round.key}`} role="listitem">
              <span className="bf-bracket-flow-label">{round.shortTitle}</span>
              <div className="bf-bracket-flow-duels">
                {round.slots.map((slot, i) => (
                  <BracketDuelChip key={slot.matchId ?? `${round.key}-${i}`} slot={slot} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
