import type { StatutPaiementNotifie } from "@/modules/paiement/notification-core";

/**
 * Interface abstraite de paiement. Le reste de l'application ne connaît que
 * cette interface. Implémentations : MockPaymentProvider (simulation) et
 * MonetbilProvider (production, MTN MoMo + Orange Money).
 *
 * Principe non négociable : une commande n'est « payée » QUE sur notification
 * serveur vérifiée (verifierNotification), jamais sur le retour navigateur.
 */

export interface ContexteInitiation {
  reference: string; // notre référence (= id du Paiement), renvoyée dans le callback
  montant: number; // FCFA entier
  telephone: string;
  email: string;
  nomComplet: string;
  numeroCommande: string; // item_ref lisible
  urlRetour: string; // return_url : où renvoyer le navigateur (NON fiable)
  urlNotification: string; // notify_url : callback serveur (la vérité)
  /**
   * Opérateur Mobile Money choisi par l'acheteur (« mtn », « orange »).
   * Requis par les fournisseurs qui débitent directement le portefeuille du
   * client ; ignoré par ceux dont le widget pose la question eux-mêmes.
   */
  operateur?: string;
}

export interface DemarragePaiement {
  reference: string;
  /**
   * URL vers laquelle rediriger l'acheteur, ou `null` quand le fournisseur
   * sollicite directement le téléphone du client (prompt USSD ou push). Dans
   * ce cas l'acheteur reste sur NILE et suit l'avancement sur place.
   */
  urlPaiement: string | null;
  /** Référence chez le fournisseur, à conserver pour le suivi et les webhooks. */
  referenceFournisseur?: string;
}

export interface ResultatVerification {
  reference: string; // payment_ref -> permet de retrouver le Paiement
  statut: StatutPaiementNotifie;
}

export type VerificationNotification =
  | { ok: true; data: ResultatVerification }
  | {
      ok: false;
      raison:
        | "SIGNATURE_INVALIDE"
        | "DONNEES_MANQUANTES"
        | "ERREUR"
        /** Notification reçue et authentique, mais statut non définitif. */
        | "NON_DEFINITIF";
    };

/** Ce qui accompagne une notification, au-delà du corps décodé. */
export interface ContexteNotification {
  /** Corps exact reçu, avant tout décodage : base des signatures HMAC. */
  brut: string;
  entetes: Headers;
}

export interface PaymentProvider {
  /** Démarre un paiement et renvoie l'URL vers laquelle rediriger l'acheteur. */
  initier(ctx: ContexteInitiation): Promise<DemarragePaiement>;

  /**
   * Vérifie une notification serveur entrante (callback) et renvoie le statut
   * FIABLE. C'est la seule source de vérité pour marquer une commande payée.
   *
   * `contexte` porte ce qui ne survit pas au décodage du corps : le corps
   * BRUT (indispensable aux signatures HMAC, qui portent sur les octets reçus
   * et non sur l'objet reconstruit) et les en-têtes de la requête.
   */
  verifierNotification(
    corps: Record<string, string>,
    contexte?: ContexteNotification,
  ): Promise<VerificationNotification>;

  /**
   * Relit le statut d'un paiement DIRECTEMENT chez le fournisseur, à notre
   * initiative.
   *
   * Le webhook est la voie rapide, pas une garantie : il peut ne jamais partir
   * (certains bacs à sable n'en émettent aucun), se perdre, ou arriver quand
   * notre serveur est indisponible. Sans relecture, la commande correspondante
   * reste « en attente » pour toujours — l'acheteur a payé et ne voit rien.
   *
   * Renvoie `null` quand le statut n'est pas définitif (en cours, en revue) ou
   * qu'il n'a pas pu être lu : dans les deux cas il n'y a rien à écrire, et
   * surtout rien à conclure.
   *
   * Optionnel : un fournisseur qui n'expose pas de lecture de statut ne
   * l'implémente pas, et le suivi se contente alors du webhook.
   */
  consulterStatut?(
    referenceFournisseur: string,
  ): Promise<StatutPaiementNotifie | null>;
}
