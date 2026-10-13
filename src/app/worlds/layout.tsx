import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";

/** Una sola familia = menos lag de fuentes en el hub Worlds. */
const tokyo = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--wf-font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "World Finals 2026 · Tokyo · BrawlForge",
  description: "Hub World Finals 2026 en Tokio, Japón — camino al título, equipos y trivia.",
};

export default function WorldsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`wf-tokyo-root ${tokyo.variable}`}
      style={{ ["--wf-font-display" as string]: "var(--wf-font-body)" }}
    >
      {children}
    </div>
  );
}
