import Link from "next/link";
import { getUtilisateurCourant } from "@/modules/auth/access";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const utilisateur = await getUtilisateurCourant();

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">NILE Marketplace</h1>
        <p className="mt-2 text-gray-600">
          La marketplace du Cameroun. Paiement mobile (MTN MoMo, Orange Money)
          et paiement à la livraison.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Phase 0 — Fondations : comptes, rôles et authentification.
        </p>
      </section>

      {utilisateur ? (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-800">
            Connecté en tant que <strong>{utilisateur.nom}</strong> (
            {utilisateur.role}).
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/compte" className="text-nile hover:underline">
              → Mon compte (acheteur)
            </Link>
            {utilisateur.role === "VENDEUR" && (
              <Link href="/vendeur" className="text-nile hover:underline">
                → Espace vendeur
              </Link>
            )}
            {utilisateur.role === "ADMIN" && (
              <Link href="/admin" className="text-nile hover:underline">
                → Back-office admin
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-800">Bienvenue. Pour commencer :</p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/inscription"
              className="rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark"
            >
              Créer un compte
            </Link>
            <Link
              href="/connexion"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Se connecter
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
