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

export interface BoutiqueListe {
  id: string;
  nomBoutique: string;
  description: string | null;
  nbProduits: number;
  dateCreation: Date;
}

/**
 * Liste des boutiques publiques (annuaire, mise en avant sur l'accueil). Seules
 * les boutiques VALIDÉES ayant au moins un produit ACTIF apparaissent.
 * - tri « nom » : ordre alphabétique (annuaire).
 * - tri « populaire » : les mieux fournies d'abord (mise en avant).
 */
export async function listerBoutiques(
  opts: { tri?: "nom" | "populaire"; limite?: number } = {},
): Promise<BoutiqueListe[]> {
  const boutiques = await prisma.vendeur.findMany({
    where: {
      statutValidation: "VALIDE",
      produits: { some: { statut: "ACTIF" } },
    },
    orderBy: { nomBoutique: "asc" },
    select: {
      id: true,
      nomBoutique: true,
      description: true,
      dateCreation: true,
      _count: { select: { produits: { where: { statut: "ACTIF" } } } },
    },
  });
  let liste = boutiques.map((b) => ({
    id: b.id,
    nomBoutique: b.nomBoutique,
    description: b.description,
    nbProduits: b._count.produits,
    dateCreation: b.dateCreation,
  }));
  if (opts.tri === "populaire") {
    liste = [...liste].sort((a, b) => b.nbProduits - a.nbProduits);
  }
  if (opts.limite) liste = liste.slice(0, opts.limite);
  return liste;
}
