import { env } from "@/lib/env";
import type { WhatsAppProvider } from "@/modules/whatsapp/WhatsAppProvider";
import { MockWhatsAppProvider } from "@/modules/whatsapp/mock/MockWhatsAppProvider";
import { MetaWhatsAppProvider } from "@/modules/whatsapp/meta/MetaWhatsAppProvider";

let instance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (instance) return instance;
  instance =
    env.WHATSAPP_PROVIDER === "meta" ? new MetaWhatsAppProvider() : new MockWhatsAppProvider();
  return instance;
}
