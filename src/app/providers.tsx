"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { GameProvider } from "@/contexts/GameContext";
import { ActivityTracker } from "@/components/platform/ActivityTracker";
import { LogoConfigProvider } from "@/contexts/LogoConfigContext";
import { NewsProvider } from "@/contexts/NewsContext";
import { MatchPoolRefreshProvider } from "@/contexts/MatchPoolRefreshContext";
import { WorldsModeProvider } from "@/contexts/WorldsModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CatalogProvider>
        <LogoConfigProvider>
          <NewsProvider>
            <MatchPoolRefreshProvider>
              <GameProvider>
                <WorldsModeProvider>
                  <ActivityTracker />
                  {children}
                </WorldsModeProvider>
              </GameProvider>
            </MatchPoolRefreshProvider>
          </NewsProvider>
        </LogoConfigProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
