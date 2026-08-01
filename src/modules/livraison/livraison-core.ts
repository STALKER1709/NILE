import type { StatutCommande } from "@prisma/client";

/**
 * Règles PURES des transitions de livraison (suivi manuel admin).
 * Centralise « quelle action est possible dans quel état » — testable sans base.
 *
 * Flux : CONFIRMEE → EN_PREPARATION → EXPEDIEE → LIVREE
 *        (refus possible depuis EN_PREPARATION ou EXPEDIEE → REFUSEE)
 */

export function peutAffecterTransporteur(statut: StatutCommande): boolean {
  return statut === "CONFIRMEE";
}

export function peutExpedier(statut: StatutCommande): boolean {
  return statut === "EN_PREPARATION";
}

export function peutLivrer(statut: StatutCommande): boolean {
  return statut === "EXPEDIEE";
}

export function peutRefuser(statut: StatutCommande): boolean {
  return statut === "EN_PREPARATION" || statut === "EXPEDIEE";
}

// ----------------------- ATTESTATION DE RÉCEPTION ACHETEUR -------------------

/**
 * Délai après la livraison déclarée par le vendeur/livreur avant de rappeler
 * à l'acheteur de confirmer qu'il a bien reçu son colis.
 */
export const DELAI_RAPPEL_CONFIRMATION_MINUTES = 30;

/**
 * L'acheteur peut-il attester la réception ? Uniquement une commande déjà
 * marquée LIVREE par le vendeur/livreur, et pas déjà confirmée.
 */
export function peutConfirmerReception(
  statutCommande: StatutCommande,
  confirmationAcheteur: Date | null,
): boolean {
  return statutCommande === "LIVREE" && confirmationAcheteur === null;
}

/**
 * Faut-il envoyer le rappel « avez-vous bien reçu ? » ?
 * Un SEUL rappel par commande : `rappelDejaEnvoye` verrouille toute relance.
 */
export function doitRappelerConfirmation(
  livraison: {
    dateLivraison: Date | null;
    confirmationAcheteur: Date | null;
    rappelConfirmationEnvoye: boolean;
  },
  maintenant: Date,
): boolean {
  if (livraison.confirmationAcheteur !== null) return false;
  if (livraison.rappelConfirmationEnvoye) return false;
  if (livraison.dateLivraison === null) return false;

  const ecoule = maintenant.getTime() - livraison.dateLivraison.getTime();
  return ecoule >= DELAI_RAPPEL_CONFIRMATION_MINUTES * 60 * 1000;
}

/** Date limite : les livraisons antérieures sont éligibles au rappel. */
export function seuilRappelConfirmation(maintenant: Date): Date {
  return new Date(maintenant.getTime() - DELAI_RAPPEL_CONFIRMATION_MINUTES * 60 * 1000);
}
