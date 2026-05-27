import Link from "next/link";
import type { EsportsPlayer } from "@/lib/data/players";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface PlayerRowProps {
  player: EsportsPlayer;
  rank: number;
  price?: number;
}

export function PlayerRow({ player, rank, price }: PlayerRowProps) {
  return (
    <Link href={`/players/${player.slug}`} className="es-row">
      <span className={`es-row-rank ${rank <= 3 ? "top" : ""}`}>{rank}</span>
      <TeamLogo slug={player.teamSlug} name={teamName(player.teamSlug)} size={22} />
      <div className="es-row-main">
        <div className="es-row-title">{player.ign}</div>
        <div className="es-row-sub">
          {teamName(player.teamSlug)} · {player.role}
        </div>
      </div>
      {price !== undefined && <span className="es-row-val">${price}</span>}
      <span className="es-row-val" style={{ color: "var(--es-gold)" }}>
        {player.rating.toFixed(1)}
      </span>
    </Link>
  );
}
