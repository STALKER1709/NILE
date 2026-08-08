/**
 * Lecture PURE de l'état du balayage des paiements (testable sans base).
 */

/**
 * Au-delà de ce silence, le balayage est considéré en panne.
 *
 * Il est planifié toutes les 5 minutes ; GitHub Actions décale volontiers ses
 * exécutions de quelques minutes en période de charge, et une exécution
 * manquée n'est pas une panne. Trente minutes laissent passer cinq
 * décalages — au-delà, ce n'est plus du retard.
 */
export const SILENCE_ALERTE_MS = 30 * 60 * 1000;

export type EtatBalayage =
  /** Il tourne : dernier passage récent. */
  | "ACTIF"
  /** Il a tourné, puis s'est tu depuis trop longtemps. */
  | "MUET"
  /** Il n'a jamais tourné : jamais configuré, ou secret posé d'un seul côté. */
  | "JAMAIS";

export function etatBalayage(
  dernier: { date: Date } | null,
  maintenant: Date = new Date(),
): EtatBalayage {
  if (!dernier) return "JAMAIS";
  const silence = maintenant.getTime() - dernier.date.getTime();
  return silence > SILENCE_ALERTE_MS ? "MUET" : "ACTIF";
}

/** Ce que l'administrateur doit lire, et pourquoi ça compte. */
export function messageBalayage(etat: EtatBalayage): string {
  if (etat === "ACTIF") return "Le balayage des paiements tourne normalement.";
  if (etat === "MUET") {
    return (
      "Le balayage des paiements ne s'est pas manifesté depuis plus de " +
      "30 minutes. Un acheteur qui paie puis ferme son navigateur ne serait " +
      "plus rattrapé : sa commande resterait en attente, argent encaissé. " +
      "Vérifie le workflow GitHub « Balayage des paiements en attente »."
    );
  }
  return (
    "Le balayage des paiements n'a JAMAIS tourné. Il faut poser CRON_SECRET " +
    "à l'identique sur l'hébergeur ET dans les secrets du dépôt GitHub — " +
    "s'il manque d'un seul côté, le balayage se tait sans rien signaler."
  );
}
