import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { compterArticlesPanier } from "@/modules/commande/panier";
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
  themeColor: "#0f766e",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const utilisateur = await getUtilisateurCourant();
  const nbArticles = utilisateur
    ? await compterArticlesPanier(utilisateur.id)
    : 0;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen">
        <Entete
          utilisateur={
            utilisateur ? { nom: utilisateur.nom, role: utilisateur.role } : null
          }
          nbArticles={nbArticles}
        />
        {/* pb-20 : laisse la place à la barre de navigation mobile fixe */}
        <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-6">{children}</main>
        <PiedDePage />
        <NavMobile connecte={!!utilisateur} nbArticles={nbArticles} />
      </body>
    </html>
  );
}
