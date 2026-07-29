/**
 * Logique PURE de l'écran « Finances » du vendeur (testable sans I/O).
 *
 * Un vendeur voit deux flux d'argent :
 *  - ses VENTES, qui alimentent son solde une fois la commande livrée ET payée ;
 *  - les REVERSEMENTS que NILE lui a faits (transferts Mobile Money), qui
 *    diminuent d'autant ce qui lui reste dû.
 * Cette unité les fusionne en un seul historique daté.
 */

/** État d'une vente du point de vue du règlement au vendeur. */
export type EtatVente = "REGLEE" | "EN_ATTENTE" | "ANNULEE";

export interface TransactionVendeur {
  id: string;
  date: Date;
  /** "VENTE" crédite le vendeur, "REVERSEMENT" le débite. */
  type: "VENTE" | "REVERSEMENT";
  libelle: string;
  /** Référence lisible : numéro de commande, ou identifiant de reversement. */
  reference: string;
  /** Montant en FCFA, toujours positif : le signe découle du `type`. */
  montant: number;
  etat: EtatVente | "VERSE";
}

/**
 * Détermine si une vente est déjà due au vendeur, encore en attente, ou
 * annulée. Reflète exactement la règle de calcul du solde : une vente ne
 * compte que si la commande est LIVREE et PAYE.
 */
export function etatVente(
  statutCommande: string,
  statutPaiement: string,
): EtatVente {
  if (statutCommande === "ANNULEE" || statutCommande === "REFUSEE") {
    return "ANNULEE";
  }
  if (statutCommande === "LIVREE" && statutPaiement === "PAYE") {
    return "REGLEE";
  }
  return "EN_ATTENTE";
}

/**
 * Fusionne ventes et reversements en un historique unique, du plus récent au
 * plus ancien, tronqué à `limite` entrées.
 */
export function fusionnerTransactions(
  ventes: TransactionVendeur[],
  reversements: TransactionVendeur[],
  limite = 20,
): TransactionVendeur[] {
  return [...ventes, ...reversements]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limite);
}

/**
 * Hauteurs relatives (0-100) des barres d'un histogramme, proportionnelles à
 * la plus grande valeur de la série. Une série entièrement à zéro rend des
 * barres à zéro plutôt qu'une division par zéro.
 */
export function hauteursRelatives(valeurs: number[]): number[] {
  const max = Math.max(0, ...valeurs);
  if (max === 0) return valeurs.map(() => 0);
  return valeurs.map((v) => Math.round((Math.max(0, v) / max) * 100));
}
