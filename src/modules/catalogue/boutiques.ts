import { prisma } from "@/lib/db";

export interface BoutiqueTrouvee {
  id: string;
  nomBoutique: string;
  nbProduits: number;
}

/**
 * Recherche de boutiques par nom (autocomplétion + page résultats). Seules les
 * boutiques VALIDÉES ayant au moins un produit ACTIF sont exposées : on ne
 * renvoie jamais vers une boutique vide ou non vérifiée.
 */
export async function rechercherBoutiques(
  terme: string,
  limite = 6,
): Promise<BoutiqueTrouvee[]> {
  const t = terme.trim();
  if (t.length < 2) return [];
  const boutiques = await prisma.vendeur.findMany({
    where: {
      nomBoutique: { contains: t, mode: "insensitive" },
      statutValidation: "VALIDE",
      produits: { some: { statut: "ACTIF" } },
    },
    orderBy: { nomBoutique: "asc" },
    take: limite,
    select: {
      id: true,
      nomBoutique: true,
      _count: { select: { produits: { where: { statut: "ACTIF" } } } },
    },
  });
  return boutiques.map((b) => ({
    id: b.id,
    nomBoutique: b.nomBoutique,
    nbProduits: b._count.produits,
  }));
}
