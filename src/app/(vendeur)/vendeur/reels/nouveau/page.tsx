import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { ComposeurReels } from "@/components/reels/ComposeurReels";
import { EtatVide, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouvelle publication" };

/**
 * Création d'une publication. Le vendeur non validé ne voit PAS le composeur :
 * on lui explique l'étape manquante plutôt que de laisser un envoi échouer.
 */
export default async function NouvelleReelPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();

  if (vendeur.statutValidation !== "VALIDE") {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-titre-sm text-nile-800">Nouvelle publication</h1>
        <EtatVide titre="Votre boutique n'est pas encore validée.">
          <p className="mt-1 text-corps-sm text-slate-500">
            La publication de Reels est réservée aux boutiques vérifiées par
            NILE : c&apos;est ce qui donne du sens au badge « boutique vérifiée »
            affiché aux acheteurs.
          </p>
          <Link href="/compte" className={`${btn("secondaire", "md")} mt-4`}>
            Voir l&apos;état de ma boutique
          </Link>
        </EtatVide>
      </div>
    );
  }

  // Produits en ligne uniquement : taguer un brouillon ou un produit masqué
  // serait un lien mort côté acheteur (revérifié aussi à la création).
  const produits = await prisma.produit.findMany({
    where: { vendeurId: vendeur.id, statut: "ACTIF" },
    select: { id: true, titre: true, prix: true },
    orderBy: { titre: "asc" },
    take: 300,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
          Nouvelle publication
        </h1>
        <p className="mt-0.5 text-corps-sm text-slate-500">
          Montrez votre boutique en images : atelier, stock, arrivages… et
          taguez les produits concernés pour convertir.
        </p>
      </div>

      {erreur && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {erreur}
        </p>
      )}

      <ComposeurReels produits={produits} />
    </div>
  );
}
