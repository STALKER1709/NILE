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
 * Fournisseur de paiement MOCK — développement / tests.
 * Reproduit fidèlement le flux réel : redirection vers une page de paiement,
 * puis notification serveur SIGNÉE traitée par le même callback qu'en production.
 * Aucune transaction réelle.
 */
export class MockPaymentProvider implements PaymentProvider {
  async initier(ctx: ContexteInitiation): Promise<DemarragePaiement> {
    // Redirige vers notre page de simulation (équivalent du widget Monetbil).
    const url = `/paiement/simulation?ref=${encodeURIComponent(ctx.reference)}&montant=${ctx.montant}`;
    return { reference: ctx.reference, urlPaiement: url };
  }

  async verifierNotification(
    corps: Record<string, string>,
  ): Promise<VerificationNotification> {
    if (!verifierSign(env.MOCK_PAYMENT_SECRET, corps)) {
      return { ok: false, raison: "SIGNATURE_INVALIDE" };
    }
    const reference = corps["payment_ref"];
    const statutBrut = corps["status"];
    if (!reference || statutBrut === undefined) {
      return { ok: false, raison: "DONNEES_MANQUANTES" };
    }
    return {
      ok: true,
      data: {
        reference,
        statut: mapperStatutMonetbil(Number(statutBrut)),
      },
    };
  }
}
