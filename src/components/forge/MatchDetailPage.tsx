import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Block, Chip, FormDots, StatStrip } from "@/components/forge/ui";
import {
  getMatch,
  getTeam,
  teamName,
  tournamentName,
  getLegacyMatchList,
  openPredictions,
  getPlayersByTeam,
  getPredictionLabel,
  getPickRate,
  getFantasyRole,
} from "@/lib/data";
import { getPlayerPrice } from "@/lib/data/fantasy";
import { notFound } from "next/navigation";

export function ForgeMatchDetail({ id }: { id: string }) {
  const match = getMatch(id);
  if (!match) notFound();

  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const winA = match.status === "finished" && match.scoreA > match.scoreB;
  const winB = match.status === "finished" && match.scoreB > match.scoreA;
  const h2h = getLegacyMatchList().filter(
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
        <Chip variant="blue">{tournamentName(match.tournamentSlug)}</Chip>
        <Chip>{match.stage}</Chip>
        <Chip>{match.format}</Chip>
        {match.status === "live" && <Chip variant="live"><span className="fg-dot-live" /> En directo</Chip>}
      </div>

      <div className="fg-detail-hero">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          <Link href={`/teams/${match.teamASlug}`} style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}>
            <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={56} />
            <div style={{ fontWeight: 700, marginTop: 8, color: winA ? "var(--fg-gold)" : undefined }}>{teamName(match.teamASlug, match)}</div>
            {teamA && <FormDots form={teamA.form} />}
          </Link>
          <div style={{ textAlign: "center" }}>
            {match.status === "upcoming" ? (
              <div style={{ fontFamily: "var(--fg-head)", fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-dim)" }}>VS</div>
            ) : (
              <div style={{ fontFamily: "var(--fg-head)", fontSize: "2rem", fontWeight: 700 }}>
                <span style={{ color: winA ? "var(--fg-gold)" : undefined }}>{match.scoreA}</span>
                <span style={{ color: "var(--fg-dim)", margin: "0 6px" }}>–</span>
                <span style={{ color: winB ? "var(--fg-gold)" : undefined }}>{match.scoreB}</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--fg-dim)", marginTop: 8 }}>
              {new Date(match.date).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <Link href={`/teams/${match.teamBSlug}`} style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}>
            <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={56} />
            <div style={{ fontWeight: 700, marginTop: 8, color: winB ? "var(--fg-gold)" : undefined }}>{teamName(match.teamBSlug, match)}</div>
            {teamB && <FormDots form={teamB.form} />}
          </Link>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/predictions" className="fg-btn fg-btn-blue">Votar</Link>
          <Link href="/fantasy" className="fg-btn fg-btn-gold">Fantasy</Link>
        </div>
      </div>

      <div className="fg-detail-grid">
        <Block title="Comparativa roster">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--fg-line)" }}>
            {[rosterA, rosterB].map((roster, side) => (
              <div key={side} style={{ background: "var(--fg-surface)" }}>
                <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, borderBottom: "1px solid var(--fg-line)" }}>
                  {side === 0 ? teamName(match.teamASlug, match) : teamName(match.teamBSlug, match)}
                </div>
                {roster.map((p) => p && (
                  <Link key={p.slug} href={`/players/${p.slug}`} className="fg-row">
                    <div className="fg-row-main">
                      <div className="fg-row-title">{p.ign}</div>
                      <div className="fg-row-sub">{getFantasyRole(p.slug)} · {getPickRate(p.slug)}%</div>
                    </div>
                    <span className="fg-row-stat">{getPlayerPrice(p.slug)}M</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </Block>

        {vote ? (
          <Block title="Predicción comunidad" href="/predictions">
            <div className="fg-poll">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 10 }}>
                <span>{getPredictionLabel(vote, "A")}</span>
                <span>{getPredictionLabel(vote, "B")}</span>
              </div>
              <div className="fg-poll-bar">
                <div className="fg-poll-bar-a" style={{ width: `${vote.pickAPct}%` }} />
                <div className="fg-poll-bar-b" style={{ width: `${vote.pickBPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-dim)", marginTop: 6 }}>
                <span>{vote.pickAPct}%</span><span>{vote.pickBPct}%</span>
              </div>
            </div>
          </Block>
        ) : (
          <Block title="Predicción">
            <div className="fg-empty"><Link href="/predictions" className="fg-block-link">Votar este partido →</Link></div>
          </Block>
        )}
      </div>

      {h2h.length > 0 && (
        <div style={{ marginTop: "var(--fg-gap-lg)" }}>
          <Block title="Historial H2H">
            {h2h.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`} className="fg-row">
                <div className="fg-row-main">
                  <div className="fg-row-title">{teamName(m.teamASlug)} {m.scoreA}–{m.scoreB} {teamName(m.teamBSlug)}</div>
                  <div className="fg-row-sub">{new Date(m.date).toLocaleDateString("es-ES")}</div>
                </div>
              </Link>
            ))}
          </Block>
        </div>
      )}
    </>
  );
}
