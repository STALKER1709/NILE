/**
 * Logique PURE du calcul des reversements vendeurs (testable sans I/O).
 *
 * Règles métier (validées avec le propriétaire) :
 *  - Une vente devient due au vendeur quand la commande est LIVRÉE **et** PAYÉE
 *    (COD : cash collecté ; Monetbil : callback vérifié).
 *  - Commission NILE : pourcentage configurable (défaut 10 %), arrondi au FCFA.
 *  - La boutique maison est exemptée (son argent EST celui de la plateforme).
 *  - Solde dû = net (brut - commission) - somme des reversements déjà faits.
 */

export interface CalculSolde {
  /** Ventes livrées et payées (somme des sous-totaux du vendeur), en FCFA. */
  brut: number;
  /** Commission NILE retenue, en FCFA. */
  commission: number;
  /** Ce que le vendeur a gagné (brut - commission). */
  net: number;
  /** Déjà reversé au vendeur. */
  dejaReverse: number;
  /** Reste à lui verser (net - dejaReverse, jamais négatif). */
  solde: number;
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
  brut: number;
  tauxPourcent: number;
  dejaReverse: number;
  exempteCommission: boolean;
}): CalculSolde {
  const brut = Math.max(0, params.brut);
  const commission = calculerCommission(
    brut,
    params.tauxPourcent,
    params.exempteCommission,
  );
  const net = brut - commission;
  const dejaReverse = Math.max(0, params.dejaReverse);
  return {
    brut,
    commission,
    net,
    dejaReverse,
    solde: Math.max(0, net - dejaReverse),
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
