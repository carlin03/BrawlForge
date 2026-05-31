"use client";

import Link from "next/link";
import { FileSpreadsheet, Download, Upload } from "lucide-react";
import { CSV_TEMPLATES } from "@/lib/admin/catalog-csv-schema";

/** Rutas directas al importador CSV (Competición u Operaciones). */
export function AdminCsvImportGuide({ compact }: { compact?: boolean }) {
  const importHref = "/admin?module=competicion&tab=import";

  if (compact) {
    return (
      <div className="bf-csv-import-guide is-compact" role="note">
        <FileSpreadsheet size={18} aria-hidden />
        <div>
          <strong>Importar / exportar CSV</strong>
          <p>
            <code>teams-master.csv</code> (editor completo), <code>teams.csv</code> y <code>players.csv</code> son
            distintos. Más plantillas en{" "}
            <Link href={importHref}>Importar CSV</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="bf-csv-import-guide" aria-labelledby="bf-csv-guide-title">
      <h2 id="bf-csv-guide-title" className="bf-csv-import-guide-title">
        <FileSpreadsheet size={22} aria-hidden />
        Importar datos con CSV
      </h2>
      <p className="bf-csv-import-guide-lead">
        Cada tipo de dato tiene su propio archivo. <strong>No</strong> uses el mismo CSV para equipos y jugadores.
        Puedes importar el catálogo completo o una sola fila (un equipo, una noticia, un partido).
      </p>
      <p className="bf-csv-import-guide-lead" style={{ fontSize: 13, opacity: 0.9 }}>
        Subir <strong>uno a uno</strong> actualiza solo ese <code>slug</code>; no elimina otros equipos ni jugadores.
        Las columnas <code>meta_json</code>, <code>social_json</code> y <code>achievements_json</code> (equipos) alinean
        el CSV con la ficha rica del admin — si las dejas vacías, no se pierde lo que ya tenías guardado.
      </p>

      <div className="bf-csv-import-guide-grid">
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Equipos (global o uno)</h3>
          <p>
            <a href="/plantillas/teams-master-template.csv" download>teams-master-template.csv</a> — columnas v2 ·{" "}
            <a href="/plantillas/teams-master-example.csv" download>ejemplo completo</a> — todas las pestañas del editor
            (Equipos → Exportar CSV). También{" "}
            <a href="/plantillas/teams.csv" download>teams.csv</a> — catálogo básico o exporta un club desde{" "}
            <Link href="/admin?module=competicion&tab=teams">Equipos</Link> → <strong>Descargar CSV de este equipo</strong>.
          </p>
        </article>
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Jugadores (archivo aparte)</h3>
          <p>
            <a href="/plantillas/players.csv" download>players.csv</a> con columna <code>team_slug</code>. No va dentro de{" "}
            <code>teams.csv</code>.
          </p>
        </article>
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Torneos y partidos</h3>
          <p>
            <a href="/plantillas/tournaments.csv" download>tournaments.csv</a>,{" "}
            <a href="/plantillas/matches.csv" download>matches.csv</a> y opcional{" "}
            <a href="/plantillas/tournament_rosters.csv" download>tournament_rosters.csv</a>.
          </p>
        </article>
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Noticias y fantasy</h3>
          <p>
            <a href="/plantillas/news.csv" download>news.csv</a> (cuerpo con <code>|||</code> entre párrafos) y{" "}
            <a href="/plantillas/fantasy_market.csv" download>fantasy_market.csv</a>.
          </p>
        </article>
        <article className="bf-csv-import-guide-card is-dl">
          <Download size={20} aria-hidden />
          <h3>Todas las plantillas</h3>
          <p className="bf-csv-import-guide-dl-row">
            {CSV_TEMPLATES.map((t) => (
              <a
                key={t.id}
                href={`/plantillas/${t.filename}`}
                download
                className="bp-btn bp-btn-ghost bp-btn-sm"
              >
                {t.filename}
              </a>
            ))}
          </p>
        </article>
      </div>
    </section>
  );
}
