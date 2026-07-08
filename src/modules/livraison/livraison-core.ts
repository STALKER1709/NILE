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
