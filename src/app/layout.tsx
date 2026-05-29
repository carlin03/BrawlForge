import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/app/providers";
import { CmsThemeInjector } from "@/components/cms/CmsThemeInjector";
import { CmsRuntimeLoader } from "@/components/cms/CmsRuntimeLoader";
import { resolveSiteSeo } from "@/lib/cms/resolve";

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

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSiteSeo();
  return {
    title: seo.title,
    description: seo.description,
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    applicationName: "BrawlForge",
    appleWebApp: {
      capable: true,
      title: "BrawlForge",
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
  };
}

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
        <CmsThemeInjector />
        <CmsRuntimeLoader>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </CmsRuntimeLoader>
      </body>
    </html>
  );
}
