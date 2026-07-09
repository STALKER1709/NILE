import { Prisma } from "@prisma/client";

/**
 * Construction des filtres de recherche du catalogue.
 * Le cœur (`construireWhereProduits`) est une fonction PURE, testable sans base.
 */

export type TriProduits = "recent" | "prix_asc" | "prix_desc" | "populaire";

export interface FiltresRecherche {
  q?: string;
  categorieIds?: string[];
  prixMin?: number;
  prixMax?: number;
}

/**
 * Un produit n'est visible au catalogue que s'il est ACTIF ET que sa boutique
 * est VALIDÉE. Cette règle est appliquée ici, de façon centralisée.
 */
export function construireWhereProduits(
  f: FiltresRecherche,
): Prisma.ProduitWhereInput {
  const where: Prisma.ProduitWhereInput = {
    statut: "ACTIF",
    vendeur: { is: { statutValidation: "VALIDE" } },
  };

  const terme = f.q?.trim();
  if (terme) {
    where.OR = [
      { titre: { contains: terme, mode: "insensitive" } },
      { description: { contains: terme, mode: "insensitive" } },
    ];
  }

  if (f.categorieIds && f.categorieIds.length > 0) {
    where.categorieId = { in: f.categorieIds };
  }

  const prix: Prisma.IntFilter = {};
  if (typeof f.prixMin === "number" && Number.isFinite(f.prixMin)) {
    prix.gte = f.prixMin;
  }
  if (typeof f.prixMax === "number" && Number.isFinite(f.prixMax)) {
    prix.lte = f.prixMax;
  }
  if (prix.gte !== undefined || prix.lte !== undefined) {
    where.prix = prix;
  }

  return where;
}

export function construireOrderBy(
  tri: TriProduits,
):
  | Prisma.ProduitOrderByWithRelationInput
  | Prisma.ProduitOrderByWithRelationInput[] {
  switch (tri) {
    case "prix_asc":
      return { prix: "asc" };
    case "prix_desc":
      return { prix: "desc" };
    case "populaire":
      return [{ noteMoyenne: "desc" }, { nbAvis: "desc" }];
    case "recent":
    default:
      return { dateCreation: "desc" };
  }
}

/** Convertit une valeur brute en entier positif, ou undefined. */
export function parseEntierPositif(valeur: unknown): number | undefined {
  if (typeof valeur !== "string" || valeur.trim() === "") return undefined;
  const n = Number(valeur);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

/**
 * Normalise les paramètres bruts d'URL en filtres propres.
 * Gère les incohérences : si prixMin > prixMax, on échange les deux.
 */
export function normaliserParamsRecherche(params: {
  q?: string;
  prixMin?: string;
  prixMax?: string;
  tri?: string;
}): {
  q?: string;
  prixMin?: number;
  prixMax?: number;
  tri: TriProduits;
} {
  let prixMin = parseEntierPositif(params.prixMin);
  let prixMax = parseEntierPositif(params.prixMax);
  if (
    typeof prixMin === "number" &&
    typeof prixMax === "number" &&
    prixMin > prixMax
  ) {
    [prixMin, prixMax] = [prixMax, prixMin];
  }

  const tri: TriProduits =
    params.tri === "prix_asc" ||
    params.tri === "prix_desc" ||
    params.tri === "populaire"
      ? params.tri
      : "recent";

  const q = params.q?.trim() ? params.q.trim() : undefined;
  return { q, prixMin, prixMax, tri };
}
