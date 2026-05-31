"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { GameProvider } from "@/contexts/GameContext";
import { ActivityTracker } from "@/components/platform/ActivityTracker";
import { FirstVisitLoader } from "@/components/layout/FirstVisitLoader";
import { LogoConfigProvider } from "@/contexts/LogoConfigContext";
import { NewsProvider } from "@/contexts/NewsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CatalogProvider>
        <LogoConfigProvider>
          <NewsProvider>
            <GameProvider>
              <FirstVisitLoader />
              <ActivityTracker />
              {children}
            </GameProvider>
          </NewsProvider>
        </LogoConfigProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
