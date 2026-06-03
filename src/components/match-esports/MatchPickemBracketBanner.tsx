"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { EsportsMatch } from "@/lib/data/matches";
import { getMatchStageMeta } from "@/lib/data/match-stage-meta";
import { countTournamentQuarters } from "@/lib/data/bracket-playoff-sanitize";
import { getMatchesByTournament } from "@/lib/data/matches";
import { getMatchPool } from "@/lib/data/match-pool";
import { tournamentName } from "@/lib/data";

export function MatchPickemBracketBanner({ match }: { match: EsportsMatch }) {
  const stage = getMatchStageMeta(match.stage);
  const pool = getMatchPool();
  const qCount = countTournamentQuarters(pool, match.tournamentSlug);
  const tourMatches = getMatchesByTournament(match.tournamentSlug);
  const hasPlayoff = tourMatches.some((m) => getMatchStageMeta(m.stage).isPlayoff);

  if (!hasPlayoff && stage.roundKey !== "group") return null;

  const href = `/predictions#pickem-${match.tournamentSlug}`;
  const label =
    qCount >= 4
      ? "Ver bracket completo (cuartos 2×2, semis y final)"
      : stage.roundKey === "group"
        ? "Ver calendario y predicciones del torneo"
        : "Ver fase eliminatoria en Predicciones";

  return (
    <div className="bf-match-bracket-banner">
      <LayoutGrid size={18} aria-hidden />
      <div>
        <strong>{tournamentName(match.tournamentSlug)}</strong>
        <p>
          {stage.roundKey === "group"
            ? "Este duelo es fase de grupos. El bracket 2×2 aplica a Monthly Finals con 4 cuartos."
            : "Las semifinales y la final se desbloquean al votar los cuartos — no son spoilers fijos."}
        </p>
      </div>
      <Link href={href} className="fu-btn fu-btn-gold">
        {label}
      </Link>
    </div>
  );
}
