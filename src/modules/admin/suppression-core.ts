/**
 * Décisions PURES autour des suppressions administrateur (testables sans base).
 *
 * Principe directeur : on n'efface jamais ce qui détruirait une trace de
 * vente. La base l'interdit déjà (clés étrangères RESTRICT sur
 * `LigneCommande`, `Avis`, `Reversement`) ; ces fonctions décident du repli
 * AVANT de heurter la contrainte, pour rendre un message clair plutôt qu'une
 * erreur de base de données.
 */

export type ModeSuppression =
  /** Ligne réellement effacée : aucun historique ne la référence. */
  | "DEFINITIVE"
  /** Produit conservé mais retiré de la vente (statut SUPPRIME). */
  | "CORBEILLE"
  /** Compte vidé de ses données personnelles, historique de vente préservé. */
  | "ANONYMISATION";

/** Un produit déjà commandé ne peut pas disparaître : la commande le référence. */
export function modeSuppressionProduit(nbLignesCommande: number): ModeSuppression {
  return nbLignesCommande > 0 ? "CORBEILLE" : "DEFINITIVE";
}

/**
 * Un compte ayant commandé, noté, vendu ou été payé laisse des écritures
 * qu'on ne peut pas casser : on l'anonymise au lieu de l'effacer.
 */
export function modeSuppressionUtilisateur(historique: {
  nbCommandes: number;
  nbAvis: number;
  nbLignesVendues: number;
  nbReversements: number;
}): ModeSuppression {
  const total =
    historique.nbCommandes +
    historique.nbAvis +
    historique.nbLignesVendues +
    historique.nbReversements;
  return total > 0 ? "ANONYMISATION" : "DEFINITIVE";
}

export type DecisionSuppressionCompte =
  | { ok: true }
  | { ok: false; code: "SOI_MEME" | "DERNIER_ADMIN" };

/**
 * Garde-fous d'accès : un administrateur ne peut ni se supprimer lui-même
 * (il perdrait la main en cours d'opération), ni retirer le dernier
 * administrateur (plus personne ne pourrait administrer la plateforme).
 */
export function verifierSuppressionCompte(params: {
  adminId: string;
  cibleId: string;
  cibleEstAdmin: boolean;
  nbAdmins: number;
}): DecisionSuppressionCompte {
  if (params.adminId === params.cibleId) return { ok: false, code: "SOI_MEME" };
  if (params.cibleEstAdmin && params.nbAdmins <= 1) {
    return { ok: false, code: "DERNIER_ADMIN" };
  }
  return { ok: true };
}

/**
 * Valeurs de remplacement d'un compte anonymisé. L'email reste unique (la
 * colonne l'exige) et pointe vers le domaine réservé `.invalid` (RFC 2606) :
 * aucune adresse réelle ne peut entrer en collision, et rien ne partira
 * jamais vers elle.
 */
export function donneesAnonymisation(utilisateurId: string): {
  nom: string;
  email: string;
  telephone: string;
} {
  return {
    nom: "Compte supprimé",
    email: `supprime-${utilisateurId}@nile.invalid`,
    telephone: "",
  };
}

/* ------------------------------ Purges globales ----------------------------- */

/** Phrase à recopier pour purger l'historique (commandes, avis, paiements…). */
export const PHRASE_PURGE = "VIDER LES DONNEES";

/** Phrase à recopier pour tout réinitialiser (catalogue et comptes compris). */
export const PHRASE_REINITIALISATION = "REINITIALISER NILE";

/**
 * La confirmation saisie correspond-elle ? Comparaison stricte après
 * normalisation des espaces : on veut que l'administrateur ait réellement
 * recopié la phrase, pas cliqué distraitement.
 */
export function phraseConfirmationValide(saisie: string, attendue: string): boolean {
  return saisie.trim().replace(/\s+/g, " ").toUpperCase() === attendue;
}
