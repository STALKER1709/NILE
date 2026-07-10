import type { EmailProvider, MessageEmail } from "@/modules/email/EmailProvider";

/**
 * Fournisseur d'email MOCK — développement/tests uniquement.
 * N'envoie rien : journalise le message pour vérification locale.
 */
export class MockEmailProvider implements EmailProvider {
  async envoyer(message: MessageEmail): Promise<void> {
    console.log(
      `[email-mock] à=${message.a} sujet="${message.sujet}"\n${message.texte}`,
    );
  }
}
