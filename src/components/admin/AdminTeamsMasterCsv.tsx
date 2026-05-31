"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { downloadCsvText } from "@/lib/admin/export-catalog-csv";
import { buildTeamsMasterCsv } from "@/lib/admin/teams-master-csv";
import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";

type Props = {
  teams: AdminTeamCatalogRow[];
  disabled?: boolean;
  onImported?: () => void | Promise<unknown>;
};

export function AdminTeamsMasterCsv({ teams, disabled, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function exportCsv() {
    setBusy(true);
    setHint(null);
    try {
      const res = await fetch("/api/admin/teams/master-csv");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo exportar");
      }
      const text = await res.text();
      downloadCsvText("teams-master.csv", text);
      setHint("CSV maestro descargado.");
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
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/teams/master-csv", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setHint(data.message || `Importados ${data.imported ?? 0} equipos.`);
      await onImported?.();
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

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
        </p>
      )}
      <p className="bf-admin-field-hint" style={{ margin: "4px 0 0", fontSize: 12 }}>
        Una fila = todas las pestañas. Slug único; listas con <code>|</code>; palmarés en{" "}
        <code>trophies_json</code>.{" "}
        <a href="/plantillas/teams-master.csv" download>
          Plantilla
        </a>
      </p>
    </div>
  );
}
