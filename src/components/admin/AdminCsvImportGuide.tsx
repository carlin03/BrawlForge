"use client";

import Link from "next/link";
import { FileSpreadsheet, Download, Upload } from "lucide-react";

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
            Sube <code>teams.csv</code> (todos o 1 fila = 1 equipo) y <code>players.csv</code> en{" "}
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
        Estás en el lugar correcto. Aquí subes archivos a Supabase sin editar uno por uno en el formulario.
      </p>

      <div className="bf-csv-import-guide-grid">
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Todos los equipos (global)</h3>
          <p>
            Descarga <a href="/plantillas/teams.csv" download>teams.csv</a>, rellena todas las filas y súbelo
            abajo en <strong>Equipos (teams.csv)</strong>.
          </p>
        </article>
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Un solo equipo</h3>
          <p>
            En la pestaña <Link href="/admin?module=competicion&tab=teams">Equipos</Link>, elige un club y pulsa{" "}
            <strong>Descargar CSV de este equipo</strong>. Edita esa fila y vuelve a subir solo{" "}
            <code>teams.csv</code> (una fila vale).
          </p>
        </article>
        <article className="bf-csv-import-guide-card">
          <Upload size={20} aria-hidden />
          <h3>Jugadores (global o por club)</h3>
          <p>
            <a href="/plantillas/players.csv" download>players.csv</a> con columna <code>team_slug</code>. O exporta
            la plantilla de un equipo desde la ficha del club.
          </p>
        </article>
        <article className="bf-csv-import-guide-card is-dl">
          <Download size={20} aria-hidden />
          <h3>Plantillas oficiales</h3>
          <p>
            <a href="/plantillas/teams.csv" download className="bp-btn bp-btn-ghost bp-btn-sm">
              teams.csv
            </a>{" "}
            <a href="/plantillas/players.csv" download className="bp-btn bp-btn-ghost bp-btn-sm">
              players.csv
            </a>{" "}
            <a href="/plantillas/news.csv" download className="bp-btn bp-btn-ghost bp-btn-sm">
              news.csv
            </a>
          </p>
        </article>
      </div>
    </section>
  );
}
