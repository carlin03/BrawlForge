import Link from "next/link";
import { ArenaPanel } from "@/components/arena/ArenaUI";

export default function CommunityPage() {
  return (
    <>
      <h1 className="ar-h1">Comunidad</h1>
      <p className="ar-lead">Foros y ligas privadas — llegará pronto.</p>
      <ArenaPanel title="Próximamente">
        <div style={{ padding: 32, textAlign: "center" }}>
          <Link href="/predictions" className="ar-btn ar-btn-vote">Ir a votaciones</Link>
        </div>
      </ArenaPanel>
    </>
  );
}
