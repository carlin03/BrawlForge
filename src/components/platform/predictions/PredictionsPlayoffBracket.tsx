"use client";

import Link from "next/link";
import type { PlayoffBracketView } from "@/lib/data/predictions-ui";

export function PredictionsPlayoffBracket({ bracket }: { bracket: PlayoffBracketView }) {
  return (
    <section className="bf-predict-bracket" aria-labelledby="predict-bracket-title">
      <div className="bf-predict-bracket-head">
        <h2 id="predict-bracket-title" className="bf-predict-pickem-section-title">
          Bracket · {bracket.tournamentName}
        </h2>
        {bracket.region && <span className="bf-predict-bracket-region">{bracket.region}</span>}
      </div>
      <div className="bf-predict-bracket-lanes">
        {bracket.rounds.map((round) => (
          <div key={round.key} className={`bf-predict-bracket-round is-${round.key}`}>
            <h3>{round.title}</h3>
            <ul>
              {round.slots.map((slot, i) => (
                <li key={`${round.key}-${i}`} className={slot.status === "tbd" ? "is-tbd" : ""}>
                  {slot.matchId ? (
                    <Link href={`/matches/${slot.matchId}`}>{slot.label}</Link>
                  ) : (
                    <span>{slot.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
