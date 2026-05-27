import Link from "next/link";
import { ArenaPanel } from "@/components/arena/ArenaUI";

export default function StatsPage() {
  return (
    <>
      <h1 className="ar-h1">Estadísticas</h1>
      <p className="ar-lead">Mapas, brawlers y métricas del meta — en camino.</p>
      <ArenaPanel title="Próximamente">
        <div style={{ padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--ar-muted)", marginBottom: 16 }}>Estamos montando el módulo de stats.</p>
          <Link href="/teams" className="ar-btn ar-btn-ghost">Ver equipos</Link>
        </div>
      </ArenaPanel>
    </>
  );
}
