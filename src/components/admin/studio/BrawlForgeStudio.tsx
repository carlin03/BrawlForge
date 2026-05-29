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

export type StudioModule =
  | "operations"
  | "platform"
  | "matches"
  | "home_builder"
  | "theme"
  | "fantasy_config"
  | "predictions_config"
  | "seo"
  | "media"
  | "cards"
  | "automation";

type OpsTab = "teams" | "players" | "logos" | "news" | "import" | "users";

const MODULE_NAV: {
  id: StudioModule;
  label: string;
  icon: typeof Settings2;
  status: "active" | "planned";
  phase: string;
}[] = [
  { id: "operations", label: "Operaciones", icon: LayoutGrid, status: "active", phase: "0" },
  { id: "platform", label: "Plataforma", icon: Settings2, status: "active", phase: "0" },
  { id: "matches", label: "Partidos", icon: Calendar, status: "active", phase: "1" },
  { id: "theme", label: "Theme Engine", icon: Palette, status: "active", phase: "2" },
  { id: "seo", label: "SEO", icon: Sparkles, status: "active", phase: "3" },
  { id: "home_builder", label: "Home Builder", icon: Layers, status: "active", phase: "4" },
  { id: "cards", label: "Card Builder", icon: LayoutGrid, status: "active", phase: "6" },
  { id: "fantasy_config", label: "Fantasy", icon: Trophy, status: "active", phase: "7" },
  { id: "predictions_config", label: "Predicciones", icon: Target, status: "active", phase: "7" },
  { id: "media", label: "Media", icon: Image, status: "active", phase: "8" },
  { id: "automation", label: "Automatización", icon: Sparkles, status: "active", phase: "10" },
];

const OPS_LINKS: { tab: OpsTab; label: string; icon: typeof Users }[] = [
  { tab: "teams", label: "Equipos", icon: Users },
  { tab: "players", label: "Jugadores", icon: User },
  { tab: "logos", label: "Logos", icon: Image },
  { tab: "news", label: "Noticias", icon: Newspaper },
  { tab: "import", label: "Import CSV", icon: FileSpreadsheet },
  { tab: "users", label: "Usuarios", icon: UserCircle },
];

function moduleFromQuery(raw: string | null): StudioModule {
  if (raw && MODULE_NAV.some((m) => m.id === raw)) return raw as StudioModule;
  return "operations";
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
      p.set("module", nextModule);
      if (nextModule === "operations" && nextTab) p.set("tab", nextTab);
      router.replace(`/admin?${p.toString()}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const m = moduleFromQuery(searchParams.get("module"));
    const t = tabFromQuery(searchParams.get("tab"));
    setModule(m);
    setOpsTab(t);
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

  return (
    <div className="bf-studio">
      <aside className="bf-studio-sidebar" aria-label="BrawlForge Studio">
        <div className="bf-studio-brand">
          <BrandMark size={36} />
          <div>
            <span className="bf-studio-brand-kicker">Control Center</span>
            <strong>
              Brawl<em>Forge</em> Studio
            </strong>
          </div>
        </div>

        <nav className="bf-studio-nav">
          {MODULE_NAV.map(({ id, label, icon: Icon, status, phase }) => (
            <button
              key={id}
              type="button"
              className={`bf-studio-nav-item ${module === id ? "is-on" : ""} is-${status}`}
              onClick={() => selectModule(id)}
              title={status === "planned" ? `Planificado — Fase ${phase}` : label}
            >
              <Icon size={18} />
              <span>{label}</span>
              {status === "planned" && <span className="bf-studio-badge">F{phase}</span>}
            </button>
          ))}
        </nav>

        {module === "operations" && (
          <div className="bf-studio-subnav">
            <span className="bf-studio-subnav-title">Operaciones</span>
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
          <Link href="/" className="bp-btn bp-btn-ghost bf-studio-home-link">
            <Home size={16} /> Ver web pública
          </Link>
        </div>
      </aside>

      <div className="bf-studio-main">
        <header className="bf-studio-topbar">
          <div>
            <h1 className="bf-studio-title">{activeModuleMeta?.label ?? "Studio"}</h1>
            <p className="bf-studio-lead">
              Evolución del panel admin — configuración progresiva sin cambiar la experiencia de los usuarios.
            </p>
          </div>
        </header>

        {module === "platform" && <StudioPlatformPanel />}
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
            <AdminConsole embedded initialTab={opsTab} />
          </div>
        )}
      </div>
    </div>
  );
}
