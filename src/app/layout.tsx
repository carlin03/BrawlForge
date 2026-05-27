import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BrawlForge — Fantasy & Predictions BSC",
  description: "Fantasy, predicciones y seguimiento competitivo de Brawl Stars.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${oswald.variable} ${ibmPlex.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ background: "#0a0c12", color: "#f4f4f5" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
