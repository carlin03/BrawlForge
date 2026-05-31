"use client";

import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { downloadCsvText } from "@/lib/admin/export-catalog-csv";
import { buildTeamsMasterCsv, type TeamMasterCsvRowIssue } from "@/lib/admin/teams-master-csv";
import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";

type ImportReport = {
  schema?: string;
  imported?: number;
  skipped?: number;
  message?: string;
  errors?: TeamMasterCsvRowIssue[];
  issues?: TeamMasterCsvRowIssue[];
};

type Props = {
  teams: AdminTeamCatalogRow[];
  disabled?: boolean;
  onImported?: () => void | Promise<unknown>;
};

export function AdminTeamsMasterCsv({ teams, disabled, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  async function exportCsv() {
    setBusy(true);
    setHint(null);
    setReport(null);
    try {
      const res = await fetch("/api/admin/teams/master-csv");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo exportar");
      }
      const text = await res.text();
      downloadCsvText("teams-master.csv", text);
      setHint("CSV maestro v2 descargado.");
    } catch (e) {
      downloadCsvText("teams-master.csv", buildTeamsMasterCsv(teams));
      setHint(
        e instanceof Error
          ? `${e.message} — exportado desde datos en pantalla.`
          : "Exportado desde datos en pantalla.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(file: File) {
    setBusy(true);
    setHint(null);
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/teams/master-csv", { method: "POST", body: form });
      const data = (await res.json()) as ImportReport & { error?: string };
      if (!res.ok) {
        setReport(data);
        throw new Error(data.error || "Error al importar");
      }
      setReport(data);
      setHint(data.message || `Importados ${data.imported ?? 0} equipos.`);
      await onImported?.();
    } catch (e) {
      if (!report) {
        setHint(e instanceof Error ? e.message : "Error al importar");
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const errorRows = report?.errors?.length
    ? report.errors
    : report?.issues?.filter((i) => i.errors.length) ?? [];

  return (
    <div className="bf-admin-master-csv">
      <button
        type="button"
        className="bp-btn bp-btn-gold"
        disabled={disabled || busy}
        onClick={() => void exportCsv()}
      >
        <Download size={16} /> Exportar CSV
      </button>
      <button
        type="button"
        className="bp-btn bp-btn-ghost"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={16} /> Importar CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importCsv(file);
        }}
      />
      {hint && (
        <p className="bf-admin-field-hint" style={{ margin: "8px 0 0" }}>
          {hint}
          {report?.schema ? ` · esquema ${report.schema}` : ""}
        </p>
      )}
      {errorRows.length > 0 && (
        <div className="bf-admin-csv-import-errors" role="alert">
          <p className="bf-admin-csv-import-errors-title">
            <AlertTriangle size={14} /> {errorRows.length} fila(s) con error (no importadas)
          </p>
          <ul className="bf-admin-csv-import-errors-list">
            {errorRows.slice(0, 12).map((row) => (
              <li key={`${row.slug}-${row.line}`}>
                <strong>Línea {row.line}</strong> · <code>{row.slug}</code>
                <ul>
                  {row.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                  {row.warnings.map((w) => (
                    <li key={w} className="is-warn">
                      {w}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {errorRows.length > 12 && (
            <p className="bf-admin-field-hint">… y {errorRows.length - 12} más</p>
          )}
        </div>
      )}
      <p className="bf-admin-field-hint" style={{ margin: "4px 0 0", fontSize: 12 }}>
        CSV v2 (compatible v1).{" "}
        <a href="/plantillas/teams-master-template.csv" download>
          Plantilla
        </a>
        {" · "}
        <a href="/plantillas/teams-master-example.csv" download>
          Ejemplo completo
        </a>
      </p>
    </div>
  );
}
