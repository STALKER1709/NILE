/**
 * Politique financière NILE validée par le propriétaire.
 * Montants en XAF/FCFA entiers. Les reversements sont traités en lot hebdomadaire.
 */
export const POLITIQUE_VENDEUR = Object.freeze({
  commissionPourcent: 12,
  reversement: Object.freeze({
    frequence: "HEBDOMADAIRE" as const,
    minimumXaf: 10_000,
    fraisSupplementaires: 0,
    moyens: ["MTN_MOMO", "ORANGE_MONEY"] as const,
    conditionBoutique: "VALIDE" as const,
    conditionVente: "LIVREE_ET_PAYEE" as const,
    paiementCODReversable: false,
  }),
  verification: Object.freeze({
    delaiCibleHeuresOuvrees: 48,
    identiteParticulier: ["CNI", "PASSEPORT"] as const,
    identiteEntreprise: ["DOCUMENT_ENTREPRISE", "PIECE_REPRESENTANT"] as const,
  }),
});

export function montantRespecteMinimumReversement(montantXaf: number): boolean {
  return Number.isSafeInteger(montantXaf) && montantXaf >= POLITIQUE_VENDEUR.reversement.minimumXaf;
}
