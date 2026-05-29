import type { Metadata } from "next";
import { ProfileView } from "@/components/platform/ProfileView";

export const metadata: Metadata = {
  title: "Mi perfil — BrawlForge",
  description: "Tu cuenta, estadísticas fantasy, predicciones y club favorito BSC 2026.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
