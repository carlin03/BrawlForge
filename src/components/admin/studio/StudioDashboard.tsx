"use client";

import Link from "next/link";
import {
  Users,
  Calendar,
  Layers,
  Palette,
  Newspaper,
  Image,
  Trophy,
  Target,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { StudioCard, StudioPanel } from "./studio-ui";

const QUICK_LINKS = [
  { module: "operations", tab: "teams", label: "Equipos", desc: "Nombres, logos y datos BSC", icon: Users },
  { module: "operations", tab: "players", label: "Jugadores", desc: "Plantillas y estadísticas", icon: Users },
  { module: "matches", label: "Partidos", desc: "Crear y editar enfrentamientos", icon: Calendar },
  { module: "home_builder", label: "Página de inicio", desc: "Ordenar secciones de la home", icon: Layers },
  { module: "operations", tab: "news", label: "Noticias", desc: "Publicar novedades", icon: Newspaper },
  { module: "theme", label: "Colores", desc: "Aspecto visual del sitio", icon: Palette },
  { module: "media", label: "Imágenes", desc: "Biblioteca de fotos y banners", icon: Image },
  { module: "fantasy_config", label: "Fantasy", desc: "Reglas y temporada", icon: Trophy },
  { module: "predictions_config", label: "Predicciones", desc: "Puntos y mercados", icon: Target },
];

export function StudioDashboard() {
  return (
    <StudioPanel
      title="Bienvenido al panel"
      lead="Desde aquí gestionas BrawlForge sin tocar código. Elige una tarea o usa el menú de la izquierda."
    >
      <div className="bf-studio-dash-grid">
        {QUICK_LINKS.map(({ module, tab, label, desc, icon: Icon }) => {
          const href = tab ? `/admin?module=${module}&tab=${tab}` : `/admin?module=${module}`;
          return (
            <Link key={href} href={href} className="bf-studio-dash-card">
              <Icon size={22} />
              <strong>{label}</strong>
              <span>{desc}</span>
            </Link>
          );
        })}
      </div>

      <StudioCard title="Consejo">
        <p className="bf-studio-hint" style={{ margin: 0 }}>
          Los cambios que guardes aquí se reflejan en la web pública. Si algo no se ve al momento, espera unos
          segundos y recarga la página con <strong>F5</strong>.
        </p>
      </StudioCard>

      <div className="bf-studio-dash-foot">
        <Link href="/" className="bp-btn bp-btn-gold" target="_blank">
          <ExternalLink size={16} /> Ver cómo lo ven los usuarios
        </Link>
        <Link href="/admin?module=ajustes" className="bp-btn bp-btn-ghost">
          <Sparkles size={16} /> Ajustes del sistema
        </Link>
      </div>
    </StudioPanel>
  );
}
