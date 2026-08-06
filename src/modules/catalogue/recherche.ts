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
  /** Marques retenues. Comparaison insensible à la casse. */
  marques?: string[];
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
      // Chercher « nike » doit ramener les articles de cette marque même si
      // elle n'apparaît ni dans le titre ni dans la description.
      { marque: { contains: terme, mode: "insensitive" } },
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

  const marques = (f.marques ?? []).map((m) => m.trim()).filter(Boolean);
  if (marques.length > 0) {
    // Une liste de `equals` insensibles à la casse plutôt qu'un `in` : ce
    // dernier est sensible à la casse en Postgres, et laisserait de côté les
    // articles saisis « NIKE » quand le filtre dit « Nike ».
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: marques.map((m) => ({ marque: { equals: m, mode: "insensitive" as const } })) },
    ];
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
  /** Marques cochées, séparées par des virgules dans l'URL. */
  marques?: string;
}): {
  q?: string;
  prixMin?: number;
  prixMax?: number;
  marques: string[];
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
  // Dédoublonnées et bornées : l'URL est publique, rien n'empêche d'y coller
  // deux cents marques pour alourdir la requête.
  const marques = [
    ...new Set(
      (params.marques ?? "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
  return { q, prixMin, prixMax, marques, tri };
}
