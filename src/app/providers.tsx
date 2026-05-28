"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { GameProvider } from "@/contexts/GameContext";
import { LogoConfigProvider } from "@/contexts/LogoConfigContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CatalogProvider>
        <LogoConfigProvider>
          <GameProvider>{children}</GameProvider>
        </LogoConfigProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
