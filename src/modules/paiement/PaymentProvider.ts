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
}

export interface DemarragePaiement {
  reference: string;
  urlPaiement: string; // URL vers laquelle rediriger l'acheteur
}

export interface ResultatVerification {
  reference: string; // payment_ref -> permet de retrouver le Paiement
  statut: StatutPaiementNotifie;
}

export type VerificationNotification =
  | { ok: true; data: ResultatVerification }
  | { ok: false; raison: "SIGNATURE_INVALIDE" | "DONNEES_MANQUANTES" | "ERREUR" };

export interface PaymentProvider {
  /** Démarre un paiement et renvoie l'URL vers laquelle rediriger l'acheteur. */
  initier(ctx: ContexteInitiation): Promise<DemarragePaiement>;

  /**
   * Vérifie une notification serveur entrante (callback) et renvoie le statut
   * FIABLE. C'est la seule source de vérité pour marquer une commande payée.
   */
  verifierNotification(
    corps: Record<string, string>,
  ): Promise<VerificationNotification>;
}
