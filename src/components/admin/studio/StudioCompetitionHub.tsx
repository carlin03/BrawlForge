"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, User, Trophy, Calendar, GitBranch, Image, FileSpreadsheet } from "lucide-react";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { AdminImportPanel } from "@/components/admin/AdminImportPanel";
import { AdminTournamentsPanel } from "@/components/admin/AdminTournamentsPanel";
import { StudioMatchesPanel } from "@/components/admin/studio/StudioMatchesPanel";
import { StudioBracketBuilderPanel } from "@/components/admin/studio/StudioBracketBuilderPanel";
import { StudioPanel } from "./studio-ui";

export type CompetitionTab =
  | "teams"
  | "players"
  | "import"
  | "tournaments"
  | "matches"
  | "bracket"
  | "logos";

const TABS: { id: CompetitionTab; label: string; icon: typeof Users; hint: string }[] = [
  { id: "teams", label: "Equipos", icon: Users, hint: "Clubes, roster, wiki y colores" },
  { id: "players", label: "Jugadores", icon: User, hint: "Fichas, equipo y estadísticas" },
  {
    id: "import",
    label: "Importar CSV",
    icon: FileSpreadsheet,
    hint: "Subir todos los equipos/jugadores o un CSV de un solo club",
  },
  { id: "tournaments", label: "Torneos", icon: Trophy, hint: "Calendario, premios y participantes" },
  { id: "matches", label: "Partidos", icon: Calendar, hint: "Crear, en vivo, marcador y mapas" },
  { id: "bracket", label: "Bracket", icon: GitBranch, hint: "Playoffs y vista previa pública" },
  { id: "logos", label: "Logos", icon: Image, hint: "Escudos de clubs y torneos" },
];

const TAB_IDS = new Set(TABS.map((t) => t.id));

function tabFromQuery(raw: string | null): CompetitionTab {
  if (raw && TAB_IDS.has(raw as CompetitionTab)) return raw as CompetitionTab;
  return "matches";
}

export function StudioCompetitionHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<CompetitionTab>(() => tabFromQuery(searchParams.get("tab")));

  const syncUrl = useCallback(
    (next: CompetitionTab) => {
      const p = new URLSearchParams();
      p.set("module", "competicion");
      p.set("tab", next);
      router.replace(`/admin?${p.toString()}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get("tab")));
  }, [searchParams]);

  function selectTab(id: CompetitionTab) {
    setTab(id);
    syncUrl(id);
  }

  const activeMeta = TABS.find((t) => t.id === tab);

  return (
    <div className="bf-studio-competition">
      <StudioPanel
        title="Competición"
        lead="Todo lo del circuito en un solo sitio: equipos, torneos, partidos en vivo y bracket. Los cambios se guardan en Supabase y salen en la web."
      >
        <nav className="bf-studio-competition-tabs" role="tablist" aria-label="Secciones de competición">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`bf-studio-competition-tab ${tab === id ? "is-on" : ""}`}
              onClick={() => selectTab(id)}
            >
              <Icon size={16} aria-hidden />
              {label}
            </button>
          ))}
        </nav>
        {activeMeta && (
          <p className="bf-studio-competition-tab-hint">{activeMeta.hint}</p>
        )}
      </StudioPanel>

      <div className="bf-studio-competition-body" role="tabpanel">
        {tab === "import" && <AdminImportPanel />}
        {(tab === "teams" || tab === "players" || tab === "logos") && (
          <AdminConsole embedded initialTab={tab} />
        )}
        {tab === "tournaments" && <AdminTournamentsPanel teams={[]} embedded />}
        {tab === "matches" && <StudioMatchesPanel />}
        {tab === "bracket" && <StudioBracketBuilderPanel />}
      </div>
    </div>
  );
}
