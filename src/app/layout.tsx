import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

const DESCRIPTION = "La marketplace pensée pour le Cameroun : découvrez les produits des boutiques locales et commandez simplement.";
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: "NILE — Le commerce à portée de main", template: "%s | NILE" },
  description: DESCRIPTION,
  openGraph: { siteName: "NILE", locale: "fr_CM", type: "website", title: "NILE — Le commerce à portée de main", description: DESCRIPTION },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1e3a8a", viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr" suppressHydrationWarning >
    <body id="top" suppressHydrationWarning className="min-h-screen overflow-x-clip">{children}</body>
  </html>;
}
