import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { AdminCsvTemplates } from "@/components/admin/AdminCsvTemplates";
import { BrandMark } from "@/components/ui/BrandMark";

export const metadata = {
  title: "Plantillas CSV — BrawlForge",
  description: "Guía de importación masiva: equipos, jugadores y noticias para Supabase.",
};

export default function PlantillasPage() {
  return (
    <div className="bf-admin-page bf-plantillas-page">
      <header className="bf-plantillas-hero">
        <Link href="/" className="bf-plantillas-back">
          <ArrowLeft size={16} /> Inicio
        </Link>
        <div className="bf-plantillas-brand">
          <BrandMark size={36} />
          <div>
            <p className="bf-plantillas-kicker">
              <FileSpreadsheet size={14} /> Catálogo Supabase
            </p>
            <h1>Plantillas CSV</h1>
            <p>
              Equipos con descripción, jugadores con bio y noticias multipárrafo. Pensado para rellenar como una web
              real y volcar todo de golpe a la base de datos.
            </p>
          </div>
        </div>
        <Link href="/admin?tab=import" className="bp-btn bp-btn-gold">
          Ir a importar (admin)
        </Link>
      </header>
      <AdminCsvTemplates />
    </div>
  );
}
