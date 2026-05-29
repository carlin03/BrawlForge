"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { StudioCard, StudioField, StudioInput, StudioToast, StudioEmpty } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioMediaPanel() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  async function add(reload: () => void) {
    if (!url.trim()) {
      setMsg("Pega la dirección (URL) de la imagen.");
      setError(true);
      return;
    }
    const res = await fetch("/api/cms/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Imagen", public_url: url.trim() }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Imagen añadida a la biblioteca." : data.error);
    setError(!res.ok);
    if (res.ok) {
      setUrl("");
      setName("");
      reload();
    }
  }

  return (
    <StudioModulePanel
      title="Imágenes y vídeos"
      lead="Guarda enlaces a fotos, banners o logos para reutilizarlos en la web."
      apiPath="/api/cms/admin/media"
    >
      {(data, reload) => {
        const assets = (data.assets ?? []) as { id: string; name: string; public_url: string | null }[];
        return (
          <>
            <StudioCard title="Añadir imagen por enlace">
              <StudioField label="Nombre (para encontrarla después)">
                <StudioInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Banner BSC" />
              </StudioField>
              <StudioField label="Dirección de la imagen (URL)" hint="Clic derecho en una foto → copiar dirección">
                <StudioInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </StudioField>
              {url && (
                <div className="bf-studio-media-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Vista previa" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <button type="button" className="bp-btn bp-btn-gold" onClick={() => add(reload)}>
                Añadir a la biblioteca
              </button>
              <StudioToast message={msg} error={error} />
            </StudioCard>

            <h3 className="bf-studio-list-title">Tu biblioteca ({assets.length})</h3>
            {assets.length === 0 ? (
              <StudioEmpty title="Biblioteca vacía">
                <p className="bf-studio-muted">Añade la primera imagen con el formulario de arriba.</p>
              </StudioEmpty>
            ) : (
              <div className="bf-studio-media-grid">
                {assets.map((a) => (
                  <div key={a.id} className="bf-studio-media-thumb">
                    {a.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.public_url} alt={a.name} />
                    ) : (
                      <ImageIcon size={32} />
                    )}
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }}
    </StudioModulePanel>
  );
}
