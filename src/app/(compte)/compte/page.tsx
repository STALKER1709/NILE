import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const utilisateur = await exigerConnexion();
  const vendeur =
    utilisateur.role === "VENDEUR"
      ? await prisma.vendeur.findUnique({
          where: { utilisateurId: utilisateur.id },
        })
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Mon compte</h1>

      <section className="flex flex-wrap gap-3">
        <Link href="/panier" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Mon panier
        </Link>
        <Link href="/commandes" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Mes commandes
        </Link>
        <Link href="/catalogue" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Catalogue
        </Link>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Nom</dt>
            <dd className="font-medium">{utilisateur.nom}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">{utilisateur.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Téléphone</dt>
            <dd className="font-medium">{utilisateur.telephone}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Rôle</dt>
            <dd className="font-medium">{utilisateur.role}</dd>
          </div>
        </dl>
      </section>

      {vendeur && (
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Ma boutique</h2>
          <p className="mt-1 text-sm text-gray-600">
            {vendeur.nomBoutique} — statut :{" "}
            <span className="font-medium">{vendeur.statutValidation}</span>
          </p>
          <Link
            href="/vendeur"
            className="mt-3 inline-block text-sm text-nile hover:underline"
          >
            → Aller à l'espace vendeur
          </Link>
        </section>
      )}

      {utilisateur.role === "ADMIN" && (
        <Link href="/admin" className="text-sm text-nile hover:underline">
          → Back-office admin
        </Link>
      )}
    </div>
  );
}
