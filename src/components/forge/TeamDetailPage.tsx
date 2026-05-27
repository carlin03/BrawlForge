import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Block, Chip, FormDots, MatchRow, StatStrip } from "@/components/forge/ui";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { getTeam, getPlayersByTeam, matches, getPlayer, getPickRate, getFantasyRole, hasFantasyForTournament } from "@/lib/data";
import { getPlayerPrice, transferMarket, DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";

export function ForgeTeamDetail({ slug }: { slug: string }) {
  const team = getTeam(slug);
  if (!team) notFound();

  const roster = getPlayersByTeam(slug);
  const rosterPlayers = roster.length ? roster : team.roster.map((s) => getPlayer(s)).filter(Boolean);
  const teamMatches = matches
    .filter((m) => m.teamASlug === slug || m.teamBSlug === slug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent = teamMatches.slice(0, 5);
  const upcoming = teamMatches.filter((m) => m.status === "upcoming").slice(0, 3);
  const wins = team.form.filter((f) => f === "W").length;

  return (
    <>
      <div className="fg-detail-hero">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
          <TeamLogo slug={team.slug} name={team.name} size={64} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <Chip variant="gold">#{team.rank}</Chip>
              <RegionBadge region={team.region} />
              <FormDots form={team.form} />
            </div>
            <h1 className="fg-h1" style={{ marginBottom: 4 }}>{team.name}</h1>
            <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: 13 }}>
              {team.tag} · ${(team.earnings / 1000).toFixed(0)}K premios · {wins}W forma reciente
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hasFantasyForTournament(DEFAULT_FANTASY_TOURNAMENT) && (
              <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="fg-btn fg-btn-gold">Fantasy</Link>
            )}
            <Link href="/teams" className="fg-btn fg-btn-ghost">Equipos</Link>
          </div>
        </div>
      </div>

      <StatStrip
        items={[
          { label: "Ranking", value: `#${team.rank}`, accent: "var(--fg-gold)" },
          { label: "Premios", value: `$${(team.earnings / 1000).toFixed(0)}K` },
          { label: "Trofeos", value: String(team.achievements.length) },
          { label: "Forma", value: `${wins}W` },
        ]}
      />

      <div className="fg-detail-grid">
        <Block title="Roster">
          {rosterPlayers
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .sort((a, b) => b.rating - a.rating)
            .map((p) => {
              const mp = transferMarket.find((m) => m.playerSlug === p.slug);
              return (
                <Link key={p.slug} href={`/players/${p.slug}`} className="fg-row">
                  <div className="fg-row-main">
                    <div className="fg-row-title">{p.ign}</div>
                    <div className="fg-row-sub">{getFantasyRole(p.slug)} · {getPickRate(p.slug)}% prop. · {p.rating.toFixed(2)}</div>
                  </div>
                  <span className="fg-row-stat" style={{ color: "var(--fg-gold)" }}>{getPlayerPrice(p.slug)}M</span>
                  {mp && <span className="fg-row-sub">{p.fantasyPoints} pts</span>}
                </Link>
              );
            })}
        </Block>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--fg-gap-lg)" }}>
          <Block title="Logros">
            {team.achievements.length ? team.achievements.slice(0, 4).map((a, i) => (
              <div key={i} className="fg-row" style={{ cursor: "default" }}>
                <Chip variant="gold">{a.place}</Chip>
                <div className="fg-row-main">
                  <div className="fg-row-title">{a.tournament}</div>
                  <div className="fg-row-sub">{a.date}</div>
                </div>
              </div>
            )) : <div className="fg-empty">Sin logros registrados.</div>}
          </Block>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div style={{ marginTop: "var(--fg-gap-lg)" }}>
          <Block title="Próximos partidos">
            {upcoming.map((m) => <MatchRow key={m.id} match={m} compact />)}
          </Block>
        </div>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: "var(--fg-gap-lg)" }}>
          <Block title="Resultados recientes">
            {recent.map((m) => <MatchRow key={m.id} match={m} compact />)}
          </Block>
        </div>
      )}
    </>
  );
}
