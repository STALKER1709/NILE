import { env } from "@/lib/env";
import type {
  PaymentProvider,
  ContexteInitiation,
  DemarragePaiement,
  VerificationNotification,
} from "@/modules/paiement/PaymentProvider";
import {
  verifierSign,
  mapperStatutMonetbil,
} from "@/modules/paiement/notification-core";

/**
 * Fournisseur Monetbil (production — MTN MoMo + Orange Money).
 *
 * Implémenté d'après le code source officiel `Monetbil/monetbil-php` :
 *  - Démarrage : POST https://www.monetbil.com/widget/v2.1/{service_key}
 *                réponse JSON { payment_url } vers laquelle rediriger l'acheteur.
 *  - Vérification : POST https://api.monetbil.com/payment/v1/checkPayment
 *                   avec { paymentId } -> { transaction: { status, testmode } }
 *                   (status 1 = succès, 0 = échec, -1 = annulé).
 *  - Signature callback : md5(service_secret + concat(valeurs triées par clé)).
 *
 * ⚠️ NON exécuté ici contre le vrai service (pas d'accès réseau/compte). Les
 * noms de champs du callback (paymentId, payment_ref) sont à confirmer avec une
 * notification réelle du tableau de bord Monetbil (voir README, section Monetbil).
 */
const WIDGET_URL = "https://www.monetbil.com/widget/v2.1";
const CHECK_PAYMENT_URL = "https://api.monetbil.com/payment/v1/checkPayment";

export class MonetbilProvider implements PaymentProvider {
  private cle(): string {
    if (!env.MONETBIL_SERVICE_KEY) throw new Error("MONETBIL_SERVICE_KEY manquant.");
    return env.MONETBIL_SERVICE_KEY;
  }
  private secret(): string {
    if (!env.MONETBIL_SERVICE_SECRET)
      throw new Error("MONETBIL_SERVICE_SECRET manquant.");
    return env.MONETBIL_SERVICE_SECRET;
  }

  async initier(ctx: ContexteInitiation): Promise<DemarragePaiement> {
    const morceaux = ctx.nomComplet.trim().split(/\s+/);
    const first_name = morceaux[0] || ctx.nomComplet;
    const last_name = morceaux.slice(1).join(" ") || first_name;

    const corps = new URLSearchParams({
      amount: String(ctx.montant),
      currency: "XAF",
      locale: "fr",
      country: "CM",
      item_ref: ctx.numeroCommande,
      payment_ref: ctx.reference,
      user: ctx.reference,
      first_name,
      last_name,
      email: ctx.email,
      phone: ctx.telephone,
      return_url: ctx.urlRetour,
      notify_url: ctx.urlNotification,
    });

    const reponse = await fetch(`${WIDGET_URL}/${this.cle()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corps.toString(),
    });
    const texte = await reponse.text();
    if (!reponse.ok) {
      throw new Error(`Monetbil widget: HTTP ${reponse.status} · ${texte.slice(0, 200)}`);
    }
    let data: { payment_url?: string };
    try {
      data = JSON.parse(texte) as { payment_url?: string };
    } catch {
      throw new Error(`Monetbil widget: réponse non-JSON · ${texte.slice(0, 200)}`);
    }
    if (!data.payment_url) {
      throw new Error(`Monetbil widget: payment_url absent · ${texte.slice(0, 200)}`);
    }
    return { reference: ctx.reference, urlPaiement: data.payment_url };
  }

  async verifierNotification(
    corps: Record<string, string>,
  ): Promise<VerificationNotification> {
    // 1) Vérifier la signature de la notification.
    if (!verifierSign(this.secret(), corps)) {
      return { ok: false, raison: "SIGNATURE_INVALIDE" };
    }
    const reference = corps["payment_ref"];
    const paymentId = corps["paymentId"] ?? corps["transaction_id"];
    if (!reference || !paymentId) {
      return { ok: false, raison: "DONNEES_MANQUANTES" };
    }

    // 2) Confirmer le statut auprès de Monetbil (source de vérité serveur).
    try {
      const reponse = await fetch(CHECK_PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ paymentId }).toString(),
      });
      const texte = await reponse.text();
      if (!reponse.ok) {
        console.error("[monetbil] checkPayment HTTP", reponse.status);
        return { ok: false, raison: "ERREUR" };
      }
      const data = JSON.parse(texte) as {
        transaction?: { status?: number | string };
      };
      const status = data.transaction?.status;
      if (status === undefined || status === null) {
        return { ok: false, raison: "ERREUR" };
      }
      return {
        ok: true,
        data: { reference, statut: mapperStatutMonetbil(status) },
      };
    } catch (erreur) {
      console.error("Monetbil checkPayment échec:", erreur);
      return { ok: false, raison: "ERREUR" };
    }
  }
}
