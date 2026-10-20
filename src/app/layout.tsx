import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

const policeTitre = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--police-titre",
  display: "swap",
});
const policeCorps = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--police-corps",
  display: "swap",
});

const DESCRIPTION = "La marketplace pensée pour le Cameroun : découvrez les produits des boutiques locales et commandez simplement.";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: "NILE — Le commerce local, connecté", template: "%s | NILE" },
  description: DESCRIPTION,
  openGraph: { siteName: "NILE", locale: "fr_CM", type: "website", title: "NILE — Le commerce local, connecté", description: DESCRIPTION },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1e3a8a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr" suppressHydrationWarning className={`${policeTitre.variable} ${policeCorps.variable}`}>
    <body id="top" suppressHydrationWarning className="min-h-screen overflow-x-clip">
      {children}
    </body>
  </html>;
}
