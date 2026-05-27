import Link from "next/link";
import { Plus, X } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { getPlayer, getTeam, teamName } from "@/lib/data";
import { getFantasyRole } from "@/lib/data/fantasy-meta";

export interface ProRowProps {
  playerSlug: string;
  rank?: number;
  href?: string;
  isCaptain?: boolean;
  eventPoints?: number;
  price?: number;
  pickRate?: number;
  form?: readonly ("W" | "L")[];
  status?: "active" | "inactive" | "retired" | "fa";
  highlight?: "gold" | "silver" | "bronze";
  inSquad?: boolean;
  onPick?: () => void;
  onRemove?: () => void;
  onSetCaptain?: () => void;
  pickDisabled?: boolean;
  showRank?: boolean;
  showForm?: boolean;
  showRegion?: boolean;
  showPrice?: boolean;
  showRating?: boolean;
  showFantasy?: boolean;
  showEvent?: boolean;
  showPick?: boolean;
  showActions?: boolean;
}

export function ProRow({
  playerSlug,
  rank,
  href = `/players/${playerSlug}`,
  isCaptain,
  eventPoints,
  price,
  pickRate,
  form = [],
  status,
  highlight,
  inSquad,
  onPick,
  onRemove,
  onSetCaptain,
  pickDisabled,
  showRank = rank != null,
  showForm = true,
  showRegion = false,
  showPrice = false,
  showRating = true,
  showFantasy = false,
  showEvent = false,
  showPick = false,
  showActions = false,
}: ProRowProps) {
  const player = getPlayer(playerSlug);
  if (!player) return null;

  const team = getTeam(player.teamSlug);
  const role = getFantasyRole(playerSlug);
  const rowClass = [
    "es-pro-row",
    highlight ? `es-pro-row-${highlight}` : "",
    isCaptain ? "es-pro-row-captain" : "",
    inSquad ? "es-pro-row-in-squad" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={rowClass}>
      {showRank && (
        <td className={`es-pro-rank ${rank != null && rank <= 3 ? "es-pro-rank-top" : ""}`}>
          {rank ?? "—"}
        </td>
      )}

      <td className="es-pro-main">
        <Link href={href} className="es-pro-link">
          <TeamLogo slug={player.teamSlug} name={teamName(player.teamSlug)} size={22} />
          <span className="es-pro-name">{player.ign}</span>
          {isCaptain && <span className="es-pro-mvp">MVP</span>}
        </Link>
        <div className="es-pro-meta">
          {team ? (
            <Link href={`/teams/${team.slug}`} className="es-pro-club">
              {team.tag}
            </Link>
          ) : (
            <span className="es-pro-club es-pro-club-fa">FA</span>
          )}
          <span className="es-pro-dot">·</span>
          <span className="es-pro-role">{role}</span>
          {status && status !== "active" && (
            <>
              <span className="es-pro-dot">·</span>
              <span className={`es-pro-status es-pro-status-${status}`}>{status}</span>
            </>
          )}
        </div>
      </td>

      {showRegion && (
        <td className="es-pro-cell">
          <RegionBadge region={player.region} />
        </td>
      )}

      {showForm && (
        <td className="es-pro-cell es-pro-form">
          {form.slice(-5).map((r, i) => (
            <span key={i} className={r === "W" ? "es-form-w" : "es-form-l"} />
          ))}
          {form.length === 0 && <span className="nv-dim">—</span>}
        </td>
      )}

      {showFantasy && (
        <td className="es-pro-cell es-pro-num c-yellow">{player.fantasyPoints}</td>
      )}

      {showRating && (
        <td className="es-pro-cell es-pro-num c-blue">{player.rating.toFixed(2)}</td>
      )}

      {showPrice && price != null && (
        <td className="es-pro-cell es-pro-num">{price.toFixed(1)}M</td>
      )}

      {showPick && pickRate != null && (
        <td className="es-pro-cell es-pro-num nv-dim">{pickRate}%</td>
      )}

      {showEvent && (
        <td className="es-pro-cell es-pro-num c-yellow">{eventPoints ?? 0}</td>
      )}

      {onPick && (
        <td className="es-pro-cell es-pro-action">
          <button
            type="button"
            className="es-pro-add"
            disabled={pickDisabled || inSquad}
            onClick={onPick}
            title={inSquad ? "In lineup" : "Add to lineup"}
          >
            {inSquad ? "✓" : <Plus className="h-3.5 w-3.5" />}
          </button>
        </td>
      )}

      {showActions && (onRemove || onSetCaptain) && (
        <td className="es-pro-cell es-pro-actions">
          {!isCaptain && onSetCaptain && (
            <button type="button" className="es-pro-act es-pro-act-cap" onClick={onSetCaptain} title="Set MVP">
              MVP
            </button>
          )}
          {onRemove && (
            <button type="button" className="es-pro-act es-pro-act-del" onClick={onRemove} title="Quitar">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
