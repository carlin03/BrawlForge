import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam, teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function Chip({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "live" | "gold" | "blue";
}) {
  const cls = variant === "live" ? "fg-chip-live" : variant === "gold" ? "fg-chip-gold" : variant === "blue" ? "fg-chip-blue" : "";
  return <span className={`fg-chip ${cls}`.trim()}>{children}</span>;
}

export function Block({
  title,
  href,
  linkLabel = "Ver todo",
  children,
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="fg-block">
      <div className="fg-block-head">
        <h2 className="fg-block-title">{title}</h2>
        {action ?? (href ? <Link href={href} className="fg-block-link">{linkLabel}</Link> : null)}
      </div>
      {children}
    </section>
  );
}

export function FormDots({ form }: { form: readonly ("W" | "L")[] }) {
  return (
    <span className="fg-form-dots">
      {form.map((f, i) => (
        <span key={i} className={`fg-form-dot ${f === "W" ? "w" : "l"}`} />
      ))}
    </span>
  );
}

export function PriceDelta({ change }: { change: number }) {
  if (change > 0.05) return <span className="fg-price-up">+{change.toFixed(1)}</span>;
  if (change < -0.05) return <span className="fg-price-down">{change.toFixed(1)}</span>;
  return <span style={{ color: "var(--fg-dim)", fontSize: 11 }}>—</span>;
}

export function MatchRow({ match, compact }: { match: EsportsMatch; compact?: boolean }) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;
  const date = new Date(match.date);

  return (
    <Link href={`/matches/${match.id}`} className="fg-match">
      <div className="fg-match-time">
        {live ? (
          <span style={{ color: "var(--fg-red)" }}><span className="fg-dot-live" /> Live</span>
        ) : finished ? (
          date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
        ) : (
          date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        )}
      </div>
      <div className="fg-match-team">
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={compact ? 24 : 28} />
        <span className={winA ? "fg-match-win" : ""}>{teamName(match.teamASlug)}</span>
      </div>
      <div className="fg-match-score">
        {match.status === "upcoming" ? (
          <span style={{ color: "var(--fg-dim)", fontSize: 11 }}>vs</span>
        ) : (
          <>
            <span className={winA ? "fg-match-win" : ""}>{match.scoreA}</span>
            <span style={{ color: "var(--fg-dim)", margin: "0 3px" }}>–</span>
            <span className={winB ? "fg-match-win" : ""}>{match.scoreB}</span>
          </>
        )}
      </div>
      <div className="fg-match-team right">
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={compact ? 24 : 28} />
        <span className={winB ? "fg-match-win" : ""}>{teamName(match.teamBSlug)}</span>
      </div>
      {!compact && (
        <div className="fg-match-meta">
          <div>{match.stage}</div>
          <div>{tournamentName(match.tournamentSlug)}</div>
        </div>
      )}
    </Link>
  );
}

export function StatStrip({ items }: { items: { label: string; value: string; accent?: string }[] }) {
  return (
    <div className="fg-stat-strip">
      {items.map((s) => (
        <div key={s.label} className="fg-stat-cell">
          <strong style={s.accent ? { color: s.accent } : undefined}>{s.value}</strong>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
