import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VendeurPage() {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Espace vendeur</h1>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">Boutique</p>
        <p className="font-medium">{vendeur?.nomBoutique ?? "—"}</p>
        <p className="mt-2 text-sm">
          Statut de validation :{" "}
          <span className="font-medium">{vendeur?.statutValidation}</span>
        </p>
        {vendeur?.statutValidation === "EN_ATTENTE" && (
          <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Votre boutique est en attente de validation par un administrateur.
            Vous pourrez publier des produits une fois validée.
          </p>
        )}
      </section>

      <Link
        href="/vendeur/produits"
        className="inline-block rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark"
      >
        Gérer mes produits
      </Link>
    </div>
  );
}
