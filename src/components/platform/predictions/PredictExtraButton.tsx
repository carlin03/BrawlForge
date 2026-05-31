"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getMatch } from "@/lib/data/matches";
import {
  getMatchPredictionsConfig,
  hasAdvancedPredictionOptions,
  parseMatchMeta,
} from "@/lib/data/match-meta";

/** Acceso rápido a predicción avanzada / ficha del partido (MVP, mapas, brawlers). */
export function PredictExtraButton({
  matchId,
  hasVote,
  compact,
}: {
  matchId: string;
  hasVote?: boolean;
  compact?: boolean;
}) {
  const match = getMatch(matchId);
  const meta = parseMatchMeta(match?.meta);
  const cfg = getMatchPredictionsConfig(meta);
  const hasMaps = Boolean(meta.maps?.order?.length || meta.maps?.possible?.length);
  const show =
    hasAdvancedPredictionOptions(cfg) || hasMaps || cfg.exact_score || cfg.mvp;

  if (!show) return null;

  const href = `/matches/${matchId}#match-predictions`;

  return (
    <Link
      href={href}
      className={`bf-predict-extra-btn ${compact ? "is-compact" : ""} ${hasVote ? "has-vote" : ""}`}
      title="Predicción avanzada: mapas, MVP, brawlers y puntos"
    >
      <Sparkles size={compact ? 12 : 14} aria-hidden />
      Extra
    </Link>
  );
}
