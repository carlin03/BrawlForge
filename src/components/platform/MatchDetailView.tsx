import Link from "next/link";
import { Panel, FormDots } from "@/components/platform/ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getMatch,
  getTeam,
  teamName,
  tournamentName,
  matches,
  openPredictions,
  getPlayersByTeam,
  getPredictionLabel,
  getPickRate,
  getFantasyRole,
} from "@/lib/data";
import { getPlayerPrice } from "@/lib/data/fantasy";

export function MatchDetailView({ id }: { id: string }) {
  const match = getMatch(id);
  if (!match) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Partido no encontrado.</p>
        <Link href="/matches">Ver partidos</Link>
      </div>
    );
  }

  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const winA = match.status === "finished" && match.scoreA > match.scoreB;
  const winB = match.status === "finished" && match.scoreB > match.scoreA;
  const h2h = matches.filter(
    (m) =>
      m.id !== match.id &&
      m.status === "finished" &&
      ((m.teamASlug === match.teamASlug && m.teamBSlug === match.teamBSlug) ||
        (m.teamASlug === match.teamBSlug && m.teamBSlug === match.teamASlug)),
  ).slice(0, 5);
  const vote = openPredictions.find((e) => e.matchId === match.id);
  const rosterA = getPlayersByTeam(match.teamASlug).slice(0, 3);
  const rosterB = getPlayersByTeam(match.teamBSlug).slice(0, 3);

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href={`/tournaments/${match.tournamentSlug}`} className="bp-chip bp-chip-blue">{tournamentName(match.tournamentSlug)}</Link>
        <span className="bp-chip">{match.stage}</span>
        <span className="bp-chip">{match.format}</span>
        {match.status === "live" && <span className="bp-chip bp-chip-live"><span className="bp-live-dot" /> En directo</span>}
      </div>

      <div className="bp-match-hero">
        <div className="bp-match-vs">
          <Link href={`/teams/${match.teamASlug}`} className="bp-match-team">
            <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={56} />
            <div style={{ fontWeight: 700, color: winA ? "var(--bp-gold)" : undefined }}>{teamName(match.teamASlug)}</div>
            {teamA && <FormDots form={teamA.form} />}
          </Link>
          <div>
            {match.status === "upcoming" ? (
              <div className="bp-match-score" style={{ color: "var(--bp-dim)", fontSize: "1.5rem" }}>VS</div>
            ) : (
              <div className="bp-match-score">
                <span style={{ color: winA ? "var(--bp-gold)" : undefined }}>{match.scoreA}</span>
                <span style={{ color: "var(--bp-dim)", margin: "0 8px" }}>–</span>
                <span style={{ color: winB ? "var(--bp-gold)" : undefined }}>{match.scoreB}</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--bp-dim)", marginTop: 8 }}>
              {new Date(match.date).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <Link href={`/teams/${match.teamBSlug}`} className="bp-match-team">
            <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={56} />
            <div style={{ fontWeight: 700, color: winB ? "var(--bp-gold)" : undefined }}>{teamName(match.teamBSlug)}</div>
            {teamB && <FormDots form={teamB.form} />}
          </Link>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/predictions" className="bp-btn bp-btn-blue">Votar</Link>
          <Link href="/fantasy" className="bp-btn bp-btn-gold">Fantasy</Link>
        </div>
      </div>

      <div className="bp-detail-grid">
        <Panel title="Comparativa roster">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bp-line)" }}>
            {[rosterA, rosterB].map((roster, side) => (
              <div key={side} style={{ background: "var(--bp-panel)" }}>
                <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, borderBottom: "1px solid var(--bp-line)" }}>
                  {side === 0 ? teamName(match.teamASlug) : teamName(match.teamBSlug)}
                </div>
                {roster.map((p) => p && (
                  <Link key={p.slug} href={`/players/${p.slug}`} className="bp-row">
                    <div className="bp-row-main">
                      <div className="bp-row-title">{p.ign}</div>
                      <div className="bp-row-sub">{getFantasyRole(p.slug)} · {getPickRate(p.slug)}%</div>
                    </div>
                    <span className="bp-row-stat gold">{getPlayerPrice(p.slug)}M</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </Panel>

        {vote ? (
          <Panel title="Predicción comunidad">
            <div className="bp-panel-body-pad">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                <span>{getPredictionLabel(vote, "A")}</span>
                <span>{getPredictionLabel(vote, "B")}</span>
              </div>
              <div className="bp-poll-bar">
                <div className="bp-poll-bar-a" style={{ width: `${vote.pickAPct}%` }} />
                <div className="bp-poll-bar-b" style={{ width: `${vote.pickBPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--bp-dim)", marginTop: 6 }}>
                <span>{vote.pickAPct}%</span><span>{vote.pickBPct}%</span>
              </div>
              <Link href="/predictions" className="bp-btn bp-btn-blue" style={{ marginTop: 14, width: "100%" }}>Votar este partido</Link>
            </div>
          </Panel>
        ) : (
          <Panel title="Predicción">
            <div className="bp-empty"><Link href="/predictions" className="bp-panel-link">Votar →</Link></div>
          </Panel>
        )}
      </div>

      {h2h.length > 0 && (
        <div style={{ marginTop: "var(--bp-gap-lg)" }}>
          <Panel title="Historial H2H" flush>
            {h2h.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`} className="bp-row">
                <div className="bp-row-main">
                  <div className="bp-row-title">{teamName(m.teamASlug)} {m.scoreA}–{m.scoreB} {teamName(m.teamBSlug)}</div>
                  <div className="bp-row-sub">{new Date(m.date).toLocaleDateString("es-ES")}</div>
                </div>
              </Link>
            ))}
          </Panel>
        </div>
      )}
    </>
  );
}
