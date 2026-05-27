import Link from "next/link";
import { PulseCard } from "./PulseUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teams } from "@/lib/data";

export function PulseRankings() {
  const sorted = [...teams].sort((a, b) => a.rank - b.rank);

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Rankings</h1>
        <p className="pl-page-sub">Power ranking mundial · {sorted.length} organizaciones</p>
      </header>

      <PulseCard title="Clasificación">
        {sorted.map((t) => (
          <Link key={t.slug} href={`/teams/${t.slug}`} className="pl-row">
            <span className={`pl-row-rank ${t.rank <= 3 ? "top" : ""}`}>{t.rank}</span>
            <TeamLogo slug={t.slug} name={t.name} size={36} />
            <div className="pl-row-main">
              <div className="pl-row-title">{t.name}</div>
              <div className="pl-row-sub">{t.region} · {t.tag}</div>
            </div>
            <span className="pl-row-val">${(t.earnings / 1000).toFixed(0)}K</span>
          </Link>
        ))}
      </PulseCard>
    </>
  );
}
