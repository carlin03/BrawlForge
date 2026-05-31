"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { teamName } from "@/lib/data";
import { resolveMatchMapOrder } from "@/lib/data/series-map-utils";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import { useAuth } from "@/contexts/AuthContext";

function buildRecapText(
  match: EsportsMatch,
  meta: MatchMeta,
  ext: MatchExtendedPrediction,
  winnerPick: "A" | "B" | null,
  displayName: string,
  userId: string,
): string {
  const lines: string[] = [
    "BrawlForge — Predicción",
    `Usuario: ${displayName} (@${userId.slice(0, 8)})`,
    "",
    `${teamName(match.teamASlug)} vs ${teamName(match.teamBSlug)}`,
    `Formato: ${match.format}`,
  ];
  if (winnerPick) {
    lines.push(`Ganador: ${teamName(winnerPick === "A" ? match.teamASlug : match.teamBSlug)}`);
  }
  if (ext.exactScore) lines.push(`Marcador exacto: ${ext.exactScore}`);
  const order = resolveMatchMapOrder(meta, match.format);
  if (ext.mapWinners && order.length) {
    lines.push("", "Mapas:");
    for (let i = 0; i < order.length; i++) {
      const w = ext.mapWinners[i];
      if (!w) continue;
      const mapName = order[i] ?? `Mapa ${i + 1}`;
      lines.push(
        `  ${mapName}: ${teamName(w === "A" ? match.teamASlug : match.teamBSlug)}`,
      );
      const picks = ext.mapBrawlerPicks?.[i];
      const cBans = ext.mapBrawlerBans?.[i] ?? [];
      const tBans = ext.mapTeamBans?.[i];
      if (picks?.a?.length) lines.push(`    Picks A: ${picks.a.join(", ")}`);
      if (picks?.b?.length) lines.push(`    Picks B: ${picks.b.join(", ")}`);
      if (cBans.length) lines.push(`    Bloqueos: ${cBans.join(", ")}`);
      if (tBans?.a?.length) lines.push(`    Bans A: ${tBans.a.join(", ")}`);
      if (tBans?.b?.length) lines.push(`    Bans B: ${tBans.b.join(", ")}`);
    }
  }
  if (ext.mvpPlayerSlug) lines.push(`MVP jugador: ${ext.mvpPlayerSlug}`);
  if (ext.brawlerMvp) lines.push(`Mejor WR: ${ext.brawlerMvp}`);
  if (ext.brawlerMostUsed) lines.push(`Más usado: ${ext.brawlerMostUsed}`);
  if (ext.brawlerMostBanned) lines.push(`Más bloqueado: ${ext.brawlerMostBanned}`);
  lines.push("", "brawlforges.com");
  return lines.join("\n");
}

export function MatchPredictionRecapCard({
  match,
  meta,
  ext,
  winnerPick,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
  winnerPick: "A" | "B" | null;
}) {
  const { profile, user } = useAuth();
  const cardRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const displayName = profile?.ign || profile?.displayName || "Jugador";
  const userId = profile?.id ?? user?.id ?? "—";

  const recapText = useMemo(
    () => buildRecapText(match, meta, ext, winnerPick, displayName, userId),
    [match, meta, ext, winnerPick, displayName, userId],
  );

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recapText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [recapText]);

  const downloadTxt = useCallback(() => {
    const blob = new Blob([recapText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brawlforge-prediccion-${match.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [recapText, match.id]);

  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "BrawlForge — Mi predicción",
          text: recapText,
        });
        return;
      } catch {
        /* fallback copy */
      }
    }
    void copyText();
  }, [recapText, copyText]);

  if (!winnerPick) return null;

  return (
    <article className="bf-prediction-recap-card" ref={cardRef} id="bf-prediction-recap">
      <header className="bf-prediction-recap-brand">
        <BrandMark size={32} />
        <div>
          <strong>BrawlForge</strong>
          <span>
            {displayName} · {userId.slice(0, 8)}
          </span>
        </div>
      </header>

      <div className="bf-prediction-recap-match">
        <div className="bf-prediction-recap-team">
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={36} />
          <span>{teamName(match.teamASlug)}</span>
        </div>
        <span className="bf-prediction-recap-vs">VS</span>
        <div className="bf-prediction-recap-team">
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={36} />
          <span>{teamName(match.teamBSlug)}</span>
        </div>
      </div>

      <dl className="bf-prediction-recap-facts">
        <div>
          <dt>Ganador</dt>
          <dd>{teamName(winnerPick === "A" ? match.teamASlug : match.teamBSlug)}</dd>
        </div>
        {ext.exactScore && (
          <div>
            <dt>Marcador</dt>
            <dd>{ext.exactScore}</dd>
          </div>
        )}
        {ext.brawlerMvp && (
          <div>
            <dt>Mejor WR</dt>
            <dd>{ext.brawlerMvp}</dd>
          </div>
        )}
        {ext.brawlerMostUsed && (
          <div>
            <dt>Más usado</dt>
            <dd>{ext.brawlerMostUsed}</dd>
          </div>
        )}
        {ext.brawlerMostBanned && (
          <div>
            <dt>Más bloqueado</dt>
            <dd>{ext.brawlerMostBanned}</dd>
          </div>
        )}
        {ext.mvpPlayerSlug && (
          <div>
            <dt>MVP</dt>
            <dd>{ext.mvpPlayerSlug}</dd>
          </div>
        )}
      </dl>

      <pre className="bf-prediction-recap-full" aria-label="Resumen completo">
        {recapText}
      </pre>

      <div className="bf-prediction-recap-actions">
        <button type="button" className="bf-btn bf-btn-outline" onClick={() => void copyText()}>
          <Copy size={16} aria-hidden />
          {copied ? "Copiado" : "Copiar"}
        </button>
        <button type="button" className="bf-btn-secondary" onClick={downloadTxt}>
          <Download size={16} aria-hidden />
          Descargar
        </button>
        <button type="button" className="bf-btn bf-btn-yellow" onClick={() => void share()}>
          <Share2 size={16} aria-hidden />
          Compartir
        </button>
      </div>
    </article>
  );
}
