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
