import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam, teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

function tag(slug: string) {
  return getTeam(slug)?.tag ?? teamName(slug).slice(0, 3).toUpperCase();
}

export function FormDots({ form }: { form: readonly ("W" | "L")[] }) {
  return (
    <span className="ar-form-dots" aria-label={`Forma: ${form.join("")}`}>
      {form.map((f, i) => (
        <span key={i} className={`ar-form-dot ${f === "W" ? "w" : "l"}`} />
      ))}
    </span>
  );
}

export function ArenaBadge({
  children,
  variant = "dim",
}: {
  children: React.ReactNode;
  variant?: "gold" | "blue" | "red" | "dim" | "green";
}) {
  return <span className={`ar-badge ar-badge-${variant}`}>{children}</span>;
}

export function PriceChange({ change }: { change: number }) {
  if (change > 0.05) return <span className="ar-price-up">+{change.toFixed(1)}</span>;
  if (change < -0.05) return <span className="ar-price-down">{change.toFixed(1)}</span>;
  return <span className="ar-price-flat">—</span>;
}

export function RankChange({ delta }: { delta: number }) {
  if (delta > 0) return <span className="ar-rank-change up">▲{delta}</span>;
  if (delta < 0) return <span className="ar-rank-change down">▼{Math.abs(delta)}</span>;
  return <span className="ar-rank-change" style={{ color: "var(--ar-dim)" }}>—</span>;
}

export function ArenaMatchLine({ match, showMeta = true }: { match: EsportsMatch; showMeta?: boolean }) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;
  const a = teamName(match.teamASlug);
  const b = teamName(match.teamBSlug);
  const date = new Date(match.date);
  const important = match.stage.toLowerCase().includes("final") || match.stage.toLowerCase().includes("semi");

  return (
    <Link href={`/matches/${match.id}`} className={`ar-match ${live ? "ar-match-live" : ""}`}>
      <div className="ar-match-time">
        {live ? (
          <span className="live"><span className="ar-live-dot" />Live</span>
        ) : finished ? (
          <>
            <strong>Final</strong>
            {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </>
        ) : (
          <>
            <strong>{date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</strong>
            {date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
          </>
        )}
      </div>

      <div className="ar-match-side">
        <TeamLogo slug={match.teamASlug} name={a} size={32} />
        <div>
          <div className={`ar-match-name ${winA ? "ar-match-win" : ""}`}>{a}</div>
          <div className="ar-match-tag">{tag(match.teamASlug)}</div>
        </div>
      </div>

      <div className="ar-match-mid">
        {match.status === "upcoming" ? (
          <span className="vs">vs</span>
        ) : (
          <>
            <span className={winA ? "ar-match-win" : ""}>{match.scoreA}</span>
            <span style={{ color: "var(--ar-dim)", margin: "0 2px" }}>–</span>
            <span className={winB ? "ar-match-win" : ""}>{match.scoreB}</span>
          </>
        )}
      </div>

      <div className="ar-match-side right">
        <TeamLogo slug={match.teamBSlug} name={b} size={32} />
        <div>
          <div className={`ar-match-name ${winB ? "ar-match-win" : ""}`}>{b}</div>
          <div className="ar-match-tag">{tag(match.teamBSlug)}</div>
        </div>
      </div>

      {showMeta && (
        <div className="ar-match-meta">
          {important && <ArenaBadge variant="gold">{match.stage}</ArenaBadge>}
          {!important && match.stage && <strong>{match.stage}</strong>}
          <span>{match.format}</span>
          <span>{tournamentName(match.tournamentSlug)}</span>
        </div>
      )}
    </Link>
  );
}

export function ArenaPanel({
  title,
  href,
  linkLabel = "Ver todo",
  tabs,
  children,
  className,
  compact,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section className={`ar-panel ${className ?? ""}`.trim()}>
      <div
        className="ar-panel-pad"
        style={{
          paddingBottom: tabs ? 8 : compact ? 10 : 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderBottom: "1px solid var(--ar-line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" }}>
          <h2 className="ar-section-title" style={{ margin: 0 }}>{title}</h2>
          {tabs}
        </div>
        {href && (
          <Link href={href} className="ar-section-link">{linkLabel}</Link>
        )}
      </div>
      {children}
    </section>
  );
}
