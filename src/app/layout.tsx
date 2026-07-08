import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { deconnexionAction } from "@/app/(auth)/actions";

// Le layout lit la session (cookies) : rendu dynamique, pas de pré-génération statique.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NILE Marketplace",
  description: "Marketplace du Cameroun — achats en ligne, paiement mobile et à la livraison.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const utilisateur = await getUtilisateurCourant();

  return (
    <html lang="fr">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-lg font-bold text-nile">
                NILE
              </Link>
              <Link href="/catalogue" className="text-sm text-gray-600 hover:text-nile">
                Catalogue
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {utilisateur ? (
                <>
                  <span className="hidden text-gray-600 sm:inline">
                    {utilisateur.nom} · {utilisateur.role}
                  </span>
                  <Link href="/compte" className="text-nile hover:underline">
                    Mon compte
                  </Link>
                  <form action={deconnexionAction}>
                    <button
                      type="submit"
                      className="text-gray-500 hover:text-gray-900"
                    >
                      Se déconnecter
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/connexion" className="text-nile hover:underline">
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    className="rounded bg-nile px-3 py-1.5 font-medium text-white hover:bg-nile-dark"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
