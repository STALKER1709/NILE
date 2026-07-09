import type { Prisma, Produit, StatutProduit } from "@prisma/client";
import { prisma } from "@/lib/db";
import { genererSlugProduit } from "@/modules/catalogue/slug";
import {
  construireWhereProduits,
  construireOrderBy,
  type FiltresRecherche,
  type TriProduits,
} from "@/modules/catalogue/recherche";
import { getStorageProvider } from "@/modules/stockage";
import {
  TYPES_IMAGE_ACCEPTES,
  TAILLE_IMAGE_MAX_OCTETS,
  type FichierAEnregistrer,
} from "@/modules/stockage/StorageProvider";
import type { ProduitInput } from "@/validators/produit";

/** Propriété : un vendeur ne peut agir que sur SES produits. Fonction PURE. */
export function estProprietaire(
  vendeurId: string,
  produitVendeurId: string,
): boolean {
  return vendeurId === produitVendeurId;
}

// --------------------------------- VENDEUR -----------------------------------

export async function listerProduitsVendeur(vendeurId: string) {
  return prisma.produit.findMany({
    where: { vendeurId },
    orderBy: { dateMaj: "desc" },
    include: { images: { orderBy: { ordre: "asc" }, take: 1 }, categorie: true },
  });
}

export async function getProduitDuVendeur(
  vendeurId: string,
  produitId: string,
): Promise<
  | (Produit & {
      images: { id: string; url: string; ordre: number }[];
    })
  | null
> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: { images: { orderBy: { ordre: "asc" } } },
  });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) return null;
  return produit;
}

export async function creerProduit(
  vendeurId: string,
  input: ProduitInput,
): Promise<Produit> {
  return prisma.produit.create({
    data: {
      vendeurId,
      categorieId: input.categorieId,
      titre: input.titre,
      slug: genererSlugProduit(input.titre),
      description: input.description,
      prix: input.prix,
      stock: input.stock,
      statut: "BROUILLON",
    },
  });
}

export type ResultatMaj = { ok: true } | { ok: false; code: "INTROUVABLE" };

export async function mettreAJourProduit(
  vendeurId: string,
  produitId: string,
  input: ProduitInput,
): Promise<ResultatMaj> {
  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  await prisma.produit.update({
    where: { id: produitId },
    data: {
      titre: input.titre,
      description: input.description,
      prix: input.prix,
      stock: input.stock,
      categorieId: input.categorieId,
    },
  });
  return { ok: true };
}

export type ResultatStatut =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "BOUTIQUE_NON_VALIDEE" };

/**
 * Change le statut d'un produit. Garde-fou : publier (ACTIF) exige une boutique
 * VALIDÉE.
 */
export async function changerStatutProduit(
  vendeurId: string,
  produitId: string,
  nouveauStatut: Extract<StatutProduit, "BROUILLON" | "ACTIF" | "INACTIF">,
): Promise<ResultatStatut> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: { vendeur: true },
  });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (
    nouveauStatut === "ACTIF" &&
    produit.vendeur.statutValidation !== "VALIDE"
  ) {
    return { ok: false, code: "BOUTIQUE_NON_VALIDEE" };
  }
  await prisma.produit.update({
    where: { id: produitId },
    data: { statut: nouveauStatut },
  });
  return { ok: true };
}

export async function supprimerProduit(
  vendeurId: string,
  produitId: string,
): Promise<ResultatMaj> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: { images: true },
  });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  // Supprime d'abord les fichiers image (best-effort), puis la ligne (cascade DB).
  const storage = getStorageProvider();
  for (const image of produit.images) {
    if (image.chemin) {
      await storage.supprimer(image.chemin).catch((e) => {
        console.error("Suppression fichier image échouée:", e);
      });
    }
  }
  await prisma.produit.delete({ where: { id: produitId } });
  return { ok: true };
}

// --------------------------------- IMAGES ------------------------------------

export type ResultatImage =
  | { ok: true }
  | {
      ok: false;
      code: "INTROUVABLE" | "TYPE_INVALIDE" | "TROP_LOURDE" | "STOCKAGE_INDISPONIBLE";
    };

export async function ajouterImageProduit(
  vendeurId: string,
  produitId: string,
  fichier: FichierAEnregistrer,
): Promise<ResultatImage> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: { _count: { select: { images: true } } },
  });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (!TYPES_IMAGE_ACCEPTES.includes(fichier.typeMime as never)) {
    return { ok: false, code: "TYPE_INVALIDE" };
  }
  if (fichier.contenu.byteLength > TAILLE_IMAGE_MAX_OCTETS) {
    return { ok: false, code: "TROP_LOURDE" };
  }

  let enregistre;
  try {
    enregistre = await getStorageProvider().enregistrer(fichier);
  } catch (erreur) {
    // Le stockage a échoué (ex. bucket absent) : on ne casse pas la création
    // du produit ; le produit reste, seule l'image n'est pas ajoutée.
    console.error("Upload image échoué:", erreur);
    return { ok: false, code: "STOCKAGE_INDISPONIBLE" };
  }
  await prisma.imageProduit.create({
    data: {
      produitId,
      url: enregistre.url,
      chemin: enregistre.chemin,
      ordre: produit._count.images,
    },
  });
  return { ok: true };
}

export async function supprimerImageProduit(
  vendeurId: string,
  imageId: string,
): Promise<ResultatMaj> {
  const image = await prisma.imageProduit.findUnique({
    where: { id: imageId },
    include: { produit: true },
  });
  if (!image || !estProprietaire(vendeurId, image.produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (image.chemin) {
    await getStorageProvider()
      .supprimer(image.chemin)
      .catch((e) => console.error("Suppression fichier image échouée:", e));
  }
  await prisma.imageProduit.delete({ where: { id: imageId } });
  return { ok: true };
}

// --------------------------------- CATALOGUE ---------------------------------

export interface OptionsCatalogue extends FiltresRecherche {
  tri: TriProduits;
  page: number;
  parPage: number;
}

export async function rechercherProduitsCatalogue(options: OptionsCatalogue) {
  const where = construireWhereProduits(options);
  const orderBy = construireOrderBy(options.tri);
  const page = Math.max(1, options.page);
  const parPage = options.parPage;

  const [produits, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      orderBy,
      skip: (page - 1) * parPage,
      take: parPage,
      include: {
        images: { orderBy: { ordre: "asc" }, take: 1 },
        vendeur: { select: { nomBoutique: true } },
      },
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    produits,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / parPage)),
  };
}

/** Fiche produit publique : visible seulement si ACTIF et boutique VALIDÉE. */
export async function getProduitPublicParSlug(slug: string) {
  const where: Prisma.ProduitWhereInput = {
    slug,
    statut: "ACTIF",
    vendeur: { is: { statutValidation: "VALIDE" } },
  };
  return prisma.produit.findFirst({
    where,
    include: {
      images: { orderBy: { ordre: "asc" } },
      vendeur: { select: { nomBoutique: true } },
      categorie: true,
    },
  });
}
