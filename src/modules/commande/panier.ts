import { prisma } from "@/lib/db";
import {
  trouverVariante,
  evaluerAjoutPanier,
} from "@/modules/catalogue/variante-core";

/** Panier de l'utilisateur, avec lignes + infos produit. Créé si absent. */
export async function getPanierAvecLignes(utilisateurId: string) {
  const include = {
    lignes: {
      orderBy: { produit: { titre: "asc" } },
      include: {
        variante: true,
        produit: {
          include: {
            images: { orderBy: { ordre: "asc" }, take: 1 },
            vendeur: { select: { statutValidation: true, nomBoutique: true } },
          },
        },
      },
    },
  } as const;

  const panier = await prisma.panier.findUnique({
    where: { utilisateurId },
    include,
  });
  if (panier) return panier;
  return prisma.panier.create({ data: { utilisateurId }, include });
}

/** Un produit est achetable s'il est ACTIF et sa boutique VALIDÉE. */
function estAchetable(produit: {
  statut: string;
  vendeur: { statutValidation: string };
}): boolean {
  return (
    produit.statut === "ACTIF" && produit.vendeur.statutValidation === "VALIDE"
  );
}

export type ResultatPanier =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "INDISPONIBLE" | "STOCK_INSUFFISANT" };

/** Résultat d'un ajustement de quantité : renvoie la quantité finale en panier. */
export type ResultatQuantitePanier =
  | { ok: true; quantite: number }
  | { ok: false; code: "INTROUVABLE" | "INDISPONIBLE" | "STOCK_INSUFFISANT" };

/**
 * Ajoute une DÉCLINAISON au panier.
 *
 * `choix` est facultatif : un produit sans taille ni couleur n'a qu'une
 * variante, portant deux chaînes vides, et l'appelant n'a rien à préciser.
 */
export async function ajouterAuPanier(
  utilisateurId: string,
  produitId: string,
  quantite: number,
  choix?: { taille?: string; couleur?: string },
): Promise<ResultatQuantitePanier> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: {
      vendeur: { select: { statutValidation: true } },
      variantes: true,
    },
  });
  if (!produit) return { ok: false, code: "INTROUVABLE" };
  if (!estAchetable(produit)) return { ok: false, code: "INDISPONIBLE" };

  const variante = trouverVariante(produit.variantes, choix ?? {});
  if (!variante) return { ok: false, code: "INTROUVABLE" };

  const panier = await prisma.panier.upsert({
    where: { utilisateurId },
    update: {},
    create: { utilisateurId },
  });

  const existante = await prisma.lignePanier.findUnique({
    where: {
      panierId_varianteId: { panierId: panier.id, varianteId: variante.id },
    },
  });

  // Le stock se vérifie sur la DÉCLINAISON, pas sur le produit : il peut
  // rester dix M et plus un seul XL.
  const decision = evaluerAjoutPanier({
    variante,
    quantiteDemandee: quantite,
    quantiteDejaAuPanier: existante?.quantite ?? 0,
  });
  if (decision === "INTROUVABLE") return { ok: false, code: "INTROUVABLE" };
  if (decision === "INDISPONIBLE") return { ok: false, code: "INDISPONIBLE" };
  if (decision !== "OK") return { ok: false, code: "STOCK_INSUFFISANT" };

  const quantiteVoulue = (existante?.quantite ?? 0) + quantite;
  await prisma.lignePanier.upsert({
    where: {
      panierId_varianteId: { panierId: panier.id, varianteId: variante.id },
    },
    update: { quantite: quantiteVoulue },
    create: { panierId: panier.id, produitId, varianteId: variante.id, quantite },
  });
  return { ok: true, quantite: quantiteVoulue };
}

/**
 * Retire une unité d'un produit du panier (comportement « supermarché »).
 * À 0, la ligne est supprimée. Retirer un produit absent n'est pas une erreur.
 */
export async function retirerUneUnite(
  utilisateurId: string,
  produitId: string,
): Promise<ResultatQuantitePanier> {
  const ligne = await prisma.lignePanier.findFirst({
    where: { produitId, panier: { utilisateurId } },
  });
  if (!ligne) return { ok: true, quantite: 0 };

  const nouvelle = ligne.quantite - 1;
  if (nouvelle <= 0) {
    await prisma.lignePanier.delete({ where: { id: ligne.id } });
    return { ok: true, quantite: 0 };
  }
  await prisma.lignePanier.update({
    where: { id: ligne.id },
    data: { quantite: nouvelle },
  });
  return { ok: true, quantite: nouvelle };
}

/**
 * Quantités du panier par produit (produitId -> quantité), pour afficher les
 * compteurs sur les cartes produit. Vide si non connecté.
 */
export async function getQuantitesPanier(
  utilisateurId: string | null,
): Promise<Record<string, number>> {
  if (!utilisateurId) return {};
  const lignes = await prisma.lignePanier.findMany({
    where: { panier: { utilisateurId } },
    select: { produitId: true, quantite: true },
  });
  // Somme par PRODUIT : un même article peut être au panier en plusieurs
  // déclinaisons, et le compteur affiché sur sa carte doit les additionner.
  const map: Record<string, number> = {};
  for (const l of lignes) map[l.produitId] = (map[l.produitId] ?? 0) + l.quantite;
  return map;
}

export async function modifierQuantite(
  utilisateurId: string,
  ligneId: string,
  quantite: number,
): Promise<ResultatPanier> {
  const ligne = await prisma.lignePanier.findUnique({
    where: { id: ligneId },
    include: { panier: true, variante: true },
  });
  if (!ligne || ligne.panier.utilisateurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (quantite <= 0) {
    await prisma.lignePanier.delete({ where: { id: ligneId } });
    return { ok: true };
  }
  // Sur la DÉCLINAISON : c'est elle qui porte le stock. `quantiteDejaAuPanier`
  // est omis, la quantité reçue REMPLACE celle du panier au lieu de s'y
  // ajouter.
  const decision = evaluerAjoutPanier({
    variante: ligne.variante,
    quantiteDemandee: quantite,
  });
  if (decision === "INDISPONIBLE") return { ok: false, code: "INDISPONIBLE" };
  if (decision !== "OK") return { ok: false, code: "STOCK_INSUFFISANT" };
  await prisma.lignePanier.update({
    where: { id: ligneId },
    data: { quantite },
  });
  return { ok: true };
}

export async function retirerLigne(
  utilisateurId: string,
  ligneId: string,
): Promise<ResultatPanier> {
  const ligne = await prisma.lignePanier.findUnique({
    where: { id: ligneId },
    include: { panier: true },
  });
  if (!ligne || ligne.panier.utilisateurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }
  await prisma.lignePanier.delete({ where: { id: ligneId } });
  return { ok: true };
}

/**
 * Retire complètement un produit du panier d'un utilisateur, quelle que soit
 * sa quantité. La suppression est bornée au panier de l'utilisateur passé en
 * argument : un identifiant de produit fourni par le client ne peut donc pas
 * toucher le panier d'un tiers.
 */
export async function retirerProduit(
  utilisateurId: string,
  produitId: string,
): Promise<ResultatPanier> {
  const panier = await prisma.panier.findUnique({
    where: { utilisateurId },
    select: { id: true },
  });
  if (!panier) return { ok: false, code: "INTROUVABLE" };
  const { count } = await prisma.lignePanier.deleteMany({
    where: { panierId: panier.id, produitId },
  });
  return count > 0 ? { ok: true } : { ok: false, code: "INTROUVABLE" };
}

/**
 * Vide entièrement le panier d'un utilisateur. Le panier est retrouvé par
 * l'identifiant de l'utilisateur (jamais par un identifiant fourni par le
 * client), donc aucun panier tiers ne peut être visé.
 */
export async function viderPanier(
  utilisateurId: string,
): Promise<{ retirees: number }> {
  const panier = await prisma.panier.findUnique({
    where: { utilisateurId },
    select: { id: true },
  });
  if (!panier) return { retirees: 0 };
  const { count } = await prisma.lignePanier.deleteMany({
    where: { panierId: panier.id },
  });
  return { retirees: count };
}

/** Nombre total d'articles dans le panier (pour le badge de navigation). */
export async function compterArticlesPanier(
  utilisateurId: string,
): Promise<number> {
  const lignes = await prisma.lignePanier.findMany({
    where: { panier: { utilisateurId } },
    select: { quantite: true },
  });
  return lignes.reduce((s, l) => s + l.quantite, 0);
}
