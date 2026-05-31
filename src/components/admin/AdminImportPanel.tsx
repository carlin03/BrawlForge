"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { AdminCsvTemplates } from "@/components/admin/AdminCsvTemplates";
import { AdminCsvImportGuide } from "@/components/admin/AdminCsvImportGuide";
import {
  CSV_TEMPLATE_GROUPS,
  getCsvTemplate,
  type CsvTemplateId,
} from "@/lib/admin/catalog-csv-schema";

type ImportFileKey = CsvTemplateId;

const UPLOAD_BY_GROUP: { group: (typeof CSV_TEMPLATE_GROUPS)[number]["id"]; files: ImportFileKey[] }[] = [
  { group: "clubs", files: ["teams", "players"] },
  { group: "competition", files: ["tournaments", "tournament_rosters", "matches"] },
  { group: "content", files: ["news", "fantasy_market"] },
];

export function AdminImportPanel({ onDone }: { onDone?: () => void }) {
  const [files, setFiles] = useState<Partial<Record<ImportFileKey, File>>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function setFile(key: ImportFileKey, file: File | null) {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Object.keys(files).length) {
      setMsg("Elige al menos un CSV.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const form = new FormData();
      for (const [key, file] of Object.entries(files)) {
        form.append(key, file);
      }
      const res = await fetch("/api/admin/import-csv", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      const parts = Object.entries(data.summary ?? {})
        .map(([k, v]) => {
          const s = v as { count: number; error?: string };
          return `${k}: ${s.count}${s.error ? ` (${s.error})` : ""}`;
        })
        .join(" · ");
      setMsg((data.message || "Importado") + (parts ? ` — ${parts}` : ""));
      onDone?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  }

  return (
    <div className="bf-admin-import">
      <div className="bf-admin-logo-help" role="note">
        <strong>¿No ves datos en Supabase?</strong>
        <p>
          Las tablas existen tras las migraciones SQL, pero empiezan <strong>vacías</strong> hasta que subas el
          catálogo. Puedes importar CSV aquí o en tu PC: <code>npm run supabase:export:csv</code> y luego{" "}
          <code>npm run supabase:import:csv</code> (necesita <code>SUPABASE_SERVICE_ROLE_KEY</code> en{" "}
          <code>.env.local</code>).
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--bp-dim)" }}>
          <strong>teams.csv ≠ players.csv</strong> — son archivos distintos. Puedes subir solo uno (una fila =
          un registro) o varios a la vez.
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--bp-dim)" }}>
          <strong>¿Se borra lo anterior?</strong> No: solo se actualizan las filas del CSV (por{" "}
          <code>slug</code>). El resto del catálogo no se toca. Si el CSV trae columnas básicas sin{" "}
          <code>meta_json</code> / <code>social_json</code>, se conservan la wiki, redes y logros que ya
          guardaste en Admin. Para editar en bloque con todo el detalle, exporta desde Equipos/Jugadores →{" "}
          <strong>Descargar CSV</strong> y vuelve a subir aquí.
        </p>
      </div>

      <AdminCsvImportGuide />

      <AdminCsvTemplates />

      <form onSubmit={(e) => void submit(e)} className="bf-admin-import-form" id="bf-csv-upload-form">
        <h3>
          <Upload size={18} /> Subir CSV a Supabase
        </h3>
        <p className="bf-admin-field-hint" style={{ margin: "0 0 14px" }}>
          Sube los archivos que necesites; no hace falta subirlos todos. Orden recomendado: equipos → jugadores →
          torneos → partidos / plantillas torneo → noticias / fantasy.
        </p>

        {UPLOAD_BY_GROUP.map(({ group, files: keys }) => {
          const meta = CSV_TEMPLATE_GROUPS.find((g) => g.id === group);
          return (
            <fieldset key={group} className="bf-admin-import-group">
              <legend>{meta?.title}</legend>
              {meta?.note && <p className="bf-admin-field-hint">{meta.note}</p>}
              {keys.map((key) => {
                const tpl = getCsvTemplate(key);
                if (!tpl) return null;
                const required = tpl.fields.filter((f) => f.required).map((f) => f.key).join(", ");
                return (
                  <AdminFileRow
                    key={key}
                    label={`${tpl.title} (${tpl.filename})`}
                    hint={required || tpl.subtitle}
                    onChange={(f) => setFile(key, f)}
                  />
                );
              })}
            </fieldset>
          );
        })}

        {msg && <div className={`bf-admin-toast ${msg.includes("Error") ? "is-error" : ""}`}>{msg}</div>}
        <button type="submit" className="bp-btn bp-btn-gold" disabled={loading} style={{ width: "100%" }}>
          <FileSpreadsheet size={16} /> Importar a Supabase
        </button>
      </form>
    </div>
  );
}

function AdminFileRow({
  label,
  hint,
  onChange,
}: {
  label: string;
  hint: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="bf-admin-import-file">
      <span className="bf-admin-import-file-label">{label}</span>
      <span className="bf-admin-field-hint">{hint}</span>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
