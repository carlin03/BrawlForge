import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";

const display = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--wf-font-display",
  display: "swap",
});

const body = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--wf-font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "World Finals 2026 · Tokyo · BrawlForge",
  description: "Hub premium World Finals 2026 en Tokio, Japón — camino al título, equipos y trivia.",
};

export default function WorldsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`wf-tokyo-root ${display.variable} ${body.variable}`}>{children}</div>
  );
}
