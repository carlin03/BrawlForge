import { HomeView } from "@/components/platform/HomeView";

/** Entrada corta para móvil: enlázala o añádela a pantalla de inicio. */
export const metadata = {
  title: "BrawlForge — Móvil",
  description: "Fantasy y predicciones BSC. Abre este enlace en el móvil.",
};

export default function MobileEntryPage() {
  return <HomeView />;
}
