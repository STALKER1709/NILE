import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { compterArticlesAffiches } from "@/modules/commande/panier-invite";
import { listerCategories } from "@/modules/catalogue/categories";
import { Entete } from "@/components/layout/Entete";
import { PiedDePage } from "@/components/layout/PiedDePage";
import { NavMobile } from "@/components/layout/NavMobile";
import { BulleWhatsApp } from "@/components/layout/BulleWhatsApp";

const DESCRIPTION =
  "Marketplace du Cameroun — achats en ligne, paiement mobile (MTN MoMo, Orange Money) et à la livraison.";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "NILE Marketplace — Achats en ligne au Cameroun",
    template: "%s | NILE Marketplace",
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: "NILE Marketplace",
    locale: "fr_FR",
    type: "website",
    title: "NILE Marketplace — Achats en ligne au Cameroun",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a3d38",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [utilisateur, categories] = await Promise.all([
    getUtilisateurCourant(),
    listerCategories(),
  ]);
  const nbArticles = await compterArticlesAffiches(utilisateur?.id ?? null);
  const rayons = categories
    .filter((c) => !c.parentId)
    .slice(0, 10)
    .map((c) => ({ nom: c.nom, slug: c.slug }));

  return (
    <html lang="fr" suppressHydrationWarning>
      <body id="top" suppressHydrationWarning className="min-h-screen">
        <Entete
          utilisateur={
            utilisateur ? { nom: utilisateur.nom, role: utilisateur.role } : null
          }
          nbArticles={nbArticles}
          categories={rayons}
        />
        {/* pb-24 : laisse la place à la barre de navigation mobile fixe */}
        <main className="mx-auto max-w-6xl px-3 py-5 pb-24 sm:px-4 sm:pb-8">{children}</main>
        <PiedDePage />
        <NavMobile connecte={!!utilisateur} nbArticles={nbArticles} />
        {env.CONTACT_WHATSAPP && <BulleWhatsApp numero={env.CONTACT_WHATSAPP} />}
      </body>
    </html>
  );
}
