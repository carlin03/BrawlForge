import Link from "next/link";
import { ArenaPanel, ArenaBadge } from "./ArenaUI";
import { PickemBracket, PickemStats } from "@/components/pickems/PickemBracket";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { pickemEvents } from "@/lib/data/pickems";
import { teamName } from "@/lib/data";

export function ArenaPickems() {
  const wf2026 = pickemEvents.find((p) => p.slug === "wf-2026")!;
  const wf2025 = pickemEvents.find((p) => p.slug === "wf-2025")!;

  return (
    <>
      <div className="ar-page-head">
        <h1 className="ar-h1">Pick&apos;em</h1>
        <p className="ar-lead">Brackets completos · predice campeones · compite por recompensas de temporada.</p>
      </div>

      <div className="ar-meta-row">
        <div className="ar-meta-item">
          <strong className="gold">2</strong>
          <span>Eventos</span>
        </div>
        <div className="ar-meta-item">
          <strong>847</strong>
          <span>Tu ranking</span>
        </div>
        <div className="ar-meta-item">
          <strong>72%</strong>
          <span>Precisión</span>
        </div>
        <div className="ar-meta-item">
          <strong style={{ color: "var(--ar-vote)" }}>+500</strong>
          <span>Recompensa max</span>
        </div>
      </div>

      <ArenaPanel title={wf2026.name}>
        <div className="ar-panel-pad" style={{ borderBottom: "1px solid var(--ar-line)", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <ArenaBadge variant="red">En curso</ArenaBadge>
          <ArenaBadge variant="dim">Cierra en 4d 12h</ArenaBadge>
          <span style={{ fontSize: 12, color: "var(--ar-dim)", marginLeft: "auto" }}>12.4K participantes · 68% completado bracket</span>
        </div>
        <div style={{ padding: 16 }}>
          <PickemStats event={wf2026} />
          <div style={{ marginTop: 16, overflowX: "auto" }}><PickemBracket event={wf2026} /></div>
        </div>
      </ArenaPanel>

      <div style={{ marginTop: "var(--ar-gap-lg)" }}>
        <ArenaPanel title={`${wf2025.name} — completado`}>
          <div className="ar-panel-pad" style={{ borderBottom: "1px solid var(--ar-line)", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <ArenaBadge variant="green">Finalizado</ArenaBadge>
            <ArenaBadge variant="gold">+320 pts ganados</ArenaBadge>
            <span style={{ fontSize: 12, color: "var(--ar-dim)" }}>Tu precisión: 78% · mejor que el 64% de la comunidad</span>
          </div>
          <div style={{ padding: 16 }}>
            <PickemStats event={wf2025} />
            <PickemBracket event={wf2025} />
            <div className="ar-compact-row" style={{ marginTop: 12, border: "1px solid var(--ar-line)", borderRadius: 8, cursor: "default" }}>
              <TeamLogo slug="crazy-raccoon" name="CR" size={28} />
              <div className="ar-compact-main">
                <div className="ar-compact-title">Campeón: {teamName("crazy-raccoon")}</div>
                <div className="ar-compact-sub">42% de la comunidad acertó el ganador</div>
              </div>
              <ArenaBadge variant="gold">Winner</ArenaBadge>
            </div>
          </div>
        </ArenaPanel>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: "var(--ar-dim)" }}>
        ¿Solo quieres votar un partido? <Link href="/predictions" style={{ color: "var(--ar-vote)" }}>Votaciones rápidas</Link>
      </p>
    </>
  );
}
