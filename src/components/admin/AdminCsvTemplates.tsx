"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp, Users, User, Newspaper, Table2 } from "lucide-react";
import { CSV_TEMPLATES, type CsvTemplateDef } from "@/lib/admin/catalog-csv-schema";

const ICONS = {
  teams: Users,
  players: User,
  news: Newspaper,
} as const;

function TemplateCard({ template }: { template: CsvTemplateDef }) {
  const [open, setOpen] = useState(template.id === "teams");
  const Icon = ICONS[template.icon];

  return (
    <article className={`bf-csv-card ${open ? "is-open" : ""}`}>
      <header className="bf-csv-card-head">
        <div className="bf-csv-card-icon" aria-hidden>
          <Icon size={22} />
        </div>
        <div className="bf-csv-card-titles">
          <h3>{template.title}</h3>
          <p>{template.subtitle}</p>
          <span className="bf-csv-card-meta">
            <code>{template.filename}</code> → <code>{template.table}</code>
          </span>
        </div>
        <a
          href={`/plantillas/${template.filename}`}
          download
          className="bp-btn bp-btn-gold bf-csv-dl"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={16} /> Descargar
        </a>
        <button
          type="button"
          className="bf-csv-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </header>

      {open && (
        <div className="bf-csv-card-body">
          <p className="bf-csv-card-note">
            El CSV incluye <strong>comentarios</strong> (<code>#</code>), una fila <code>_ayuda</code> con
            descripción de cada columna y una fila <code>_ejemplo</code> que no se importa. Los datos reales van
            debajo.
          </p>

          <div className="bf-csv-preview">
            <span className="bf-csv-preview-label">
              <Table2 size={14} /> Vista previa (ejemplo)
            </span>
            <div className="bf-csv-preview-card">
              {template.id === "teams" && (
                <>
                  <div className="bf-csv-preview-tag">EMEA · #1</div>
                  <h4>SK Gaming</h4>
                  <p>
                    SK Gaming es uno de los clubes históricos del BSC 2026. Esta descripción aparece en la ficha
                    pública del equipo.
                  </p>
                  <div className="bf-csv-preview-chips">yoshi · nowy297 · ope</div>
                </>
              )}
              {template.id === "players" && (
                <>
                  <div className="bf-csv-preview-tag">SK Gaming · 92 pts</div>
                  <h4>Yoshi</h4>
                  <p>Jugador estrella de SK Gaming. Capitán habitual en Monthly Finals.</p>
                </>
              )}
              {template.id === "news" && (
                <>
                  <span className="bf-csv-preview-hot">Hot</span>
                  <div className="bf-csv-preview-tag">Resultados · 4 min</div>
                  <h4>HMBLE conquista el Brawl Cup 2026</h4>
                  <p>La gran final dejó al campeón europeo en lo más alto del circuito.</p>
                </>
              )}
            </div>
          </div>

          <div className="bf-csv-fields-wrap">
            <table className="bf-csv-fields">
              <thead>
                <tr>
                  <th>Columna</th>
                  <th>Qué es</th>
                  <th>Ejemplo</th>
                </tr>
              </thead>
              <tbody>
                {template.fields.map((f) => (
                  <tr key={f.key}>
                    <td>
                      <code>{f.key}</code>
                      {f.required && <span className="bf-csv-req">obligatorio</span>}
                    </td>
                    <td>{f.description}</td>
                    <td>
                      <code className="bf-csv-ex">{f.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}

export function AdminCsvTemplates() {
  return (
    <section className="bf-csv-hub">
      <header className="bf-csv-hub-head">
        <h2 className="bf-admin-section-title">Plantillas CSV</h2>
        <p className="bf-admin-meta">
          Descarga, edita en Excel o Google Sheets y sube abajo. Cada plantilla documenta las columnas y trae datos
          BSC de ejemplo — como una ficha web real con <strong>description</strong> y <strong>bio</strong>.
        </p>
        <a href="/plantillas" className="bf-home-link" target="_blank" rel="noopener noreferrer">
          Abrir guía pública →
        </a>
      </header>
      <div className="bf-csv-cards">
        {CSV_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
    </section>
  );
}
