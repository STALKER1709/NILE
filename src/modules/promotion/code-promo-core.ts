/**
 * Logique PURE des codes promotionnels (testable sans base ni réseau).
 *
 * Toutes les règles d'acceptation d'un code vivent ici, et nulle part ailleurs :
 * c'est de l'argent qu'on retire du total payé, la décision ne doit pas être
 * dispersée entre un écran et une action serveur qui pourraient diverger.
 */

export type TypeRemise = "POURCENTAGE" | "MONTANT";

/**
 * Forme comparable d'un code : majuscules, sans espaces ni caractères de
 * séparation. L'acheteur tape « bienvenue 10 » ou « Bienvenue-10 », on cherche
 * « BIENVENUE10 ». Les codes sont stockés sous cette même forme, sans quoi
 * l'unicité en base ne voudrait rien dire.
 */
export function normaliserCode(saisie: string): string {
  return saisie.toUpperCase().replace(/[\s-_.]/g, "");
}

/**
 * Remise en FCFA, bornée de deux façons.
 *
 * Le plafond protège la marge : sans lui, « -20 % » sur un panier de 500 000
 * coûterait 100 000 à la plateforme. Et la remise ne dépasse jamais le panier
 * lui-même — un total négatif se propagerait jusqu'au montant envoyé à
 * l'agrégateur.
 */
export function calculerRemise(params: {
  type: TypeRemise;
  valeur: number;
  /** Plafond FCFA d'une remise en pourcentage. 0 ou absent = sans plafond. */
  plafondRemise?: number | null;
  totalPanier: number;
}): number {
  const total = Math.max(0, params.totalPanier);
  if (params.valeur <= 0 || total === 0) return 0;

  let remise =
    params.type === "POURCENTAGE"
      ? Math.round((total * params.valeur) / 100)
      : params.valeur;

  const plafond = params.plafondRemise ?? 0;
  if (params.type === "POURCENTAGE" && plafond > 0) {
    remise = Math.min(remise, plafond);
  }
  return Math.min(remise, total);
}

export type DecisionCodePromo =
  | "OK"
  /** Aucun code de ce nom. Même réponse qu'un code désactivé — voir plus bas. */
  | "INTROUVABLE"
  | "EXPIRE"
  | "PAS_ENCORE_ACTIF"
  /** Quota global épuisé : la campagne a consommé son budget. */
  | "QUOTA_ATTEINT"
  | "DEJA_UTILISE"
  | "PANIER_INSUFFISANT"
  /** Code réservé au Mobile Money, commande passée en paiement à la livraison. */
  | "MODE_PAIEMENT";

export interface EtatCodePromo {
  actif: boolean;
  dateDebut: Date;
  dateFin: Date;
  /** Nul = illimité. */
  quotaTotal: number | null;
  nbUtilisations: number;
  minPanier: number;
  /** Cet acheteur a-t-il déjà consommé ce code ? */
  dejaUtiliseParAcheteur: boolean;
}

/**
 * Un code est-il utilisable, ici et maintenant, par cet acheteur ?
 *
 * Un code désactivé renvoie `INTROUVABLE` et non un motif propre : distinguer
 * les deux permettrait de deviner quels codes existent en les essayant au
 * hasard. Les autres motifs, eux, sont explicites — l'acheteur doit pouvoir
 * comprendre et corriger (compléter son panier, changer de mode de paiement).
 *
 * L'ordre des vérifications suit ce que l'acheteur peut y faire : d'abord ce
 * qui est définitif (le code n'existe pas, il est expiré, épuisé, déjà
 * utilisé), ensuite ce qu'il peut corriger sans quitter la page.
 */
export function evaluerCodePromo(params: {
  etat: EtatCodePromo;
  totalPanier: number;
  modePaiement: string;
  maintenant?: Date;
}): DecisionCodePromo {
  const { etat } = params;
  const maintenant = params.maintenant ?? new Date();

  if (!etat.actif) return "INTROUVABLE";
  if (maintenant < etat.dateDebut) return "PAS_ENCORE_ACTIF";
  if (maintenant > etat.dateFin) return "EXPIRE";
  if (etat.quotaTotal !== null && etat.nbUtilisations >= etat.quotaTotal) {
    return "QUOTA_ATTEINT";
  }
  if (etat.dejaUtiliseParAcheteur) return "DEJA_UTILISE";

  // Réservé au Mobile Money : c'est le seul mode où l'argent transite par
  // NILE, donc le seul où elle a quelque chose à remiser. En paiement à la
  // livraison, l'acheteur règle le livreur de la boutique en espèces.
  if (params.modePaiement !== "MONETBIL") return "MODE_PAIEMENT";

  if (params.totalPanier < etat.minPanier) return "PANIER_INSUFFISANT";

  return "OK";
}
