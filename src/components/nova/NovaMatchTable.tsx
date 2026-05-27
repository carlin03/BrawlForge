import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function NovaMatchTable({
  matches,
  showEvent = true,
  premium = false,
}: {
  matches: EsportsMatch[];
  showEvent?: boolean;
  premium?: boolean;
}) {
  if (!matches.length) return <p style={{ padding: 16, color: "var(--nv-dim)" }}>Sin partidos.</p>;

  const tableClass = premium ? "es-table es-table-premium" : "nv-table";

  return (
    <table className={tableClass}>
      <thead>
        <tr>
          <th style={{ width: 52 }}>Hora</th>
          <th>Local</th>
          <th style={{ width: 64, textAlign: "center" }}>Scr</th>
          <th style={{ textAlign: "right" }}>Visitante</th>
          {showEvent && <th style={{ width: 120 }}>Evento</th>}
        </tr>
      </thead>
      <tbody>
        {matches.map((m) => {
          const winA = m.status === "finished" && m.scoreA > m.scoreB;
          const winB = m.status === "finished" && m.scoreB > m.scoreA;
          const live = m.status === "live";
          const nameA = teamName(m.teamASlug);
          const nameB = teamName(m.teamBSlug);
          const logoSize = premium ? 28 : 20;
          const rowClass = premium ? `es-pro-row ${live ? "es-pro-row-live" : ""}` : live ? "row-live" : "";

          return (
            <tr key={m.id} className={rowClass}>
              <td className="nv-dim">
                {live ? (
                  <span className="c-red" style={{ fontWeight: 800, fontSize: 10 }}>LIVE</span>
                ) : m.status === "upcoming" ? (
                  new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                ) : (
                  "FT"
                )}
              </td>
              <td className={premium ? "es-pro-main" : undefined}>
                <Link href={`/matches/${m.id}`} className={premium ? "es-pro-link" : "nv-team-cell"}>
                  <TeamLogo slug={m.teamASlug} name={nameA} size={logoSize} />
                  <span className={winA ? "c-yellow" : ""}>{nameA}</span>
                </Link>
              </td>
              <td className="nv-mono" style={{ textAlign: "center", fontFamily: "var(--nv-display)", fontWeight: 700 }}>
                {m.status === "upcoming" ? (
                  "—"
                ) : (
                  <>
                    <span className={winA ? "c-yellow" : "nv-dim"}>{m.scoreA}</span>
                    <span className="nv-dim">:</span>
                    <span className={winB ? "c-yellow" : "nv-dim"}>{m.scoreB}</span>
                  </>
                )}
              </td>
              <td style={{ textAlign: "right" }} className={premium ? "es-pro-main" : undefined}>
                <Link href={`/matches/${m.id}`} className={premium ? "es-pro-link" : "nv-team-cell end"} style={premium ? { justifyContent: "flex-end" } : undefined}>
                  <TeamLogo slug={m.teamBSlug} name={nameB} size={logoSize} />
                  <span className={winB ? "c-yellow" : ""}>{nameB}</span>
                </Link>
              </td>
              {showEvent && <td className="nv-dim" style={{ fontSize: 11 }}>{tournamentName(m.tournamentSlug)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
