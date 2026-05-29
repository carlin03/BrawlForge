"use client";

import { useState } from "react";
import { StudioField, StudioInput, StudioTextarea, StudioToast, StudioCard } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioSeoPanel() {
  const [title, setTitle] = useState("BrawlForge — Fantasy & Predictions BSC");
  const [description, setDescription] = useState(
    "Fantasy, predicciones y seguimiento competitivo de Brawl Stars.",
  );
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  async function save() {
    const res = await fetch("/api/cms/admin/seo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalSeo: { title, description, themeColor: "#0a0c12" } }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Textos de Google y redes guardados." : data.error);
    setError(!res.ok);
  }

  return (
    <StudioModulePanel
      title="Búsqueda y redes (SEO)"
      lead="Título y descripción que aparecen en Google y al compartir el enlace."
      apiPath="/api/cms/admin/seo"
    >
      {() => (
        <StudioCard title="Textos principales del sitio">
          <StudioField label="Título del sitio" hint="Aparece en la pestaña del navegador y en Google">
            <StudioInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </StudioField>
          <StudioField label="Descripción corta" hint="Resumen en buscadores (máx. ~160 caracteres recomendado)">
            <StudioTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </StudioField>
          <button type="button" className="bp-btn bp-btn-gold" onClick={save}>
            Guardar textos SEO
          </button>
          <StudioToast message={msg} error={error} />
        </StudioCard>
      )}
    </StudioModulePanel>
  );
}
