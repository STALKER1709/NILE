/**
 * Logique PURE des promotions vendeur (testable sans I/O).
 *
 * Règles métier :
 *  - Une promotion cible SOIT un produit précis, SOIT toute la boutique
 *    (`produitId` nul) — jamais les deux à la fois.
 *  - Le prix réduit est toujours recalculé depuis `Produit.prix`, jamais
 *    stocké : si le vendeur change son prix pendant la promotion, la
 *    réduction reste cohérente.
 *  - Si un produit a une promotion active ET que sa boutique a une promotion
 *    boutique active en même temps, la promotion PRODUIT l'emporte (plus
 *    spécifique) — on ne cumule jamais deux réductions.
 *  - Le prix réduit ne descend jamais en dessous de 1 FCFA.
 */

export type TypePromotion = "POURCENTAGE" | "MONTANT";

export interface PromotionActive {
  id: string;
  produitId: string | null;
  type: TypePromotion;
  valeur: number;
  dateDebut: Date;
  dateFin: Date;
  annulee: boolean;
}

/** Bornes de `valeur` acceptées à la création, selon le type. */
export const POURCENTAGE_MIN = 1;
export const POURCENTAGE_MAX = 90;

export function estPromotionActive(
  promotion: Pick<PromotionActive, "annulee" | "dateDebut" | "dateFin">,
  maintenant: Date,
): boolean {
  return (
    !promotion.annulee &&
    maintenant >= promotion.dateDebut &&
    maintenant <= promotion.dateFin
  );
}

/** Réduction appliquée à un prix, plancher à 1 FCFA (jamais gratuit ni négatif). */
export function calculerPrixPromotionnel(
  prix: number,
  type: TypePromotion,
  valeur: number,
): number {
  const reduction = type === "POURCENTAGE" ? Math.round((prix * valeur) / 100) : valeur;
  return Math.max(1, prix - reduction);
}

export type DecisionPromotion =
  | { ok: true }
  | {
      ok: false;
      code: "VALEUR_INVALIDE" | "PERIODE_INVALIDE" | "PRIX_INSUFFISANT";
    };

/**
 * Valide les paramètres d'une promotion à la création. `prix` n'est requis
 * que pour les promotions produit (empêche une réduction en FCFA supérieure
 * ou égale au prix, ce qui donnerait un article gratuit).
 */
export function validerPromotion(params: {
  type: TypePromotion;
  valeur: number;
  dateDebut: Date;
  dateFin: Date;
  maintenant: Date;
  prixReference?: number;
}): DecisionPromotion {
  const { type, valeur, dateDebut, dateFin, maintenant, prixReference } = params;

  if (!Number.isInteger(valeur) || valeur <= 0) {
    return { ok: false, code: "VALEUR_INVALIDE" };
  }
  if (type === "POURCENTAGE" && (valeur < POURCENTAGE_MIN || valeur > POURCENTAGE_MAX)) {
    return { ok: false, code: "VALEUR_INVALIDE" };
  }
  if (dateFin <= dateDebut || dateFin <= maintenant) {
    return { ok: false, code: "PERIODE_INVALIDE" };
  }
  if (
    type === "MONTANT" &&
    prixReference !== undefined &&
    valeur >= prixReference
  ) {
    return { ok: false, code: "PRIX_INSUFFISANT" };
  }
  return { ok: true };
}

/** Deux périodes se chevauchent-elles (bornes incluses) ? */
export function periodesChevauchent(
  aDebut: Date,
  aFin: Date,
  bDebut: Date,
  bFin: Date,
): boolean {
  return aDebut <= bFin && bDebut <= aFin;
}

/**
 * Une nouvelle promotion peut-elle coexister avec les promotions déjà
 * enregistrées sur la même cible (même produit, ou boutique entière) ?
 * `existantes` doit déjà être filtré sur la même cible et exclure les
 * promotions annulées.
 */
export function promotionChevaucheExistantes(
  nouvelle: { dateDebut: Date; dateFin: Date },
  existantes: { dateDebut: Date; dateFin: Date }[],
): boolean {
  return existantes.some((p) =>
    periodesChevauchent(nouvelle.dateDebut, nouvelle.dateFin, p.dateDebut, p.dateFin),
  );
}

export interface AffichagePrix {
  prixOriginal: number;
  /** Prix réduit, ou null si aucune promotion active. */
  prixPromo: number | null;
  /** Pourcentage de réduction affiché (arrondi), ou null. */
  pourcentageReduction: number | null;
  promotionId: string | null;
}

/**
 * Choisit la promotion applicable à un produit parmi ses promotions actives
 * (le produit lui-même, et sa boutique), puis calcule le prix affiché.
 * La promotion PRODUIT l'emporte sur la promotion BOUTIQUE si les deux sont
 * actives en même temps.
 */
export function resoudreAffichagePrix(
  prixOriginal: number,
  promotionProduit: PromotionActive | null,
  promotionBoutique: PromotionActive | null,
  maintenant: Date,
): AffichagePrix {
  const applicable =
    promotionProduit && estPromotionActive(promotionProduit, maintenant)
      ? promotionProduit
      : promotionBoutique && estPromotionActive(promotionBoutique, maintenant)
        ? promotionBoutique
        : null;

  if (!applicable) {
    return {
      prixOriginal,
      prixPromo: null,
      pourcentageReduction: null,
      promotionId: null,
    };
  }

  const prixPromo = calculerPrixPromotionnel(prixOriginal, applicable.type, applicable.valeur);
  const pourcentageReduction =
    prixOriginal > 0 ? Math.round(((prixOriginal - prixPromo) / prixOriginal) * 100) : 0;

  return { prixOriginal, prixPromo, pourcentageReduction, promotionId: applicable.id };
}
