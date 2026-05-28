import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/app/providers";

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
  manifest: "/manifest.json",
  applicationName: "BrawlForge",
  appleWebApp: {
    capable: true,
    title: "BrawlForge",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0c12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${oswald.variable} ${ibmPlex.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ background: "#0a0c12", color: "#f4f4f5" }}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
