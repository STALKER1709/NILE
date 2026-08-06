/**
 * Logique PURE des commandes (aucune dépendance base/env) — testable directement.
 */

/** Total d'un ensemble de lignes (prix entier FCFA × quantité). */
export function calculerTotal(
  lignes: { prix: number; quantite: number }[],
): number {
  return lignes.reduce((somme, l) => somme + l.prix * l.quantite, 0);
}

/** Le stock couvre-t-il la quantité demandée ? */
export function stockSuffisant(stock: number, demande: number): boolean {
  return Number.isInteger(demande) && demande > 0 && stock >= demande;
}

export type DecisionCOD =
  | "OK"
  | "PLAFOND_DEPASSE"
  | "TROP_COMMANDES_NON_ABOUTIES";

/**
 * Garde-fous du paiement à la livraison :
 *  - le total ne doit pas dépasser le plafond COD ;
 *  - l'acheteur ne doit pas avoir trop de commandes non abouties (anti-fraude).
 */
export function evaluerCommandeCOD(params: {
  total: number;
  plafond: number;
  compteurNonAbouti: number;
  maxNonAbouti: number;
}): DecisionCOD {
  if (params.compteurNonAbouti >= params.maxNonAbouti) {
    return "TROP_COMMANDES_NON_ABOUTIES";
  }
  if (params.total > params.plafond) {
    return "PLAFOND_DEPASSE";
  }
  return "OK";
}

/**
 * Un vendeur peut-il encore vendre en « paiement à la livraison » ?
 *
 * Sur une vente en espèces, l'acheteur règle directement le livreur de la
 * boutique : la commission de NILE ne peut être retenue que sur les
 * reversements Mobile Money du même vendeur. Un vendeur qui ne vend qu'en
 * espèces accumule donc une dette que rien ne vient éponger — et le système,
 * tel quel, récompense ce comportement.
 *
 * Couper le COD au-delà d'un seuil est auto-correcteur : ses ventes suivantes
 * passent par NILE, la commission se prélève d'elle-même, la dette s'éteint.
 * Ses produits restent en vente — on ferme la vanne, on ne sanctionne pas.
 *
 * Un seuil nul ou négatif désactive le garde-fou : sans cette échappatoire,
 * une configuration à zéro couperait le COD à tout le monde, y compris aux
 * vendeurs sans la moindre dette.
 */
export function codBloqueParDette(dette: number, seuil: number): boolean {
  if (seuil <= 0) return false;
  return dette >= seuil;
}
