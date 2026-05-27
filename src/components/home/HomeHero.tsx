import Link from "next/link";
import { Flame, Trophy, Zap } from "lucide-react";
import { DEFAULT_FANTASY_TOURNAMENT, userFantasyProfile } from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { openPredictions } from "@/lib/data/predictions";

export function HomeHero() {
  const openVotes = openPredictions.length;
  const activeFantasy = getFantasyTournaments(true).find((t) => t.slug === DEFAULT_FANTASY_TOURNAMENT);

  return (
    <section className="hub-hero mb-6">
      <div className="hub-hero-glow" />
      <div className="hub-hero-content">
        <div className="hub-hero-main">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="hub-pill hub-pill-blue">
              <Zap className="h-3 w-3" />
              Fantasy · {activeFantasy?.tournament.shortName ?? "BSC"}
            </span>
            <span className="hub-pill hub-pill-red">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent-red" />
              Brawl Cup Live
            </span>
            <span className="hub-pill hub-pill-yellow">
              <Trophy className="h-3 w-3" />
              $1M World Finals
            </span>
          </div>

          <h1 className="hub-hero-title">
            Play. Predict. <span className="text-accent-yellow">Dominate.</span>
          </h1>
          <p className="hub-hero-sub">
            Build your 3-player fantasy squad, vote on every match, and climb the global Brawl Stars esports board.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/fantasy" className="btn-game btn-game-yellow">
              My Squad · {userFantasyProfile.totalPoints} pts
            </Link>
            <Link href="/predictions" className="btn-game btn-game-red">
              <Flame className="h-4 w-4" />
              {openVotes} votes open
            </Link>
            <Link href="/pickems" className="btn-game btn-game-outline">
              Pick&apos;ems
            </Link>
          </div>
        </div>

        <div className="hub-hero-stats">
          {[
            { label: "Global rank", value: `#${userFantasyProfile.globalRank.toLocaleString()}`, accent: "text-accent-blue" },
            { label: "Predictor streak", value: "5W", accent: "text-accent-red" },
            { label: "Pro teams", value: "12", accent: "text-accent-yellow" },
          ].map((s) => (
            <div key={s.label} className="hub-stat-card">
              <div className="hub-stat-label">{s.label}</div>
              <div className={`hub-stat-value ${s.accent}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
