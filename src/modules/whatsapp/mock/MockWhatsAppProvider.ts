import type { WhatsAppProvider } from "@/modules/whatsapp/WhatsAppProvider";

/**
 * Fournisseur WhatsApp MOCK — développement/tests uniquement.
 * N'envoie rien : journalise le message pour vérification locale.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  async envoyerTexte(telephone: string, texte: string): Promise<void> {
    console.log(`[whatsapp-mock] texte à=${telephone}\n${texte}`);
  }

  async envoyerTemplate(
    telephone: string,
    nomTemplate: string,
    parametresCorps: string[],
  ): Promise<void> {
    console.log(
      `[whatsapp-mock] template="${nomTemplate}" à=${telephone} params=${JSON.stringify(parametresCorps)}`,
    );
  }
}
