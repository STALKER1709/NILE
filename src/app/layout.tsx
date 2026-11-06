import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { env } from "@/lib/env";

const DESCRIPTION = "NILE est une marketplace en ligne au Cameroun pour découvrir des produits, comparer les offres et acheter auprès de boutiques locales.";
const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NILE — Marketplace en ligne au Cameroun",
    template: "%s | NILE",
  },
  description: DESCRIPTION,
  applicationName: "NILE",
  category: "shopping",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    siteName: "NILE",
    locale: "fr_CM",
    type: "website",
    url: SITE_URL,
    title: "NILE — Marketplace en ligne au Cameroun",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "NILE — Marketplace en ligne au Cameroun",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a8a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NILE",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description: DESCRIPTION,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NILE",
    url: SITE_URL,
    inLanguage: "fr-CM",
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body id="top" suppressHydrationWarning className="min-h-screen overflow-x-clip">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
