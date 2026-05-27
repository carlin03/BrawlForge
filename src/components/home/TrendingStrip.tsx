import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { getTopFantasyPlayers, teams } from "@/lib/data";

export function TrendingStrip() {
  const hotPlayers = getTopFantasyPlayers(4);
  const hotTeams = [...teams].sort((a, b) => b.rankChange - a.rankChange).slice(0, 4);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent-yellow" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-text-secondary">Trending now</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="trending-block">
          <div className="trending-block-head">Hot players</div>
          <div className="trending-scroll">
            {hotPlayers.map((p, i) => (
              <Link key={p.slug} href={`/players/${p.slug}`} className="trending-item">
                <span className="trending-rank">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold">{p.ign}</div>
                  <div className="text-[11px] text-text-muted">{p.fantasyOwnership}% owned</div>
                </div>
                <span className="font-display text-sm font-bold text-accent-blue">{p.fantasyPoints} FP</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="trending-block">
          <div className="trending-block-head">Rising teams</div>
          <div className="trending-scroll">
            {hotTeams.map((t) => (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="trending-item">
                <TeamLogo slug={t.slug} name={t.name} size="sm" />
                <CountryFlag country={t.country} size={16} />
                <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
                <span className={`text-xs font-bold ${t.rankChange >= 0 ? "text-accent-success" : "text-accent-red"}`}>
                  {t.rankChange >= 0 ? "+" : ""}{t.rankChange}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
