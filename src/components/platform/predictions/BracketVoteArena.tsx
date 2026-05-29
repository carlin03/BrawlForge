"use client";

import { teamName } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function BracketVoteArena({
  size,
  teamASlug,
  teamBSlug,
  pick,
  event,
  disabled,
  onVoteA,
  onVoteB,
}: {
  size: "semi" | "final";
  teamASlug: string;
  teamBSlug: string;
  pick: "A" | "B" | null;
  event?: EnrichedPrediction;
  disabled?: boolean;
  onVoteA: () => void;
  onVoteB: () => void;
}) {
  const labelA = teamName(teamASlug);
  const labelB = teamName(teamBSlug);
  const hasVotes = event ? hasRealVotes(event) : false;
  const pickAPct = event?.pickAPct ?? 0;
  const pickBPct = event?.pickBPct ?? 0;
  const totalVotes = event?.totalVotes ?? 0;
  const logoSize = size === "final" ? 72 : 48;

  return (
    <div className={`bf-vote-arena bf-bracket-vote-arena is-${size}`}>
      <button
        type="button"
        className={`bf-vote-side bf-vote-side-a ${pick === "A" ? "is-picked" : ""}`}
        onClick={onVoteA}
        disabled={disabled}
        aria-label={`Votar por ${labelA}`}
      >
        <span className="bf-vote-side-tag bf-vote-side-tag-a" title={labelA}>
          AZUL
        </span>
        <span className="bf-vote-side-logo">
          <TeamLogo slug={teamASlug} name={labelA} size={logoSize} glow={pick === "A"} />
        </span>
        <span className="bf-vote-name bf-vote-name-lg" title={labelA}>
          {labelA}
        </span>
        {hasVotes ? (
          <span className="bf-vote-pct">{pickAPct}%</span>
        ) : (
          <span className="bf-vote-no-pct">—</span>
        )}
        {pick === "A" && !disabled && <span className="bf-vote-pick-badge">Tu voto</span>}
      </button>

      <div className="bf-vote-vs" aria-hidden>
        <span className="bf-vote-vs-label">VS</span>
        {hasVotes ? (
          <span className="bf-vote-votes">{totalVotes.toLocaleString("es-ES")} votos</span>
        ) : (
          <span className="bf-vote-votes">Vota</span>
        )}
      </div>

      <button
        type="button"
        className={`bf-vote-side bf-vote-side-b ${pick === "B" ? "is-picked" : ""}`}
        onClick={onVoteB}
        disabled={disabled}
        aria-label={`Votar por ${labelB}`}
      >
        <span className="bf-vote-side-tag bf-vote-side-tag-b" title={labelB}>
          ROJO
        </span>
        <span className="bf-vote-side-logo">
          <TeamLogo slug={teamBSlug} name={labelB} size={logoSize} glow={pick === "B"} />
        </span>
        <span className="bf-vote-name bf-vote-name-lg" title={labelB}>
          {labelB}
        </span>
        {hasVotes ? (
          <span className="bf-vote-pct">{pickBPct}%</span>
        ) : (
          <span className="bf-vote-no-pct">—</span>
        )}
        {pick === "B" && !disabled && <span className="bf-vote-pick-badge">Tu voto</span>}
      </button>

      {hasVotes && event && (
        <div
          className="bf-bracket-poll bf-bsc-poll"
          role="presentation"
          aria-label={`Comunidad: ${labelA} ${pickAPct}% · ${labelB} ${pickBPct}%`}
        >
          <div className="bf-bsc-poll-a" style={{ flex: `${pickAPct} 1 0` }} />
          <div className="bf-bsc-poll-b" style={{ flex: `${pickBPct} 1 0` }} />
        </div>
      )}
    </div>
  );
}
