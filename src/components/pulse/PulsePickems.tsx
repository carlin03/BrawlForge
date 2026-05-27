import { PulseCard } from "./PulseUI";
import { PickemBracket, PickemStats } from "@/components/pickems/PickemBracket";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { pickemEvents } from "@/lib/data/pickems";
import { teamName } from "@/lib/data";

export function PulsePickems() {
  const wf2026 = pickemEvents.find((p) => p.slug === "wf-2026")!;
  const wf2025 = pickemEvents.find((p) => p.slug === "wf-2025")!;

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Pick&apos;em</h1>
        <p className="pl-page-sub">Bracket World Finals — elige campeón</p>
      </header>

      <PulseCard title={wf2026.name}>
        <div className="pl-card-body-pad">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <TournamentLogo slug="world-finals-2026" name="WF" size={40} />
            <div>
              <div style={{ fontWeight: 700 }}>{wf2026.name}</div>
              <div className="pl-dim" style={{ fontSize: 13 }}>Temporada activa</div>
            </div>
          </div>
          <PickemStats event={wf2026} />
          <div style={{ marginTop: 20, overflowX: "auto" }}><PickemBracket event={wf2026} /></div>
        </div>
      </PulseCard>

      <div style={{ marginTop: 20 }}>
        <PulseCard title={wf2025.name}>
          <div className="pl-card-body-pad">
            <PickemStats event={wf2025} />
            <PickemBracket event={wf2025} />
            <p style={{ textAlign: "center", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} className="pl-gold">
              <TeamLogo slug="crazy-raccoon" name="Crazy Raccoon" size={24} />
              Campeón: {teamName("crazy-raccoon")}
            </p>
          </div>
        </PulseCard>
      </div>
    </>
  );
}
