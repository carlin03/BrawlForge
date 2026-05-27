import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import type { NewsArticle } from "@/lib/data/news";
import { newsCoverGradient } from "@/lib/news-ui";
import { getTeam, getTournament, teamName } from "@/lib/data";

export function NewsCover({
  article,
  size = "large",
}: {
  article: NewsArticle;
  size?: "large" | "card";
}) {
  const primaryTeam = article.relatedTeams?.[0];
  const team = primaryTeam ? getTeam(primaryTeam) : null;
  const tournament = article.relatedTournament ? getTournament(article.relatedTournament) : null;

  return (
    <div
      className={`nw-cover ${size === "large" ? "nw-cover-lg" : "nw-cover-sm"}`}
      style={{ background: newsCoverGradient(article.coverAccent) }}
    >
      <div className="nw-cover-pattern" />
      <div className="nw-cover-logos">
        {team && (
          <TeamLogo slug={team.slug} name={team.name} size={size === "large" ? 120 : 64} />
        )}
        {article.relatedTeams && article.relatedTeams.length > 1 && (
          <TeamLogo
            slug={article.relatedTeams[1]}
            name={teamName(article.relatedTeams[1])}
            size={size === "large" ? 96 : 52}
          />
        )}
        {!team && tournament && (
          <TournamentLogo slug={tournament.slug} name={tournament.shortName} size={size === "large" ? 100 : 56} />
        )}
      </div>
      <div className="nw-cover-category">{article.category}</div>
    </div>
  );
}
