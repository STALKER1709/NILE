import { env } from "@/lib/env";
import type { PaymentProvider } from "@/modules/paiement/PaymentProvider";
import { MockPaymentProvider } from "@/modules/paiement/mock/MockPaymentProvider";
import { MonetbilProvider } from "@/modules/paiement/monetbil/MonetbilProvider";
import { HrSkillsPayProvider } from "@/modules/paiement/hrskills/HrSkillsPayProvider";

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  switch (env.PAYMENT_PROVIDER) {
    case "monetbil":
      instance = new MonetbilProvider();
      break;
    case "hrskills":
      instance = new HrSkillsPayProvider();
      break;
    default:
      instance = new MockPaymentProvider();
  }
  return instance;
}

/**
 * Le fournisseur actif débite-t-il directement le téléphone du client ?
 * Dans ce cas le parcours de commande doit demander l'opérateur et afficher
 * un écran d'attente, au lieu de rediriger vers une page de paiement.
 */
export function paiementSansRedirection(): boolean {
  return env.PAYMENT_PROVIDER === "hrskills";
}
