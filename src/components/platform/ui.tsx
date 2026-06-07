import Link from "next/link";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";
import type { EsportsMatch } from "@/lib/data/matches";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getTeam, teamName, tournamentName, getPredictionLabel, getPredictionTournament, hasCommunityVotes } from "@/lib/data";
import { getMatchEnrichment } from "@/lib/data/match-meta";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { MatchCountdown } from "@/components/platform/MatchCountdown";
import { MatchSourceBadge } from "@/components/platform/MatchSourceBadge";

function tag(slug: string) {
  return getTeam(slug)?.tag ?? teamName(slug).slice(0, 3).toUpperCase();
}

export function FormDots({ form }: { form: readonly ("W" | "L")[] }) {
  return (
    <span className="bp-form" aria-label={`Forma: ${form.join("")}`}>
      {form.map((f, i) => (
        <span key={i} className={f === "W" ? "w" : "l"} />
      ))}
    </span>
  );
}

export function PriceDelta({ change }: { change: number }) {
  if (change > 0.05) return <span className="bp-up">+{change.toFixed(1)}</span>;
  if (change < -0.05) return <span className="bp-down">{change.toFixed(1)}</span>;
  return null;
}

export function SparkBars({ data, max = 100 }: { data: { label: string; pct: number }[]; max?: number }) {
  return (
    <div className="bp-spark-bars">
      {data.map((d) => (
        <div key={d.label} className="bp-spark-col">
          <div className="bp-spark-track">
            <div className="bp-spark-fill" style={{ height: `${Math.round((d.pct / max) * 100)}%` }} />
          </div>
          <span className="bp-spark-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function matchImportance(stage: string): "high" | "mid" | null {
  const s = stage.toLowerCase();
  if (s.includes("final") || s.includes("semifinal") || s.includes("grand")) return "high";
  if (s.includes("quarter") || s.includes("playoff") || s.includes("bracket")) return "mid";
  return null;
}

export function Panel({
  title,
  href,
  linkLabel = "Ver todo",
  children,
  flush,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`bp-panel ${flush ? "bp-panel-flush" : ""} ${className ?? ""}`.trim()}>
      <div className="bp-panel-head">
        <h2>{title}</h2>
        {href && <Link href={href} className="bp-panel-link">{linkLabel}</Link>}
      </div>
      <div className="bp-panel-body">{children}</div>
    </section>
  );
}

export function FeaturedPoll({ event }: { event: PredictionEvent }) {
  const hasVotes = hasCommunityVotes(event);
  const leader = event.pickAPct >= event.pickBPct ? "A" : "B";
  const confidence = Math.max(event.pickAPct, event.pickBPct);
  const isClose = hasVotes && confidence < 55;
  const isRivalry = hasVotes && confidence >= 55 && confidence < 70;
  const labelA = getPredictionLabel(event, "A");
  const labelB = getPredictionLabel(event, "B");

  return (
    <div className={`bp-poll-featured ${isRivalry || isClose ? "is-rivalry" : ""} ${isClose ? "is-close" : ""}`}>
      {(isClose || isRivalry) && (
        <span className="bp-poll-featured-badge">
          {isClose ? "Voto dividido" : "Rivalidad"}
        </span>
      )}
      <div className="bp-poll-featured-head">
        <TournamentLogo slug={event.tournamentSlug} name={getPredictionTournament(event)} size={28} />
        <div>
          <div className="bp-poll-featured-tourney">{getPredictionTournament(event)}</div>
          <div className="bp-poll-featured-stage">{event.stage} · +{event.rewardPoints} pts</div>
        </div>
        <div className="bp-poll-featured-votes">
          {hasVotes ? `${(event.totalVotes / 1000).toFixed(1)}K votos` : "Vota ahora"}
        </div>
      </div>
      <div className="bp-poll-featured-rivalry">
        <button type="button" className={`bp-poll-side ${leader === "A" ? "leading" : ""}`}>
          <TeamLogo slug={event.teamASlug} name={labelA} size={48} />
          <span className="bp-poll-side-name">{labelA}</span>
          <span className="bp-poll-side-pct">{hasVotes ? `${event.pickAPct}%` : "—"}</span>
        </button>
        <div className="bp-poll-featured-vs">VS</div>
        <button type="button" className={`bp-poll-side ${leader === "B" ? "leading" : ""}`}>
          <TeamLogo slug={event.teamBSlug} name={labelB} size={48} />
          <span className="bp-poll-side-name">{labelB}</span>
          <span className="bp-poll-side-pct">{hasVotes ? `${event.pickBPct}%` : "—"}</span>
        </button>
      </div>
      {hasVotes && (
        <div className="bp-poll-bar bp-poll-bar-lg">
          <div className="bp-poll-bar-a" style={{ width: `${event.pickAPct}%` }} />
          <div className="bp-poll-bar-b" style={{ width: `${event.pickBPct}%` }} />
        </div>
      )}
      <div className="bp-poll-featured-foot">
        {hasVotes ? (
          <>
            <span>{confidence}% confianza comunitaria</span>
            <span>Comunidad favorece a {getPredictionLabel(event, leader)}</span>
          </>
        ) : (
          <span>Elige ganador — datos reales del circuito Tier B+</span>
        )}
      </div>
    </div>
  );
}

export function FeaturedMatch({ match, tag: tagLabel }: { match: EsportsMatch; tag?: string }) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const enrich = getMatchEnrichment(match);
  const upcoming = match.status === "upcoming";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;

  return (
    <Link href={`/matches/${match.id}`} className={`bp-match-featured bf-hover-lift bf-shine-hover ${live ? "is-live" : ""}`}>
      <div className="bp-match-featured-glow" aria-hidden />
      <div className="bp-match-featured-top">
        {tagLabel && <span className="bp-chip bp-chip-gold">{tagLabel}</span>}
        {live && <span className="bp-chip bp-chip-live"><span className="bp-live-dot" /> En directo</span>}
        {!live && upcoming && <MatchCountdown dateStr={match.date} className="bp-match-featured-countdown" />}
        <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={24} />
        <MatchSourceBadge match={match} />
        <span className="bp-match-featured-meta">{match.stage}</span>
      </div>
      <div className="bp-match-featured-body">
        <div className={`bp-match-featured-team ${winA ? "winner" : ""}`}>
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={56} />
          <span className="bp-match-featured-name">{teamName(match.teamASlug, match)}</span>
          {teamA?.form && <FormDots form={teamA.form} />}
          {finished && <span className="bp-match-featured-score">{match.scoreA}</span>}
        </div>
        <div className="bp-match-featured-mid">
          {!finished ? (
            <>
              <span className="bp-match-featured-vs">VS</span>
              {upcoming && !live && (
                <MatchCountdown dateStr={match.date} className="bp-match-featured-starts" prefix="Empieza en " />
              )}
            </>
          ) : (
            <span className="bp-match-featured-final">FT</span>
          )}
        </div>
        <div className={`bp-match-featured-team ${winB ? "winner" : ""}`}>
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={56} />
          <span className="bp-match-featured-name">{teamName(match.teamBSlug, match)}</span>
          {teamB?.form && <FormDots form={teamB.form} />}
          {finished && <span className="bp-match-featured-score">{match.scoreB}</span>}
        </div>
      </div>
      <div className="bp-match-featured-foot">{enrich.quickStat}</div>
    </Link>
  );
}

export function MatchLine({ match, compact, rich }: { match: EsportsMatch; compact?: boolean; rich?: boolean }) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;
  const date = new Date(match.date);
  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const enrich = rich ? getMatchEnrichment(match) : null;
  const upcoming = rich && match.status === "upcoming";
  const importance = rich ? matchImportance(match.stage) : null;

  return (
    <Link href={`/matches/${match.id}`} className={`bp-match bf-hover-lift bf-shine-hover ${rich ? "bp-match-rich" : ""}`}>
      {rich && (
        <div className="bp-match-tourney">
          <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={22} />
        </div>
      )}
      <div className="bp-match-time">
        {live ? (
          <span style={{ color: "var(--bp-red)" }}><span className="bp-live-dot" /> Live</span>
        ) : finished ? (
          <>
            <strong>FT</strong>
            {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </>
        ) : upcoming ? (
          <>
            <strong>
              <MatchCountdown dateStr={match.date} />
            </strong>
            <span>{date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}</span>
          </>
        ) : (
          <>
            <strong>{date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</strong>
            {date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
          </>
        )}
      </div>
      <div className="bp-match-side">
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={rich ? 24 : 28} />
        <div>
          <div className={`bp-match-name ${winA ? "bp-match-win" : ""}`}>{teamName(match.teamASlug, match)}</div>
          {!compact && <div className="bp-match-tag">{tag(match.teamASlug)}</div>}
          {rich && teamA?.form && <FormDots form={teamA.form} />}
        </div>
      </div>
      <div className="bp-match-mid">
        {match.status === "upcoming" ? (
          <span style={{ fontSize: 11, color: "var(--bp-dim)" }}>vs</span>
        ) : (
          <>
            <span className={winA ? "bp-match-win" : ""}>{match.scoreA}</span>
            <span className="bp-match-score-sep">:</span>
            <span className={winB ? "bp-match-win" : ""}>{match.scoreB}</span>
          </>
        )}
      </div>
      <div className="bp-match-side right">
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={rich ? 24 : 28} />
        <div>
          <div className={`bp-match-name ${winB ? "bp-match-win" : ""}`}>{teamName(match.teamBSlug, match)}</div>
          {!compact && <div className="bp-match-tag">{tag(match.teamBSlug)}</div>}
          {rich && teamB?.form && <FormDots form={teamB.form} />}
        </div>
      </div>
      {rich ? (
        <div className="bp-match-extra">
          {importance === "high" && <span className="bp-chip bp-chip-live" style={{ fontSize: 9, padding: "2px 6px" }}>Clave</span>}
          {importance === "mid" && <span className="bp-chip" style={{ fontSize: 9, padding: "2px 6px" }}>Playoff</span>}
          <span className="bp-match-extra-stat">{enrich?.quickStat}</span>
          <span className="bp-match-extra-stage">{match.stage}</span>
        </div>
      ) : !compact && (
        <div className="bp-match-meta">
          <div>{match.stage}</div>
          <div>{tournamentName(match.tournamentSlug)}</div>
        </div>
      )}
    </Link>
  );
}
