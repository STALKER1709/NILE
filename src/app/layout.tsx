import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { compterArticlesPanier } from "@/modules/commande/panier";
import { listerCategories } from "@/modules/catalogue/categories";
import { Entete } from "@/components/layout/Entete";
import { PiedDePage } from "@/components/layout/PiedDePage";
import { NavMobile } from "@/components/layout/NavMobile";

export const metadata: Metadata = {
  title: "NILE Marketplace",
  description:
    "Marketplace du Cameroun — achats en ligne, paiement mobile (MTN MoMo, Orange Money) et à la livraison.",
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
  const nbArticles = utilisateur
    ? await compterArticlesPanier(utilisateur.id)
    : 0;
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
      </body>
    </html>
  );
}
