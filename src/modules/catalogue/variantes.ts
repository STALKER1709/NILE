import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { estProprietaire } from "@/modules/catalogue/produits";
import { axesDeCategorie } from "@/modules/catalogue/axes";
import { verifierCombinaison } from "@/modules/catalogue/variante-core";

/**
 * Gestion des déclinaisons par le vendeur.
 *
 * Deux règles gouvernent tout ce fichier :
 *
 * 1. Un produit possède TOUJOURS au moins une déclinaison. Le panier et la
 *    commande ne connaissent qu'elles ; un produit sans déclinaison est
 *    invendable.
 * 2. Un produit a SOIT la déclinaison par défaut (deux axes vides), SOIT de
 *    vraies déclinaisons — jamais les deux. Sinon l'acheteur pourrait ajouter
 *    au panier « sans choisir de taille » alors que l'article est décliné.
 */

export type ResultatVariante =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INTROUVABLE"
        | "COMBINAISON_INVALIDE"
        | "DEJA_EXISTANTE"
        | "DERNIERE_DECLINAISON";
    };

/** Déclinaisons d'un produit du vendeur, ou `null` si le produit n'est pas à lui. */
export async function listerVariantesVendeur(
  vendeurId: string,
  produitId: string,
) {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { vendeurId: true },
  });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) return null;

  return prisma.varianteProduit.findMany({
    where: { produitId },
    orderBy: [{ valeur1: "asc" }, { valeur2: "asc" }],
  });
}

/**
 * Ajoute une déclinaison.
 *
 * La combinaison est validée contre les axes de la CATÉGORIE, côté serveur :
 * les listes déroulantes du formulaire ne protègent de rien, un formulaire
 * forgé pourrait créer une chaussure « taille XXL ».
 */
export async function ajouterVariante(
  vendeurId: string,
  produitId: string,
  valeur1: string,
  valeur2: string,
  stock: number,
): Promise<ResultatVariante> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { vendeurId: true, categorieId: true },
  });
  if (!produit || !estProprietaire(vendeurId, produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }

  const axes = await axesDeCategorie(produit.categorieId);
  const v1 = valeur1.trim();
  const v2 = valeur2.trim();
  if (verifierCombinaison(axes, v1, v2) !== "OK") {
    return { ok: false, code: "COMBINAISON_INVALIDE" };
  }
  // Une déclinaison sans aucune valeur est la déclinaison par défaut : elle
  // s'ajoute automatiquement à la création du produit, jamais à la main.
  if (!v1 && !v2) return { ok: false, code: "COMBINAISON_INVALIDE" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.varianteProduit.create({
        data: { produitId, valeur1: v1, valeur2: v2, stock: Math.max(0, stock) },
      });
      // Première vraie déclinaison : la déclinaison par défaut disparaît.
      // La laisser permettrait d'acheter l'article « sans taille », en
      // parallèle des tailles réelles. Les lignes de panier qui la visaient
      // partent avec elle (cascade) : l'acheteur devra choisir sa taille, ce
      // qui est exactement l'intention. Les commandes passées, elles, gardent
      // leur libellé figé.
      await tx.varianteProduit.deleteMany({
        where: { produitId, valeur1: "", valeur2: "" },
      });
    });
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, code: "DEJA_EXISTANTE" };
    }
    throw erreur;
  }
  return { ok: true };
}

/** Fixe le stock d'une déclinaison. */
export async function majStockVariante(
  vendeurId: string,
  varianteId: string,
  stock: number,
): Promise<ResultatVariante> {
  const variante = await prisma.varianteProduit.findUnique({
    where: { id: varianteId },
    select: { produit: { select: { vendeurId: true } } },
  });
  if (!variante || !estProprietaire(vendeurId, variante.produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  await prisma.varianteProduit.update({
    where: { id: varianteId },
    data: { stock: Math.max(0, stock) },
  });
  return { ok: true };
}

/**
 * Retire une déclinaison de la vente, ou l'y remet.
 *
 * Préféré à la suppression : les commandes passées y font référence, et une
 * déclinaison désactivée peut être réactivée quand le réassort arrive.
 */
export async function basculerVarianteActive(
  vendeurId: string,
  varianteId: string,
): Promise<ResultatVariante> {
  const variante = await prisma.varianteProduit.findUnique({
    where: { id: varianteId },
    select: { actif: true, produit: { select: { vendeurId: true } } },
  });
  if (!variante || !estProprietaire(vendeurId, variante.produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }
  await prisma.varianteProduit.update({
    where: { id: varianteId },
    data: { actif: !variante.actif },
  });
  return { ok: true };
}

/**
 * Supprime une déclinaison — refusée si c'est la dernière.
 *
 * Un produit sans déclinaison est invendable : plutôt que de le laisser dans
 * cet état, on impose au vendeur de retirer le produit lui-même s'il ne veut
 * plus le vendre.
 */
export async function supprimerVariante(
  vendeurId: string,
  varianteId: string,
): Promise<ResultatVariante> {
  const variante = await prisma.varianteProduit.findUnique({
    where: { id: varianteId },
    select: { produitId: true, produit: { select: { vendeurId: true } } },
  });
  if (!variante || !estProprietaire(vendeurId, variante.produit.vendeurId)) {
    return { ok: false, code: "INTROUVABLE" };
  }

  const total = await prisma.varianteProduit.count({
    where: { produitId: variante.produitId },
  });
  if (total <= 1) return { ok: false, code: "DERNIERE_DECLINAISON" };

  await prisma.varianteProduit.delete({ where: { id: varianteId } });
  return { ok: true };
}
