import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesPanier } from "@/modules/commande/panier";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { Badge, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

/** Boutique publique : uniquement les boutiques VALIDÉES, produits ACTIFS. */
async function getBoutique(id: string) {
  return prisma.vendeur.findFirst({
    where: { id, statutValidation: "VALIDE" },
    select: { id: true, nomBoutique: true, description: true, dateCreation: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boutique = await getBoutique(id);
  if (!boutique) return { title: "Boutique introuvable" };
  return {
    title: `Boutique ${boutique.nomBoutique}`,
    description:
      boutique.description ??
      `Tous les produits de ${boutique.nomBoutique} sur NILE Marketplace.`,
  };
}

export default async function BoutiquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boutique = await getBoutique(id);
  if (!boutique) notFound();

  const utilisateur = await getUtilisateurCourant();
  const [produits, quantites] = await Promise.all([
    prisma.produit.findMany({
      where: { vendeurId: boutique.id, statut: "ACTIF" },
      orderBy: { dateMaj: "desc" },
      include: {
        images: { orderBy: { ordre: "asc" }, take: 1 },
        vendeur: { select: { id: true, nomBoutique: true } },
      },
    }),
    getQuantitesPanier(utilisateur?.id ?? null),
  ]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl2 border border-gray-100 bg-white p-5 shadow-carte">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nile-50 text-xl font-bold text-nile">
            {boutique.nomBoutique.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">{boutique.nomBoutique}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge ton="vert">Boutique vérifiée</Badge>
              <span>
                Sur NILE depuis{" "}
                {new Date(boutique.dateCreation).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        </div>
        {boutique.description && (
          <p className="mt-3 text-sm text-gray-600">{boutique.description}</p>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Produits</h2>
        <span className="text-sm text-gray-500">
          {produits.length} produit{produits.length > 1 ? "s" : ""}
        </span>
      </div>

      {produits.length === 0 ? (
        <EtatVide titre="Cette boutique n'a pas encore de produits en ligne." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {produits.map((p, i) => (
            <CarteProduit
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 5}
            />
          ))}
        </div>
      )}
    </div>
  );
}
