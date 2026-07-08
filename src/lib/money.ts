/**
 * Aides pour l'argent en FCFA (XAF). Règle absolue : montants ENTIERS,
 * jamais de décimales. Toute la logique métier manipule des `number` entiers.
 */

/** Vérifie qu'un montant est un entier XAF valide (>= 0). */
export function estMontantXAFValide(montant: number): boolean {
  return Number.isInteger(montant) && montant >= 0;
}

/**
 * Formate un montant entier XAF pour l'affichage, ex : 150000 -> "150 000 FCFA".
 * Lève une erreur si le montant n'est pas un entier (bug à détecter tôt).
 */
export function formaterXAF(montant: number): string {
  if (!Number.isInteger(montant)) {
    throw new Error(`Montant XAF invalide (doit être entier) : ${montant}`);
  }
  const signe = montant < 0 ? "-" : "";
  const chiffres = Math.abs(montant)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${signe}${chiffres} FCFA`;
}
