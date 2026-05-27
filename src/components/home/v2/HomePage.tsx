import Link from "next/link";
import { Crown, Flame, Zap } from "lucide-react";
import { ForgeCard, ForgeSection } from "@/components/forge/ForgeCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import {
  getLatestNews,
  getUpcomingMatches,
  getRecentMatches,
  tournaments,
  teamName,
} from "@/lib/data";
import { openPredictions } from "@/lib/data/predictions";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  userSquad,
  userFantasyProfile,
  getSquadEventTotal,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getPlayer, getTeam } from "@/lib/data";

function Hero() {
  const activeFantasy = getFantasyTournaments(true).find((t) => t.slug === DEFAULT_FANTASY_TOURNAMENT);
  return (
    <header className="forge-hero">
      <div className="forge-hero-inner">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="forge-badge forge-badge-blue">
              <Zap className="h-3 w-3" />
              Fantasy · {activeFantasy?.tournament.shortName ?? "BSC"}
            </span>
            <span className="forge-badge forge-badge-live">
              <span className="forge-dot-live" />
              Brawl Cup
            </span>
          </div>
          <h1 className="forge-hero-title">
            Brawl Stars.<br />
            <span style={{ color: "var(--brawl-yellow)" }}>Your game.</span>
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--forge-muted)]">
            Fantasy squads, community predictions, and championship pick&apos;ems — one competitive hub.
          </p>
          <div className="forge-hero-actions mt-6">
            <Link href="/fantasy" className="forge-btn forge-btn-yellow">
              Play Fantasy
            </Link>
            <Link href="/predictions" className="forge-btn forge-btn-red">
              <Flame className="h-4 w-4" />
              Vote now
            </Link>
            <Link href="/pickems" className="forge-btn forge-btn-ghost">
              Pick&apos;ems
            </Link>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Your rank", value: `#${userFantasyProfile.globalRank.toLocaleString()}`, color: "var(--brawl-blue)" },
            { label: "Points", value: String(userFantasyProfile.totalPoints), color: "var(--brawl-yellow)" },
            { label: "Streak", value: "5W", color: "var(--brawl-red)" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[14px] border border-[var(--forge-line)] bg-[var(--forge-raised)] px-5 py-4 text-center"
            >
              <div className="forge-label">{s.label}</div>
              <div className="forge-display mt-1 text-2xl" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function FantasySpotlight() {
  const eventTotal = getSquadEventTotal(userSquad);

  return (
    <ForgeCard title="My Squad" href="/fantasy" accent="blue">
      <div className="forge-card-body pt-0">
        <div className="forge-squad">
          {userSquad.map((slot) => {
            const player = getPlayer(slot.playerSlug);
            const team = player ? getTeam(player.teamSlug) : null;
            if (!player) return null;
            return (
              <Link
                key={slot.playerSlug}
                href="/fantasy"
                className={`forge-squad-slot ${slot.isCaptain ? "captain" : ""}`}
              >
                {slot.isCaptain && (
                  <Crown className="mx-auto mb-1 h-3.5 w-3.5 text-[var(--brawl-yellow)]" />
                )}
                {team && (
                  <div className="flex justify-center">
                    <TeamLogo slug={team.slug} name={team.name} size="lg" />
                  </div>
                )}
                <div className="forge-display mt-2 text-base">{player.ign}</div>
                <div className="forge-squad-pts">{slot.eventPoints}</div>
              </Link>
            );
          })}
        </div>
        <div className="forge-stat-row mt-4 rounded-[10px] overflow-hidden border border-[var(--forge-line)]">
          {[
            { label: "Total", value: userFantasyProfile.totalPoints, color: "var(--brawl-yellow)" },
            { label: "Torneo", value: eventTotal, color: "var(--brawl-blue)" },
            { label: "Budget", value: "18.5M", color: "var(--forge-text)" },
          ].map((s) => (
            <div key={s.label} className="forge-stat-cell">
              <div className="forge-label">{s.label}</div>
              <div className="forge-stat-val" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ForgeCard>
  );
}

function PredictionsSpotlight() {
  const featured = openPredictions.filter((p) => p.featured)[0] ?? openPredictions[0];
  if (!featured) return null;

  return (
    <ForgeCard title="Predictions" href="/predictions" accent="red">
      <div className="forge-card-body">
        <div className="forge-vs">
          <div className="forge-vs-side">
            <TeamLogo slug={featured.teamASlug} name={teamName(featured.teamASlug)} size="xl" />
            <span className="text-center text-xs font-bold leading-tight">
              {teamName(featured.teamASlug)}
            </span>
            <span className="forge-vs-pct text-[var(--brawl-blue)]">{featured.pickAPct}%</span>
          </div>
          <span className="forge-display text-sm text-[var(--forge-dim)]">VS</span>
          <div className="forge-vs-side">
            <TeamLogo slug={featured.teamBSlug} name={teamName(featured.teamBSlug)} size="xl" />
            <span className="text-center text-xs font-bold leading-tight">
              {teamName(featured.teamBSlug)}
            </span>
            <span className="forge-vs-pct text-[var(--brawl-red)]">{featured.pickBPct}%</span>
          </div>
        </div>
        <div className="forge-vs-bar">
          <div className="forge-vs-bar-a" style={{ width: `${featured.pickAPct}%` }} />
          <div className="forge-vs-bar-b" style={{ width: `${featured.pickBPct}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-[var(--forge-dim)]">
          <span>+{featured.rewardPoints} pts</span>
          <span>{featured.totalVotes.toLocaleString()} votes</span>
        </div>
        <Link href="/predictions" className="forge-btn forge-btn-red mt-4 w-full">
          Cast your vote
        </Link>
      </div>
    </ForgeCard>
  );
}

function UpcomingMatches() {
  const upcoming = getUpcomingMatches().slice(0, 3);
  const recent = getRecentMatches(2);

  return (
    <ForgeSection title="Match Center" href="/matches">
      <ForgeCard accent="yellow" lift={false}>
        {upcoming.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`} className="forge-match">
            <div className="forge-match-team">
              <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size="md" />
              <span className="forge-match-name">{teamName(m.teamASlug)}</span>
            </div>
            <div>
              <div className="forge-match-score text-[var(--forge-dim)]">vs</div>
              <div className="forge-match-meta text-center">{m.stage}</div>
            </div>
            <div className="forge-match-team right">
              <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size="md" />
              <span className="forge-match-name">{teamName(m.teamBSlug)}</span>
            </div>
          </Link>
        ))}
        {recent.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`} className="forge-match">
            <div className="forge-match-team">
              <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size="md" />
              <span className="forge-match-name">{teamName(m.teamASlug)}</span>
            </div>
            <div className="forge-match-score">
              <span className={m.scoreA > m.scoreB ? "text-[var(--brawl-yellow)]" : ""}>{m.scoreA}</span>
              <span className="text-[var(--forge-dim)]">:</span>
              <span className={m.scoreB > m.scoreA ? "text-[var(--brawl-yellow)]" : ""}>{m.scoreB}</span>
            </div>
            <div className="forge-match-team right">
              <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size="md" />
              <span className="forge-match-name">{teamName(m.teamBSlug)}</span>
            </div>
          </Link>
        ))}
      </ForgeCard>
    </ForgeSection>
  );
}

function PickemsAndTournaments() {
  const wf2026 = tournaments.find((t) => t.slug === "world-finals-2026");
  const active = tournaments.filter((t) => t.status !== "finished").slice(0, 2);

  return (
    <div className="forge-grid-duo">
      <ForgeCard title="Pick'ems" href="/pickems" accent="yellow">
        <div className="forge-card-body space-y-4">
          <div className="flex items-center gap-3">
            <TournamentLogo slug="world-finals-2026" name="WF 2026" size={44} />
            <div>
              <div className="font-bold">World Finals 2026</div>
              <div className="text-xs text-[var(--forge-dim)]">Tokyo · Bracket opens soon</div>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--forge-bg)]">
            <div
              className="h-full rounded-full"
              style={{
                width: "34%",
                background: "linear-gradient(90deg, var(--brawl-red), var(--brawl-yellow), var(--brawl-blue))",
              }}
            />
          </div>
          <Link href="/pickems" className="forge-btn forge-btn-ghost w-full text-sm">
            Enter bracket
          </Link>
        </div>
      </ForgeCard>

      <ForgeCard title="Tournaments" href="/tournaments">
        <div className="divide-y divide-[var(--forge-line)]">
          {[wf2026, ...active].filter(Boolean).slice(0, 3).map((t) => (
            <Link
              key={t!.slug}
              href={`/tournaments/${t!.slug}`}
              className="flex items-center gap-3 px-[18px] py-3.5 transition-colors hover:bg-[var(--forge-overlay)]"
            >
              <TournamentLogo slug={t!.slug} name={t!.shortName} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{t!.shortName}</div>
                <div className="text-xs text-[var(--forge-dim)]">{t!.prizePool}</div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase ${
                  t!.status === "live"
                    ? "text-[var(--brawl-red)]"
                    : t!.status === "upcoming"
                      ? "text-[var(--brawl-yellow)]"
                      : "text-[var(--forge-dim)]"
                }`}
              >
                {t!.status}
              </span>
            </Link>
          ))}
        </div>
      </ForgeCard>
    </div>
  );
}

function NewsBlock() {
  const articles = getLatestNews(4);
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <ForgeSection title="News" href="/news">
      <ForgeCard lift={false}>
        <div className="forge-card-body">
          {featured && (
            <Link href={`/news/${featured.slug}`} className="forge-news-featured block">
              <div className="mb-2 flex gap-2">
                <span className="forge-badge forge-badge-blue">{featured.category}</span>
                {featured.hot && <span className="forge-badge forge-badge-live">Hot</span>}
              </div>
              <h3 className="forge-display text-lg leading-snug">{featured.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--forge-muted)]">{featured.excerpt}</p>
            </Link>
          )}
          {rest.map((a) => (
            <Link key={a.slug} href={`/news/${a.slug}`} className="forge-news-row">
              <span className="text-sm font-semibold">{a.title}</span>
            </Link>
          ))}
        </div>
      </ForgeCard>
    </ForgeSection>
  );
}

export function HomePageV2() {
  return (
    <>
      <Hero />
      <div className="forge-grid-hero mb-8">
        <FantasySpotlight />
        <PredictionsSpotlight />
      </div>
      <UpcomingMatches />
      <div className="mt-8">
        <PickemsAndTournaments />
      </div>
      <div className="mt-8">
        <NewsBlock />
      </div>
    </>
  );
}
