"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Copy, Download, Share2, Trophy, Target, Ban, Users, TrendingUp } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { teamName } from "@/lib/data";
import {
  mapCountFromExactScore,
  resolveMatchMapOrder,
  visiblePredictionMapSlots,
} from "@/lib/data/series-map-utils";
import { parseMatchMeta } from "@/lib/data/match-meta";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import { useAuth } from "@/contexts/AuthContext";
import { siteHost } from "@/lib/site-url";

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
  if (ext.brawlerLowestWr) lines.push(`Menor WR: ${ext.brawlerLowestWr}`);
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
  const [showRaw, setShowRaw] = useState(false);

  const displayName = profile?.ign || profile?.displayName || "Jugador";
  const userId = profile?.id ?? user?.id ?? "—";
  const parsed = parseMatchMeta(meta);
  const mapOrder = useMemo(() => resolveMatchMapOrder(meta, match.format), [meta, match.format]);
  const mapSlots = useMemo(
    () =>
      visiblePredictionMapSlots(
        mapOrder,
        ext.exactScore,
        parsed.maps?.decisive,
        match.format,
      ),
    [mapOrder, ext.exactScore, parsed.maps?.decisive, match.format],
  );
  const mapCount = mapCountFromExactScore(ext.exactScore, match.format);

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
        /* fallback */
      }
    }
    void copyText();
  }, [recapText, copyText]);

  if (!winnerPick) return null;

  return (
    <section className="bf-prediction-recap-wrap" id="bf-prediction-recap">
      <header className="bf-prediction-recap-section-head">
        <h2 className="bf-match-esports-h2">Tu predicción</h2>
        <p className="bf-match-section-lead">Resumen para compartir o guardar</p>
      </header>

      <article className="bf-prediction-recap-card is-premium" ref={cardRef}>
        <div className="bf-prediction-recap-glow" aria-hidden />

        <header className="bf-prediction-recap-brand">
          <BrandMark size={40} />
          <div className="bf-prediction-recap-brand-text">
            <strong>BrawlForge</strong>
            <span className="bf-prediction-recap-user">
              {displayName}
              <em>ID {userId.slice(0, 8)}</em>
            </span>
          </div>
          <span className="bf-prediction-recap-format">{match.format}</span>
        </header>

        <div className="bf-prediction-recap-duel">
          <div
            className={`bf-prediction-recap-team is-a ${winnerPick === "A" ? "is-winner-pick" : ""}`}
          >
            <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={52} />
            <span>{teamName(match.teamASlug)}</span>
            {winnerPick === "A" && (
              <span className="bf-prediction-recap-winner-tag">
                <Trophy size={12} aria-hidden />
                Ganador
              </span>
            )}
          </div>
          <div className="bf-prediction-recap-center">
            <span className="bf-prediction-recap-vs">VS</span>
            {ext.exactScore && (
              <span className="bf-prediction-recap-score-pill">{ext.exactScore}</span>
            )}
          </div>
          <div
            className={`bf-prediction-recap-team is-b ${winnerPick === "B" ? "is-winner-pick" : ""}`}
          >
            <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={52} />
            <span>{teamName(match.teamBSlug)}</span>
            {winnerPick === "B" && (
              <span className="bf-prediction-recap-winner-tag">
                <Trophy size={12} aria-hidden />
                Ganador
              </span>
            )}
          </div>
        </div>

        {(ext.brawlerMvp || ext.brawlerMostUsed || ext.brawlerMostBanned || ext.mvpPlayerSlug) && (
          <div className="bf-prediction-recap-brawlers">
            <h3 className="bf-prediction-recap-block-title">Brawlers del partido</h3>
            <div className="bf-prediction-recap-brawler-row">
              {ext.brawlerMvp && (
                <div className="bf-prediction-recap-brawler-item">
                  <TrendingUp size={14} aria-hidden />
                  <span>Mejor WR</span>
                  <BrawlerAssetIcon name={ext.brawlerMvp} size={48} hideName />
                  <em>{ext.brawlerMvp}</em>
                </div>
              )}
              {ext.brawlerMostUsed && (
                <div className="bf-prediction-recap-brawler-item">
                  <Users size={14} aria-hidden />
                  <span>Más usado</span>
                  <BrawlerAssetIcon name={ext.brawlerMostUsed} size={48} hideName />
                  <em>{ext.brawlerMostUsed}</em>
                </div>
              )}
              {ext.brawlerMostBanned && (
                <div className="bf-prediction-recap-brawler-item">
                  <Ban size={14} aria-hidden />
                  <span>Más bloqueado</span>
                  <BrawlerAssetIcon name={ext.brawlerMostBanned} size={48} hideName variant="ban" />
                  <em>{ext.brawlerMostBanned}</em>
                </div>
              )}
              {ext.mvpPlayerSlug && (
                <div className="bf-prediction-recap-brawler-item is-player">
                  <Target size={14} aria-hidden />
                  <span>MVP jugador</span>
                  <em>{ext.mvpPlayerSlug}</em>
                </div>
              )}
            </div>
          </div>
        )}

        {mapSlots.length > 0 && (
          <div className="bf-prediction-recap-maps">
            <h3 className="bf-prediction-recap-block-title">
              Serie por mapas
              {mapCount != null && (
                <span className="bf-prediction-recap-map-count">{mapCount} mapas</span>
              )}
            </h3>
            <ul className="bf-prediction-recap-map-list">
              {mapSlots.map((slot) => {
                const w = ext.mapWinners?.[slot.index];
                const picks = ext.mapBrawlerPicks?.[slot.index];
                const cBans = ext.mapBrawlerBans?.[slot.index] ?? [];
                const tBans = ext.mapTeamBans?.[slot.index];
                return (
                  <li
                    key={`${slot.name}-${slot.index}`}
                    className={`bf-prediction-recap-map-item ${slot.decisive ? "is-decisive" : ""}`}
                  >
                    <div className="bf-prediction-recap-map-head">
                      <span className="bf-prediction-recap-map-num">Mapa {slot.index + 1}</span>
                      <strong>{slot.name}</strong>
                      {slot.decisive && <span className="bf-map-series-decisive-badge">Decisivo</span>}
                    </div>
                    {w && (
                      <p className="bf-prediction-recap-map-winner">
                        <TeamLogo
                          slug={w === "A" ? match.teamASlug : match.teamBSlug}
                          name=""
                          size={20}
                        />
                        {teamName(w === "A" ? match.teamASlug : match.teamBSlug)}
                      </p>
                    )}
                    <div className="bf-prediction-recap-map-draft">
                      {picks?.a?.length ? (
                        <div className="bf-prediction-recap-draft-col">
                          <span>{teamName(match.teamASlug)}</span>
                          <div className="bf-prediction-recap-icons">
                            {picks.a.map((n) => (
                              <BrawlerAssetIcon key={n} name={n} size={36} hideName />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {cBans.length > 0 && (
                        <div className="bf-prediction-recap-draft-col is-bans">
                          <span>Bloqueos</span>
                          <div className="bf-prediction-recap-icons">
                            {cBans.map((n) => (
                              <BrawlerAssetIcon key={n} name={n} size={36} hideName variant="ban" />
                            ))}
                          </div>
                        </div>
                      )}
                      {picks?.b?.length ? (
                        <div className="bf-prediction-recap-draft-col">
                          <span>{teamName(match.teamBSlug)}</span>
                          <div className="bf-prediction-recap-icons">
                            {picks.b.map((n) => (
                              <BrawlerAssetIcon key={n} name={n} size={36} hideName />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {(tBans?.a?.length || tBans?.b?.length) && (
                      <div className="bf-prediction-recap-team-bans">
                        {tBans.a?.map((n) => (
                          <BrawlerAssetIcon key={`a-${n}`} name={n} size={32} hideName variant="ban" />
                        ))}
                        {tBans.b?.map((n) => (
                          <BrawlerAssetIcon key={`b-${n}`} name={n} size={32} hideName variant="ban" />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <footer className="bf-prediction-recap-footer">
          <span className="bf-prediction-recap-domain">{siteHost()}</span>
          <button
            type="button"
            className="bf-prediction-recap-raw-toggle"
            onClick={() => setShowRaw((s) => !s)}
          >
            {showRaw ? "Ocultar texto" : "Ver texto plano"}
          </button>
        </footer>

        {showRaw && (
          <pre className="bf-prediction-recap-full" aria-label="Resumen texto">
            {recapText}
          </pre>
        )}

        <div className="bf-prediction-recap-actions">
          <button type="button" className="bf-btn bf-btn-outline" onClick={() => void copyText()}>
            <Copy size={16} aria-hidden />
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button type="button" className="bf-btn bf-btn-outline" onClick={downloadTxt}>
            <Download size={16} aria-hidden />
            Descargar
          </button>
          <button type="button" className="bf-btn bf-btn-yellow" onClick={() => void share()}>
            <Share2 size={16} aria-hidden />
            Compartir
          </button>
        </div>
      </article>
    </section>
  );
}
