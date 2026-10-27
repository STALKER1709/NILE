/**
 * Logique PURE de l'écran « Finances » du vendeur.
 * Les reversements peuvent être en attente, payés ou rejetés.
 */
export type EtatVente = "REGLEE" | "EN_ATTENTE" | "ANNULEE";
export type EtatReversement = "VERSE" | "EN_ATTENTE" | "REJETE";

export interface TransactionVendeur {
  id: string;
  date: Date;
  type: "VENTE" | "REVERSEMENT";
  libelle: string;
  reference: string;
  montant: number;
  etat: EtatVente | EtatReversement;
}

export function etatVente(statutCommande: string, statutPaiement: string): EtatVente {
  if (statutCommande === "ANNULEE" || statutCommande === "REFUSEE") return "ANNULEE";
  if (statutCommande === "LIVREE" && statutPaiement === "PAYE") return "REGLEE";
  return "EN_ATTENTE";
}

export function fusionnerTransactions(ventes: TransactionVendeur[], reversements: TransactionVendeur[], limite = 20): TransactionVendeur[] {
  return [...ventes, ...reversements].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limite);
}

export function hauteursRelatives(valeurs: number[]): number[] {
  const max = Math.max(0, ...valeurs);
  if (max === 0) return valeurs.map(() => 0);
  return valeurs.map((v) => Math.round((Math.max(0, v) / max) * 100));
}
