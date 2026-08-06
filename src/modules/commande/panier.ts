import { prisma } from "@/lib/db";
import { evaluerAjoutPanier } from "@/modules/catalogue/variante-core";

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
 * C'est la déclinaison — et non le produit — qui est l'unité du panier : un
 * même t-shirt peut y figurer deux fois, en M et en XL, avec des stocks
 * distincts. L'appelant désigne donc toujours une déclinaison, y compris pour
 * un article qui n'en propose qu'une seule (celle par défaut, à axes vides).
 */
export async function ajouterVarianteAuPanier(
  utilisateurId: string,
  varianteId: string,
  quantite: number,
): Promise<ResultatQuantitePanier> {
  const variante = await prisma.varianteProduit.findUnique({
    where: { id: varianteId },
    include: {
      produit: {
        select: {
          id: true,
          statut: true,
          vendeur: { select: { statutValidation: true } },
        },
      },
    },
  });
  if (!variante) return { ok: false, code: "INTROUVABLE" };
  if (!estAchetable(variante.produit)) return { ok: false, code: "INDISPONIBLE" };

  const panier = await prisma.panier.upsert({
    where: { utilisateurId },
    update: {},
    create: { utilisateurId },
  });

  const existante = await prisma.lignePanier.findUnique({
    where: { panierId_varianteId: { panierId: panier.id, varianteId } },
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
    where: { panierId_varianteId: { panierId: panier.id, varianteId } },
    update: { quantite: quantiteVoulue },
    create: {
      panierId: panier.id,
      produitId: variante.produit.id,
      varianteId,
      quantite,
    },
  });
  return { ok: true, quantite: quantiteVoulue };
}

/**
 * Retire une unité d'une déclinaison du panier (comportement « supermarché »).
 * À 0, la ligne est supprimée. Retirer ce qui n'y est pas n'est pas une erreur.
 */
export async function retirerUneUnite(
  utilisateurId: string,
  varianteId: string,
): Promise<ResultatQuantitePanier> {
  const ligne = await prisma.lignePanier.findFirst({
    where: { varianteId, panier: { utilisateurId } },
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

/**
 * Quantités du panier par DÉCLINAISON, pour la fiche produit : le compteur
 * doit y suivre la taille sélectionnée, et repartir de zéro quand l'acheteur
 * en choisit une autre qu'il n'a pas encore prise.
 */
export async function getQuantitesParVariante(
  utilisateurId: string | null,
  produitId: string,
): Promise<Record<string, number>> {
  if (!utilisateurId) return {};
  const lignes = await prisma.lignePanier.findMany({
    where: { produitId, panier: { utilisateurId } },
    select: { varianteId: true, quantite: true },
  });
  const map: Record<string, number> = {};
  for (const l of lignes) map[l.varianteId] = l.quantite;
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
 * Retire complètement une déclinaison du panier, quelle que soit sa quantité.
 *
 * Sur la déclinaison et non sur le produit : retirer « le t-shirt » ferait
 * disparaître d'un coup le M et le XL, alors que l'acheteur n'en visait qu'un.
 *
 * La suppression est bornée au panier de l'utilisateur passé en argument : un
 * identifiant fourni par le client ne peut donc pas toucher le panier d'un
 * tiers.
 */
export async function retirerVariante(
  utilisateurId: string,
  varianteId: string,
): Promise<ResultatPanier> {
  const panier = await prisma.panier.findUnique({
    where: { utilisateurId },
    select: { id: true },
  });
  if (!panier) return { ok: false, code: "INTROUVABLE" };
  const { count } = await prisma.lignePanier.deleteMany({
    where: { panierId: panier.id, varianteId },
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
