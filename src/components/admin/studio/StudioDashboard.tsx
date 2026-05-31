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
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { StudioCard, StudioPanel } from "./studio-ui";

const QUICK_LINKS = [
  {
    module: "competicion",
    tab: "teams",
    label: "Equipos",
    desc: "Clubes, roster, wiki y logos",
    icon: Users,
  },
  {
    module: "competicion",
    tab: "players",
    label: "Jugadores",
    desc: "Fichas, equipo y estadísticas",
    icon: Users,
  },
  {
    module: "competicion",
    tab: "import",
    label: "Importar CSV",
    desc: "Todos los equipos o un club · jugadores",
    icon: FileSpreadsheet,
  },
  {
    module: "competicion",
    tab: "tournaments",
    label: "Torneos",
    desc: "Crear, participantes y premios",
    icon: Trophy,
  },
  {
    module: "competicion",
    tab: "matches",
    label: "Partidos",
    desc: "En vivo, marcador y predicciones",
    icon: Calendar,
  },
  {
    module: "competicion",
    tab: "bracket",
    label: "Bracket",
    desc: "Playoffs con vista previa",
    icon: Trophy,
  },
  { module: "cards", label: "Tarjetas y fondos", desc: "Colores, fotos y banners", icon: Image },
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

      <StudioCard title="Competición (recomendado)">
        <p className="bf-studio-hint" style={{ margin: 0 }}>
          Usa el menú <strong>Competición</strong> para equipos, torneos, partidos y bracket en un solo lugar. Los
          cambios se guardan en Supabase y aparecen en la web. Si no guarda, revisa{" "}
          <Link href="/admin?module=ajustes">Ajustes del sistema</Link> y ejecuta la sincronización.
        </p>
        <Link href="/admin?module=competicion&tab=matches" className="bp-btn bp-btn-gold" style={{ marginTop: 12 }}>
          Abrir Competición
        </Link>
      </StudioCard>

      <StudioCard title="Consejo">
        <p className="bf-studio-hint" style={{ margin: 0 }}>
          Si algo no se ve al momento, espera unos segundos y recarga con <strong>F5</strong>.
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
