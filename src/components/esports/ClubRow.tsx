import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { EsportsTeam } from "@/lib/data/teams";

interface ClubRowProps {
  team: EsportsTeam;
  highlight?: "gold" | "silver" | "bronze";
  showForm?: boolean;
  showEarnings?: boolean;
  showRegion?: boolean;
}

export function ClubRow({
  team,
  highlight,
  showForm = true,
  showEarnings = true,
  showRegion = true,
}: ClubRowProps) {
  const rowClass = ["es-club-row", highlight ? `es-club-row-${highlight}` : ""].filter(Boolean).join(" ");

  return (
    <tr className={rowClass}>
      <td className={`es-pro-rank ${team.rank <= 3 ? "es-pro-rank-top" : ""}`}>{team.rank}</td>
      <td className="es-pro-main">
        <Link href={`/teams/${team.slug}`} className="es-pro-link">
          <TeamLogo slug={team.slug} name={team.name} size={24} />
          <span className="es-pro-name">{team.tag}</span>
        </Link>
        <div className="es-pro-meta">
          <span className="es-pro-club">{team.name}</span>
        </div>
      </td>
      {showRegion && (
        <td className="es-pro-cell">
          <RegionBadge region={team.region} />
        </td>
      )}
      {showForm && (
        <td className="es-pro-cell es-pro-form">
          {team.form.map((f, i) => (
            <span key={i} className={f === "W" ? "es-form-w" : "es-form-l"} />
          ))}
        </td>
      )}
      {showEarnings && (
        <td className="es-pro-cell es-pro-num" style={{ textAlign: "right" }}>
          ${(team.earnings / 1000).toFixed(0)}K
        </td>
      )}
    </tr>
  );
}
