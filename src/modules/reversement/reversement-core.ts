/**
 * Logique PURE du calcul des reversements vendeurs (testable sans I/O).
 *
 * Règles métier (validées avec le propriétaire) :
 *  - Une vente devient due au vendeur quand la commande est LIVRÉE **et** PAYÉE.
 *  - Commission NILE : pourcentage configurable, arrondi au FCFA.
 *  - La boutique maison est exemptée (son argent EST celui de la plateforme).
 *  - Solde dû = net (brut - commission) - somme des reversements déjà faits.
 *
 * Les deux modes de paiement n'ont pas le même effet, et c'est tout l'enjeu de
 * ce calcul :
 *  - **Mobile Money** : NILE encaisse, donc NILE doit reverser au vendeur.
 *  - **Paiement à la livraison** : les espèces vont directement au livreur de
 *    la boutique, le vendeur détient déjà sa recette. NILE n'a rien à lui
 *    reverser — mais la commission reste due.
 *
 * D'où la dissymétrie : le cash entre dans l'assiette de commission, jamais
 * dans le montant reversable. Concrètement, la commission des ventes COD est
 * retenue sur les reversements Mobile Money du même vendeur. C'est ce qui
 * permet à NILE de percevoir sa part sans jamais toucher les espèces.
 */

export interface CalculSolde {
  /** Ventes Mobile Money livrées et payées : ce que NILE a encaissé pour le
   * vendeur, et donc la seule base reversable. En FCFA. */
  brut: number;
  /** Ventes à la livraison livrées et payées : le vendeur a déjà cet argent.
   * Compte dans l'assiette de commission, jamais dans le reversable. */
  brutCOD: number;
  /** Commission NILE retenue, calculée sur `brut + brutCOD`, en FCFA. */
  commission: number;
  /**
   * Ce que le vendeur a gagné : `brut - commission`.
   *
   * PEUT ÊTRE NÉGATIF, et c'est voulu : un vendeur qui vend beaucoup en
   * espèces et peu en Mobile Money doit à NILE plus que NILE ne détient pour
   * lui. Masquer ce cas ferait disparaître une créance.
   */
  net: number;
  /** Déjà reversé au vendeur (versements effectivement payés). */
  dejaReverse: number;
  /**
   * Demandes de versement en attente de traitement. Réservé sur le solde sans
   * être payé : sans cette réservation, le vendeur pourrait demander deux fois
   * la même somme.
   */
  enAttente: number;
  /** Montant que le vendeur peut demander maintenant (jamais négatif). */
  solde: number;
  /** Dû total restant, demandes en attente incluses (net - dejaReverse). */
  restantDu: number;
  /**
   * Ce que le VENDEUR doit à NILE, quand la commission de ses ventes en
   * espèces dépasse ce que NILE détient pour lui. Zéro dans le cas courant.
   *
   * Cette créance ne se prélève pas toute seule : elle s'épongera sur les
   * prochaines ventes Mobile Money. Un vendeur qui n'en fait aucune la verra
   * grandir sans que le code puisse rien y faire — c'est un sujet commercial,
   * mais il doit au moins être visible.
   */
  dette: number;
}

export function calculerCommission(
  brut: number,
  tauxPourcent: number,
  exempte: boolean,
): number {
  if (exempte || brut <= 0) return 0;
  return Math.round((brut * tauxPourcent) / 100);
}

export function calculerSolde(params: {
  /** Ventes Mobile Money livrées et payées (base reversable). */
  brut: number;
  /** Ventes à la livraison livrées et payées. Absent = aucune (0). */
  brutCOD?: number;
  tauxPourcent: number;
  dejaReverse: number;
  /** Demandes en attente de traitement. Absent = aucune (0). */
  enAttente?: number;
  exempteCommission: boolean;
}): CalculSolde {
  const brut = Math.max(0, params.brut);
  const brutCOD = Math.max(0, params.brutCOD ?? 0);
  // Assiette de commission : TOUTES les ventes abouties, quel que soit le mode
  // de règlement. Le vendeur doit sa commission sur ce qu'il a vendu, pas sur
  // ce qui a transité par NILE.
  const commission = calculerCommission(
    brut + brutCOD,
    params.tauxPourcent,
    params.exempteCommission,
  );
  // Retranchée du seul montant reversable : les espèces sont déjà chez le
  // vendeur, NILE ne peut prélever que sur ce qu'elle détient.
  const net = brut - commission;
  const dejaReverse = Math.max(0, params.dejaReverse);
  const enAttente = Math.max(0, params.enAttente ?? 0);
  return {
    brut,
    brutCOD,
    commission,
    net,
    dejaReverse,
    enAttente,
    restantDu: Math.max(0, net - dejaReverse),
    // Le miroir de `restantDu` : ce qui bascule de l'autre côté quand la
    // commission des ventes en espèces dépasse ce que NILE détient.
    dette: Math.max(0, dejaReverse - net),
    // Les demandes en attente sont retirées du disponible : elles sont déjà
    // engagées, même si l'argent n'est pas encore parti.
    solde: Math.max(0, net - dejaReverse - enAttente),
  };
}

export type DecisionReversement =
  | { ok: true }
  | { ok: false; code: "MONTANT_INVALIDE" | "SOLDE_INSUFFISANT" };

/** Un reversement doit être positif et ne jamais dépasser le solde dû. */
export function verifierReversement(
  montant: number,
  solde: number,
): DecisionReversement {
  if (!Number.isInteger(montant) || montant <= 0) {
    return { ok: false, code: "MONTANT_INVALIDE" };
  }
  if (montant > solde) return { ok: false, code: "SOLDE_INSUFFISANT" };
  return { ok: true };
}
