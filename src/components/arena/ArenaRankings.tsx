import Link from "next/link";
import { ArenaPanel } from "@/components/arena/ArenaUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teams } from "@/lib/data";

export function ArenaRankings() {
  const sorted = [...teams].sort((a, b) => a.rank - b.rank);

  return (
    <>
      <h1 className="ar-h1">Ranking global</h1>
      <p className="ar-lead">Posición por premios acumulados y forma reciente en el circuito.</p>
      <ArenaPanel title={`${sorted.length} equipos`}>
        {sorted.map((t) => (
          <Link key={t.slug} href={`/teams/${t.slug}`} className="ar-team">
            <span className={`ar-team-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
            <TeamLogo slug={t.slug} name={t.name} size={36} />
            <div className="ar-team-info">
              <div className="ar-team-name">{t.name}</div>
              <div className="ar-team-sub">{t.region} · {t.tag}</div>
            </div>
            <span style={{ fontFamily: "var(--ar-head)", fontWeight: 600, color: "var(--ar-muted)" }}>
              ${(t.earnings / 1000).toFixed(0)}K
            </span>
          </Link>
        ))}
      </ArenaPanel>
    </>
  );
}
