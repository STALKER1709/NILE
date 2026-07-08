import { env } from "@/lib/env";
import type { PaymentProvider } from "@/modules/paiement/PaymentProvider";
import { MockPaymentProvider } from "@/modules/paiement/mock/MockPaymentProvider";
import { MonetbilProvider } from "@/modules/paiement/monetbil/MonetbilProvider";

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  instance =
    env.PAYMENT_PROVIDER === "monetbil"
      ? new MonetbilProvider()
      : new MockPaymentProvider();
  return instance;
}
