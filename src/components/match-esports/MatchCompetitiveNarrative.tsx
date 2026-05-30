"use client";

import Link from "next/link";
import { Trophy, Flame, Target, Clock, Globe, Radio, Calendar } from "lucide-react";
import type { EsportsMatch } from "@/lib/data/matches";
import { parseMatchMeta, displayStatusLabel, featuredLabelFromMeta } from "@/lib/data/match-meta";
import { tournamentName } from "@/lib/data";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { MatchRoundVisual } from "@/components/match-esports/MatchRoundVisual";

export function MatchCompetitiveNarrative({ match }: { match: EsportsMatch }) {
  const meta = parseMatchMeta(match.meta);
  const dt = new Date(match.date);
  const status = displayStatusLabel(meta.display_status, match.status);
  const isLive = match.status === "live";

  return (
    <section className="bf-match-narrative" aria-label="Contexto del partido">
      <div className="bf-match-narrative-grid">
        <Link href={`/tournaments/${match.tournamentSlug}`} className="bf-match-narrative-card is-tournament">
          <Trophy size={22} className="bf-match-narrative-icon" aria-hidden />
          <div>
            <span className="bf-match-narrative-kicker">Torneo</span>
            <strong className="bf-match-narrative-value">
              <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={24} />
              {tournamentName(match.tournamentSlug)}
            </strong>
          </div>
        </Link>

        <div className="bf-match-narrative-card is-round">
          <Flame size={22} className="bf-match-narrative-icon" aria-hidden />
          <div>
            <span className="bf-match-narrative-kicker">Ronda</span>
            <MatchRoundVisual stage={match.stage || meta.round_type || "Group Stage"} size="md" />
          </div>
        </div>

        <div className="bf-match-narrative-card is-format">
          <Target size={22} className="bf-match-narrative-icon" aria-hidden />
          <div>
            <span className="bf-match-narrative-kicker">Formato</span>
            <strong className="bf-match-narrative-value">{match.format}</strong>
          </div>
        </div>

        <div className="bf-match-narrative-card is-time">
          <Calendar size={22} className="bf-match-narrative-icon" aria-hidden />
          <div>
            <span className="bf-match-narrative-kicker">Fecha y hora</span>
            <strong className="bf-match-narrative-value">
              {dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </strong>
            <span className="bf-match-narrative-sub">
              <Clock size={12} aria-hidden />{" "}
              {dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        <div className="bf-match-narrative-card is-region">
          <Globe size={22} className="bf-match-narrative-icon" aria-hidden />
          <div>
            <span className="bf-match-narrative-kicker">Región</span>
            <strong className="bf-match-narrative-value">{match.region}</strong>
          </div>
        </div>

        <div className={`bf-match-narrative-card is-status ${isLive ? "is-live" : ""}`}>
          {isLive ? <Radio size={22} className="bf-match-narrative-icon" aria-hidden /> : null}
          <div>
            <span className="bf-match-narrative-kicker">Estado</span>
            <strong className="bf-match-narrative-value">{isLive ? "En vivo" : status}</strong>
          </div>
        </div>
      </div>

      {meta.importance && meta.importance !== "normal" && (
        <p className="bf-match-narrative-featured">
          <Flame size={16} aria-hidden /> {featuredLabelFromMeta(meta)}
        </p>
      )}
    </section>
  );
}
