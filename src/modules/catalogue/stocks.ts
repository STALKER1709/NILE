import { prisma } from "@/lib/db";

/**
 * Stock réel de chaque produit, déclinaisons actives additionnées.
 *
 * `Produit.stock` n'est plus décrémenté à la vente depuis que les déclinaisons
 * portent le stock : tout écran qui le lit encore annonce un chiffre figé au
 * jour où l'article a été créé. Les produits sans aucune déclinaison active
 * comptent pour zéro, ce qui est exactement leur situation en rayon.
 */
export async function stocksParProduit(
  produitIds: string[],
): Promise<Map<string, number>> {
  const resultat = new Map<string, number>();
  if (produitIds.length === 0) return resultat;
  for (const id of produitIds) resultat.set(id, 0);

  const variantes = await prisma.varianteProduit.findMany({
    where: { produitId: { in: produitIds }, actif: true },
    select: { produitId: true, stock: true },
  });
  for (const v of variantes) {
    resultat.set(v.produitId, (resultat.get(v.produitId) ?? 0) + Math.max(0, v.stock));
  }
  return resultat;
}
