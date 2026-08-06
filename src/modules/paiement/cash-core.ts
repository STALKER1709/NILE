/**
 * Logique PURE du suivi du cash encaissé à la livraison (COD).
 *
 * Depuis que les livreurs sont fournis par NILE, les espèces remontent à la
 * plateforme. Entre l'encaissement chez l'acheteur et la remise à NILE, la
 * somme est détenue par une personne : c'est cette fenêtre que le suivi rend
 * visible, et c'est elle qui décide si un vendeur peut être payé.
 */

export type DecisionRemiseCash =
  /** Le livreur détient l'argent : la remise peut être enregistrée. */
  | "OK"
  /** Déjà remis : ne pas réenregistrer, ce serait compter deux fois. */
  | "DEJA_REMIS"
  /** Rien n'a encore été encaissé (commande non livrée, ou refusée). */
  | "PAS_ENCAISSE"
  /** Commande réglée par Mobile Money : aucun cash n'a circulé. */
  | "SANS_OBJET";

export interface EtatCashCommande {
  modePaiement: string;
  statutCash: string;
}

export function decisionRemiseCash(etat: EtatCashCommande): DecisionRemiseCash {
  if (etat.modePaiement !== "COD") return "SANS_OBJET";
  if (etat.statutCash === "REVERSE") return "DEJA_REMIS";
  if (etat.statutCash !== "COLLECTE") return "PAS_ENCAISSE";
  return "OK";
}

/**
 * Ancienneté d'un cash non remis, en jours pleins.
 *
 * Sert à distinguer un retard normal d'un cash qui traîne : un livreur qui
 * garde des espèces trois semaines n'est pas dans le même cas que celui qui
 * remet le lendemain. Renvoie 0 quand la date manque, plutôt que d'inventer
 * une ancienneté.
 */
export function ancienneteJours(
  dateLivraison: Date | null | undefined,
  maintenant: Date = new Date(),
): number {
  if (!dateLivraison) return 0;
  const ecart = maintenant.getTime() - dateLivraison.getTime();
  if (ecart <= 0) return 0;
  return Math.floor(ecart / (24 * 60 * 60 * 1000));
}
