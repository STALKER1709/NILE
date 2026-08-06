/**
 * Logique PURE du parrainage (testable sans base ni réseau).
 *
 * Principe : un filleul saisit le code d'un parrain à l'inscription. Une part
 * du panier de sa PREMIÈRE commande est partagée entre les deux — remise
 * immédiate pour le filleul, récompense différée pour le parrain.
 *
 * Économie du mécanisme, pour que personne n'ait à la redécouvrir plus tard :
 * la marge de NILE sur une commande Mobile Money est d'environ 10 % du panier
 * (12 % de commission moins 2 % prélevés par l'agrégateur). Un partage à 5 %
 * consomme donc LA MOITIÉ de cette marge. C'est un coût d'acquisition
 * assumé — et c'est précisément pourquoi il n'est versé qu'UNE FOIS : appliqué
 * à chaque commande, il ferait de NILE une place de marché à 5 % de marge à
 * vie, sur la totalité de ses clients parrainés.
 */

/** Part du panier partagée entre le filleul et le parrain, en pourcentage. */
export const PARRAINAGE_POURCENT_DEFAUT = 5;

/**
 * Plafond de CHAQUE part, en FCFA.
 *
 * Sans lui, un panier de 200 000 coûterait 10 000 de parrainage. Le plafond
 * borne le coût d'acquisition indépendamment de la taille du panier.
 */
export const PARRAINAGE_PLAFOND_PART_DEFAUT = 1000;

export interface PartsParrainage {
  /** Remise immédiate sur la commande du filleul, en FCFA. */
  filleul: number;
  /** Récompense du parrain, en FCFA, versée à la livraison. */
  parrain: number;
}

/**
 * Répartit la part de parrainage entre les deux bénéficiaires.
 *
 * L'éventuel FCFA impair va au filleul : sa part est une remise visible à
 * l'écran, au centime près, alors que celle du parrain est différée. Mieux vaut
 * que l'arrondi tombe du côté où il se vérifie.
 *
 * Le plafond s'applique à CHAQUE part et non au total : c'est ce qui garantit
 * qu'un gros panier ne fait pas exploser le coût d'un seul côté.
 */
export function calculerPartsParrainage(params: {
  totalPanier: number;
  /** Pourcentage total partagé. Défaut : PARRAINAGE_POURCENT_DEFAUT. */
  tauxPourcent?: number;
  /** Plafond par part. 0 = sans plafond. */
  plafondParPart?: number;
}): PartsParrainage {
  const total = Math.max(0, params.totalPanier);
  const taux = params.tauxPourcent ?? PARRAINAGE_POURCENT_DEFAUT;
  const plafond = params.plafondParPart ?? PARRAINAGE_PLAFOND_PART_DEFAUT;

  if (total === 0 || taux <= 0) return { filleul: 0, parrain: 0 };

  const enveloppe = Math.round((total * taux) / 100);
  let parrain = Math.floor(enveloppe / 2);
  let filleul = enveloppe - parrain; // reçoit l'impair

  if (plafond > 0) {
    filleul = Math.min(filleul, plafond);
    parrain = Math.min(parrain, plafond);
  }
  // La remise ne peut pas dépasser le panier : un total négatif se propagerait
  // jusqu'au montant envoyé à l'agrégateur de paiement.
  filleul = Math.min(filleul, total);

  return { filleul, parrain };
}

export type DecisionParrainage =
  | "OK"
  /** Code inconnu. */
  | "INTROUVABLE"
  /** On ne se parraine pas soi-même. */
  | "AUTO_PARRAINAGE"
  /**
   * Même numéro de téléphone que le parrain : second compte de la même
   * personne. Sans ce contrôle, il suffit de se réinscrire pour obtenir les
   * deux parts sur ses propres achats.
   */
  | "MEME_TELEPHONE"
  /** Ce filleul a déjà un parrain : le lien ne se change pas. */
  | "DEJA_PARRAINE";

/**
 * Ce filleul peut-il être rattaché à ce parrain ?
 *
 * Les numéros sont comparés déjà normalisés par l'appelant — la comparaison
 * porte sur la forme, pas sur la saisie.
 */
export function evaluerParrainage(params: {
  parrainId: string | null;
  filleulId: string;
  telephoneParrain: string | null;
  telephoneFilleul: string;
  filleulDejaParraine: boolean;
}): DecisionParrainage {
  if (!params.parrainId) return "INTROUVABLE";
  if (params.parrainId === params.filleulId) return "AUTO_PARRAINAGE";
  if (params.filleulDejaParraine) return "DEJA_PARRAINE";
  if (
    params.telephoneParrain &&
    params.telephoneParrain === params.telephoneFilleul
  ) {
    return "MEME_TELEPHONE";
  }
  return "OK";
}

/**
 * La récompense du parrain est-elle due ?
 *
 * Trois conditions, et aucune n'est décorative :
 *  - la commande est LIVRÉE et PAYÉE — pas seulement passée. Sinon il suffit
 *    de commander, toucher la récompense, puis annuler ;
 *  - elle est réglée en Mobile Money — le paiement à la livraison ne transite
 *    pas par NILE, il n'y a donc aucune marge d'où tirer la récompense ;
 *  - elle n'a pas déjà été récompensée : le parrainage se paie UNE fois.
 */
export function recompenseDue(params: {
  statutCommande: string;
  statutPaiement: string;
  modePaiement: string;
  dejaRecompense: boolean;
}): boolean {
  if (params.dejaRecompense) return false;
  if (params.modePaiement !== "MONETBIL") return false;
  return params.statutCommande === "LIVREE" && params.statutPaiement === "PAYE";
}
