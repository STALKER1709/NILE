import { env } from "@/lib/env";
import type { EmailProvider, MessageEmail } from "@/modules/email/EmailProvider";

/**
 * Fournisseur d'email réel : Brevo (ex-Sendinblue), API transactionnelle v3.
 * Choisi car il permet d'envoyer depuis une simple adresse expéditrice
 * validée (pas besoin de posséder un domaine), avec un palier gratuit.
 *
 * Implémenté d'après la documentation publique de l'API
 * (POST https://api.brevo.com/v3/smtp/email, en-tête `api-key`).
 * ⚠️ Non exécuté contre le vrai service depuis cet environnement (pas d'accès
 * réseau) : à valider lors du premier envoi réel (voir .env.example).
 */
const URL_ENVOI = "https://api.brevo.com/v3/smtp/email";

export class BrevoEmailProvider implements EmailProvider {
  private cle(): string {
    if (!env.BREVO_API_KEY) throw new Error("BREVO_API_KEY manquant.");
    return env.BREVO_API_KEY;
  }
  private expediteur(): { name: string; email: string } {
    if (!env.EMAIL_EXPEDITEUR) throw new Error("EMAIL_EXPEDITEUR manquant.");
    return { name: env.EMAIL_EXPEDITEUR_NOM, email: env.EMAIL_EXPEDITEUR };
  }

  async envoyer(message: MessageEmail): Promise<void> {
    const reponse = await fetch(URL_ENVOI, {
      method: "POST",
      headers: {
        "api-key": this.cle(),
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: this.expediteur(),
        to: [
          {
            email: message.a,
            ...(message.nomDestinataire ? { name: message.nomDestinataire } : {}),
          },
        ],
        subject: message.sujet,
        textContent: message.texte,
        ...(message.html ? { htmlContent: message.html } : {}),
      }),
    });
    if (!reponse.ok) {
      const corps = await reponse.text().catch(() => "");
      throw new Error(
        `Brevo: HTTP ${reponse.status} — ${corps.slice(0, 200)}`,
      );
    }
  }
}
