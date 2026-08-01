import { env } from "@/lib/env";
import type { WhatsAppProvider } from "@/modules/whatsapp/WhatsAppProvider";

/**
 * Fournisseur WhatsApp Cloud API (Meta, production).
 *
 * Endpoint et format de requête vérifiés sur la documentation officielle
 * Meta for Developers (developers.facebook.com/docs/whatsapp/cloud-api) au
 * moment de l'écriture :
 *   POST https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages
 *   Authorization: Bearer {token permanent}
 *   Content-Type: application/json
 *
 * ⚠️ Jamais exécuté ici contre un vrai compte Meta (pas d'accès réseau à
 * graph.facebook.com depuis cet environnement). À vérifier avec un premier
 * envoi réel via le numéro de test Meta avant de basculer en production.
 */
export class MetaWhatsAppProvider implements WhatsAppProvider {
  private phoneNumberId(): string {
    if (!env.WHATSAPP_PHONE_NUMBER_ID) throw new Error("WHATSAPP_PHONE_NUMBER_ID manquant.");
    return env.WHATSAPP_PHONE_NUMBER_ID;
  }
  private token(): string {
    if (!env.WHATSAPP_TOKEN) throw new Error("WHATSAPP_TOKEN manquant.");
    return env.WHATSAPP_TOKEN;
  }

  async envoyerTexte(telephone: string, texte: string): Promise<void> {
    await this.appel({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telephone,
      type: "text",
      text: { preview_url: false, body: texte },
    });
  }

  async envoyerTemplate(
    telephone: string,
    nomTemplate: string,
    parametresCorps: string[],
  ): Promise<void> {
    await this.appel({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telephone,
      type: "template",
      template: {
        name: nomTemplate,
        language: { code: "fr" },
        ...(parametresCorps.length > 0
          ? {
              components: [
                {
                  type: "body",
                  parameters: parametresCorps.map((texte) => ({ type: "text", text: texte })),
                },
              ],
            }
          : {}),
      },
    });
  }

  private async appel(corps: Record<string, unknown>): Promise<void> {
    const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${this.phoneNumberId()}/messages`;
    const reponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corps),
    });
    if (!reponse.ok) {
      const texte = await reponse.text();
      throw new Error(`WhatsApp Cloud API: HTTP ${reponse.status} · ${texte.slice(0, 300)}`);
    }
  }
}
