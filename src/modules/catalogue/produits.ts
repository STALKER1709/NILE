import { cache } from "react";
import { regrouperMarques } from "@/modules/catalogue/marque-core";
import { Prisma } from "@prisma/client";
import type { Produit, StatutProduit } from "@prisma/client";
import { prisma } from "@/lib/db";
import { genererSlugProduit } from "@/modules/catalogue/slug";
import {
  construireWhereProduits,
  construireOrderBy,
  type FiltresRecherche,
  type TriProduits,
} from "@/modules/catalogue/recherche";
import { getStorageProvider } from "@/modules/stockage";
import { enrichirProduitsPourCartes } from "@/modules/promotion/promotion";
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

/** Catalogue "vivant" d'un vendeur, hors corbeille (SUPPRIME). */
export async function listerProduitsVendeur(vendeurId: string) {
  return prisma.produit.findMany({
    where: { vendeurId, statut: { not: "SUPPRIME" } },
    orderBy: { dateMaj: "desc" },
    include: { images: { orderBy: { ordre: "asc" }, take: 1 }, categorie: true },
  });
}

/**
 * Page de l'inventaire d'un vendeur, avec recherche par titre.
 * La recherche est insensible à la casse ; le filtre reste borné au vendeur
 * passé en argument, jamais à un identifiant venant du client.
 *
 * `corbeille: true` bascule sur les produits supprimés (soft delete) au lieu
 * du catalogue actif — même pagination/recherche, vue différente.
 */
export async function rechercherProduitsVendeur(
  vendeurId: string,
  options: { q?: string; page: number; parPage: number; corbeille?: boolean },
) {
  const where: Prisma.ProduitWhereInput = {
    vendeurId,
    statut: options.corbeille ? "SUPPRIME" : { not: "SUPPRIME" },
  };
  if (options.q) {
    where.titre = { contains: options.q, mode: "insensitive" };
  }
  const page = Math.max(1, options.page);

  const [produits, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      orderBy: { dateMaj: "desc" },
      skip: (page - 1) * options.parPage,
      take: options.parPage,
      include: { images: { orderBy: { ordre: "asc" }, take: 1 }, categorie: true },
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    produits,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / options.parPage)),
  };
}

/**
 * Indicateurs d'inventaire d'un vendeur, calculés par agrégation sur TOUT le
 * catalogue de la boutique — ils ne doivent pas dépendre de la page affichée.
 * Les produits supprimés (corbeille) ne comptent pas dans l'inventaire.
 */
export async function statsInventaireVendeur(vendeurId: string): Promise<{
  total: number;
  enLigne: number;
  stockFaible: number;
  valeurStock: number;
  supprimes: number;
}> {
  const [total, enLigne, stockFaible, produits, supprimes] = await Promise.all([
    prisma.produit.count({ where: { vendeurId, statut: { not: "SUPPRIME" } } }),
    prisma.produit.count({ where: { vendeurId, statut: "ACTIF" } }),
    prisma.produit.count({ where: { vendeurId, statut: "ACTIF", stock: { lte: 2 } } }),
    // prix * stock n'est pas exprimable en agrégat SQL via Prisma : on ne
    // récupère que les deux colonnes nécessaires au calcul.
    prisma.produit.findMany({
      where: { vendeurId, statut: { not: "SUPPRIME" } },
      select: { prix: true, stock: true },
    }),
    prisma.produit.count({ where: { vendeurId, statut: "SUPPRIME" } }),
  ]);

  return {
    total,
    enLigne,
    stockFaible,
    valeurStock: produits.reduce((s, p) => s + p.prix * p.stock, 0),
    supprimes,
  };
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
      marque: input.marque,
      statut: "BROUILLON",
      // Déclinaison par défaut, SANS laquelle le produit serait invendable :
      // le panier et la commande ne connaissent plus que les déclinaisons, et
      // un produit qui n'en a aucune ne peut pas être ajouté. Ses deux axes
      // sont vides tant que le vendeur n'a pas décliné son article.
      variantes: { create: { valeur1: "", valeur2: "", stock: input.stock } },
    },
  });
}

export type ResultatMaj =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "SUPPRIME" };

/** Un produit dans la corbeille doit être restauré avant d'être modifié. */
function estModifiable(produit: { statut: StatutProduit }): boolean {
  return produit.statut !== "SUPPRIME";
}

export async function mettreAJourProduit(
  vendeurId: string,
  produitId: string,
  input: ProduitInput,
): Promise<ResultatMaj> {
  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (!estModifiable(produit)) {
    return { ok: false, code: "SUPPRIME" };
  }
  await prisma.produit.update({
    where: { id: produitId },
    data: {
      titre: input.titre,
      description: input.description,
      prix: input.prix,
      stock: input.stock,
      marque: input.marque,
      categorieId: input.categorieId,
    },
  });

  // Le champ « stock » du formulaire alimente la déclinaison PAR DÉFAUT, seule
  // lue à la vente. Sans cette écriture, le vendeur modifierait un chiffre que
  // plus personne ne consulte.
  //
  // `updateMany` filtré sur les deux axes vides : un produit réellement décliné
  // n'a pas de déclinaison par défaut, aucune ligne n'est donc touchée — ses
  // stocks se gèrent déclinaison par déclinaison, pas par un champ unique.
  await prisma.varianteProduit.updateMany({
    where: { produitId, valeur1: "", valeur2: "" },
    data: { stock: input.stock },
  });
  return { ok: true };
}

export type ResultatStatut =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "BOUTIQUE_NON_VALIDEE" | "SUPPRIME" };

/**
 * Change le statut d'un produit. Garde-fou : publier (ACTIF) exige une boutique
 * VALIDÉE. Un produit dans la corbeille (SUPPRIME) doit être restauré avant
 * de pouvoir changer de statut.
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
  if (!estModifiable(produit)) {
    return { ok: false, code: "SUPPRIME" };
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

/**
 * "Supprime" un produit : soft delete (statut SUPPRIME), jamais de
 * suppression réelle. Les images et l'historique de commandes restent
 * intacts — le vendeur peut restaurer le produit depuis sa corbeille.
 */
export async function supprimerProduit(
  vendeurId: string,
  produitId: string,
): Promise<ResultatMaj> {
  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  await prisma.produit.update({
    where: { id: produitId },
    data: { statut: "SUPPRIME" },
  });
  return { ok: true };
}

/**
 * Restaure un produit depuis la corbeille. Retour systématique en BROUILLON,
 * jamais directement ACTIF : le vendeur doit revérifier prix/stock avant de
 * republier, pas de republication silencieuse d'un produit resté en sommeil.
 */
export async function restaurerProduit(
  vendeurId: string,
  produitId: string,
): Promise<ResultatMaj> {
  const { count } = await prisma.produit.updateMany({
    where: { id: produitId, vendeurId, statut: "SUPPRIME" },
    data: { statut: "BROUILLON" },
  });
  return count > 0 ? { ok: true } : { ok: false, code: "INTROUVABLE" };
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
        vendeur: { select: { id: true, nomBoutique: true } },
        categorie: { select: { nom: true } },
      },
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    produits: await enrichirProduitsPourCartes(produits),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / parPage)),
  };
}

/**
 * Fiche produit publique : visible seulement si ACTIF et boutique VALIDÉE.
 * `cache()` : une seule requête par rendu même si la page ET generateMetadata
 * appellent cette fonction.
 */
export const getProduitPublicParSlug = cache(async (slug: string) => {
  const where: Prisma.ProduitWhereInput = {
    slug,
    statut: "ACTIF",
    vendeur: { is: { statutValidation: "VALIDE" } },
  };
  return prisma.produit.findFirst({
    where,
    include: {
      images: { orderBy: { ordre: "asc" } },
      vendeur: { select: { id: true, nomBoutique: true } },
      categorie: true,
    },
  });
});

/**
 * Produits similaires : même catégorie, achetables (ACTIF + boutique VALIDÉE),
 * hors produit courant. Les mieux notés d'abord. Pour le cross-sell de la
 * fiche produit (« Vous aimerez aussi »).
 */
export async function getProduitsSimilaires(
  categorieId: string,
  produitIdExclu: string,
  limite = 6,
) {
  const produits = await prisma.produit.findMany({
    where: {
      categorieId,
      id: { not: produitIdExclu },
      statut: "ACTIF",
      vendeur: { is: { statutValidation: "VALIDE" } },
    },
    orderBy: [{ noteMoyenne: "desc" }, { nbAvis: "desc" }, { dateCreation: "desc" }],
    take: limite,
    include: {
      images: { orderBy: { ordre: "asc" }, take: 1 },
      vendeur: { select: { id: true, nomBoutique: true } },
    },
  });
  return enrichirProduitsPourCartes(produits);
}

/**
 * Suggestions d'autocomplétion de recherche : produits dont le titre contient
 * le terme (achetables), triés par pertinence simple (les mieux notés).
 */
export async function suggererProduits(terme: string, limite = 6) {
  const t = terme.trim();
  if (t.length < 2) return [];
  return prisma.produit.findMany({
    where: {
      titre: { contains: t, mode: "insensitive" },
      statut: "ACTIF",
      vendeur: { is: { statutValidation: "VALIDE" } },
    },
    orderBy: [{ nbAvis: "desc" }, { noteMoyenne: "desc" }],
    take: limite,
    select: {
      slug: true,
      titre: true,
      prix: true,
      images: { orderBy: { ordre: "asc" }, take: 1, select: { url: true } },
    },
  });
}

/**
 * Marques présentes dans le catalogue visible, prêtes à être proposées en
 * filtre.
 *
 * Restreint aux produits ACTIFS de boutiques VALIDÉES : proposer une marque
 * qui ne ramène aucun résultat est le meilleur moyen de faire douter du
 * catalogue.
 *
 * Les variantes d'écriture — « Nike », « NIKE », « nike » — sont regroupées
 * en une seule entrée, la plus fréquente l'emportant.
 */
export async function listerMarquesCatalogue(
  categorieIds?: string[],
): Promise<string[]> {
  const lignes = await prisma.produit.findMany({
    where: {
      statut: "ACTIF",
      vendeur: { is: { statutValidation: "VALIDE" } },
      marque: { not: null },
      ...(categorieIds && categorieIds.length > 0
        ? { categorieId: { in: categorieIds } }
        : {}),
    },
    select: { marque: true },
  });
  return regrouperMarques(lignes.map((l) => l.marque ?? ""));
}

/** Marques déjà saisies par un vendeur, pour lui suggérer ses propres graphies. */
export async function listerMarquesVendeur(vendeurId: string): Promise<string[]> {
  const lignes = await prisma.produit.findMany({
    where: { vendeurId, statut: { not: "SUPPRIME" }, marque: { not: null } },
    select: { marque: true },
  });
  return regrouperMarques(lignes.map((l) => l.marque ?? ""));
}
