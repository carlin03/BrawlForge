"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Settings2,
  Users,
  User,
  Image,
  Newspaper,
  FileSpreadsheet,
  UserCircle,
  Layers,
  Calendar,
  Palette,
  Target,
  Trophy,
  Sparkles,
  LayoutDashboard,
  Sliders,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { StudioPlatformPanel } from "@/components/admin/studio/StudioPlatformPanel";
import { StudioMatchesPanel } from "@/components/admin/studio/StudioMatchesPanel";
import { StudioThemePanel } from "@/components/admin/studio/StudioThemePanel";
import { StudioSeoPanel } from "@/components/admin/studio/StudioSeoPanel";
import { StudioHomePanel } from "@/components/admin/studio/StudioHomePanel";
import { StudioFantasyPanel } from "@/components/admin/studio/StudioFantasyPanel";
import { StudioPredictionsPanel } from "@/components/admin/studio/StudioPredictionsPanel";
import { StudioMediaPanel } from "@/components/admin/studio/StudioMediaPanel";
import { StudioCardsPanel } from "@/components/admin/studio/StudioCardsPanel";
import { StudioAutomationPanel } from "@/components/admin/studio/StudioAutomationPanel";
import { StudioDashboard } from "@/components/admin/studio/StudioDashboard";

export type StudioModule =
  | "inicio"
  | "operations"
  | "matches"
  | "home_builder"
  | "theme"
  | "fantasy_config"
  | "predictions_config"
  | "seo"
  | "media"
  | "cards"
  | "automation"
  | "ajustes"
  | "platform";

type OpsTab = "teams" | "players" | "logos" | "news" | "import" | "users";

const MODULE_NAV: {
  id: StudioModule;
  label: string;
  icon: typeof Settings2;
  lead: string;
}[] = [
  { id: "inicio", label: "Inicio", icon: LayoutDashboard, lead: "Accesos rápidos a las tareas más habituales." },
  { id: "operations", label: "Contenido", icon: LayoutGrid, lead: "Equipos, jugadores, logos, noticias y usuarios." },
  { id: "matches", label: "Partidos", icon: Calendar, lead: "Crea enfrentamientos con un formulario guiado." },
  { id: "home_builder", label: "Página de inicio", icon: Layers, lead: "Secciones y cantidad de partidos en la portada." },
  { id: "theme", label: "Colores", icon: Palette, lead: "Paleta visual del sitio con selectores de color." },
  { id: "seo", label: "Búsqueda (SEO)", icon: Sparkles, lead: "Título y descripción para Google y redes." },
  { id: "cards", label: "Tarjetas", icon: LayoutGrid, lead: "Diseño de fichas de equipos y jugadores." },
  { id: "fantasy_config", label: "Fantasy", icon: Trophy, lead: "Presupuesto, plantilla y reglas de la temporada." },
  { id: "predictions_config", label: "Predicciones", icon: Target, lead: "Puntos por acertar resultados." },
  { id: "media", label: "Imágenes", icon: Image, lead: "Biblioteca de fotos y banners." },
  { id: "automation", label: "Automatizaciones", icon: Sparkles, lead: "Tareas automáticas del sistema." },
];

const OPS_LINKS: { tab: OpsTab; label: string; icon: typeof Users }[] = [
  { tab: "teams", label: "Equipos", icon: Users },
  { tab: "players", label: "Jugadores", icon: User },
  { tab: "logos", label: "Logos", icon: Image },
  { tab: "news", label: "Noticias", icon: Newspaper },
  { tab: "import", label: "Importar datos", icon: FileSpreadsheet },
  { tab: "users", label: "Usuarios", icon: UserCircle },
];

const MODULE_IDS = new Set(MODULE_NAV.map((m) => m.id));

function moduleFromQuery(raw: string | null): StudioModule {
  if (raw === "platform") return "ajustes";
  if (raw && MODULE_IDS.has(raw as StudioModule)) return raw as StudioModule;
  return "inicio";
}

function tabFromQuery(raw: string | null): OpsTab {
  const hit = OPS_LINKS.find((o) => o.tab === raw);
  if (hit) return hit.tab;
  return "teams";
}

export function BrawlForgeStudio() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [module, setModule] = useState<StudioModule>(() => moduleFromQuery(searchParams.get("module")));
  const [opsTab, setOpsTab] = useState<OpsTab>(() => tabFromQuery(searchParams.get("tab")));

  const syncUrl = useCallback(
    (nextModule: StudioModule, nextTab?: OpsTab) => {
      const p = new URLSearchParams();
      p.set("module", nextModule === "ajustes" ? "ajustes" : nextModule);
      if (nextModule === "operations" && nextTab) p.set("tab", nextTab);
      router.replace(`/admin?${p.toString()}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setModule(moduleFromQuery(searchParams.get("module")));
    setOpsTab(tabFromQuery(searchParams.get("tab")));
  }, [searchParams]);

  const activeModuleMeta = useMemo(() => MODULE_NAV.find((m) => m.id === module), [module]);

  function selectModule(id: StudioModule) {
    setModule(id);
    syncUrl(id, id === "operations" ? opsTab : undefined);
  }

  function selectOpsTab(tab: OpsTab) {
    setOpsTab(tab);
    setModule("operations");
    syncUrl("operations", tab);
  }

  const showTopbar = module !== "inicio" && module !== "operations";

  return (
    <div className="bf-studio">
      <aside className="bf-studio-sidebar" aria-label="BrawlForge Studio">
        <div className="bf-studio-brand">
          <BrandMark size={36} />
          <div>
            <span className="bf-studio-brand-kicker">Panel de gestión</span>
            <strong>
              Brawl<em>Forge</em> Studio
            </strong>
          </div>
        </div>

        <nav className="bf-studio-nav">
          {MODULE_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`bf-studio-nav-item ${module === id ? "is-on" : ""}`}
              onClick={() => selectModule(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {module === "operations" && (
          <div className="bf-studio-subnav">
            <span className="bf-studio-subnav-title">Contenido</span>
            {OPS_LINKS.map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                type="button"
                className={`bf-studio-subnav-item ${opsTab === tab ? "is-on" : ""}`}
                onClick={() => selectOpsTab(tab)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        )}

        <div className="bf-studio-sidebar-foot">
          <button
            type="button"
            className={`bf-studio-nav-item ${module === "ajustes" ? "is-on" : ""}`}
            onClick={() => selectModule("ajustes")}
          >
            <Sliders size={18} />
            <span>Ajustes del sistema</span>
          </button>
          <Link href="/" className="bp-btn bp-btn-ghost bf-studio-home-link" target="_blank">
            <Home size={16} /> Ver web pública
          </Link>
        </div>
      </aside>

      <div className="bf-studio-main">
        {showTopbar && (
          <header className="bf-studio-topbar">
            <div>
              <h1 className="bf-studio-title">{activeModuleMeta?.label ?? "Studio"}</h1>
              <p className="bf-studio-lead">{activeModuleMeta?.lead}</p>
            </div>
          </header>
        )}

        {module === "inicio" && <StudioDashboard />}
        {module === "ajustes" && <StudioPlatformPanel />}
        {module === "matches" && <StudioMatchesPanel />}
        {module === "theme" && <StudioThemePanel />}
        {module === "seo" && <StudioSeoPanel />}
        {module === "home_builder" && <StudioHomePanel />}
        {module === "cards" && <StudioCardsPanel />}
        {module === "fantasy_config" && <StudioFantasyPanel />}
        {module === "predictions_config" && <StudioPredictionsPanel />}
        {module === "media" && <StudioMediaPanel />}
        {module === "automation" && <StudioAutomationPanel />}

        {module === "operations" && (
          <div className="bf-studio-embed">
            <header className="bf-studio-topbar">
              <div>
                <h1 className="bf-studio-title">Contenido</h1>
                <p className="bf-studio-lead">Equipos, jugadores, logos, noticias y usuarios.</p>
              </div>
            </header>
            <AdminConsole embedded initialTab={opsTab} />
          </div>
        )}
      </div>
    </div>
  );
}
