/**
 * Décision PURE du suivi de paiement : faut-il interroger le fournisseur ?
 *
 * Isolée de la base et du réseau pour être testable, et parce que la règle
 * qu'elle porte touche à l'argent : interroger une commande déjà conclue, ou
 * déjà annulée, peut la faire basculer à tort.
 */

export type DecisionSuivi =
  /** Paiement en cours chez le fournisseur : on peut demander où il en est. */
  | "INTERROGER"
  /** Rien à demander : déjà conclu, annulé, ou payé à la livraison. */
  | "RIEN_A_FAIRE"
  /**
   * Paiement en attente mais AUCUNE référence fournisseur enregistrée : on ne
   * sait pas quoi demander. Anomalie — l'initiation a répondu sans référence,
   * ou son enregistrement a échoué. À journaliser, pas à ignorer.
   */
  | "SANS_REFERENCE";

export interface EtatPaiementCommande {
  modePaiement: string;
  statutPaiement: string;
  statutCommande: string;
  /** `Paiement.reference` : la référence attribuée par le fournisseur. */
  referenceFournisseur: string | null;
}

export function decisionSuivi(etat: EtatPaiementCommande): DecisionSuivi {
  // Paiement à la livraison : aucun fournisseur n'est impliqué.
  if (etat.modePaiement === "COD") return "RIEN_A_FAIRE";

  // Paiement déjà tranché : le relire ne changerait rien, et le reconclure
  // rejouerait des notifications déjà envoyées.
  if (etat.statutPaiement !== "EN_ATTENTE") return "RIEN_A_FAIRE";

  // Commande qui n'attend plus (annulée, refusée, déjà avancée) : même si le
  // fournisseur venait à répondre « payé », il serait trop tard pour la faire
  // basculer — le stock a été restitué. Ce cas relève d'un remboursement, pas
  // d'un rafraîchissement automatique.
  if (etat.statutCommande !== "EN_ATTENTE") return "RIEN_A_FAIRE";

  if (!etat.referenceFournisseur) return "SANS_REFERENCE";

  return "INTERROGER";
}
