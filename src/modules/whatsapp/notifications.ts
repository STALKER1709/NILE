import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getWhatsAppProvider } from "@/modules/whatsapp";
import {
  normaliserTelephoneCM,
  fenetreServiceOuverte,
  construireTexteStatut,
  type StatutNotifiableWhatsApp,
} from "@/modules/whatsapp/whatsapp-core";

/**
 * Prévient l'acheteur d'un changement de statut de commande par WhatsApp.
 * Gratuit si la fenêtre de service (24h après son dernier message entrant)
 * est ouverte ; sinon envoie le template approuvé s'il est configuré, ou
 * journalise et n'envoie rien (jamais d'erreur qui remonte à l'appelant).
 */
export async function notifierCommandeWhatsApp(
  commandeId: string,
  statut: StatutNotifiableWhatsApp,
): Promise<void> {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      select: {
        numero: true,
        destTelephone: true,
        acheteur: { select: { whatsappFenetreOuverteJusqua: true } },
      },
    });
    if (!commande) return;

    const telephone = normaliserTelephoneCM(commande.destTelephone);
    if (!telephone) return;

    const maintenant = new Date();
    const provider = getWhatsAppProvider();

    if (fenetreServiceOuverte(commande.acheteur.whatsappFenetreOuverteJusqua, maintenant)) {
      const texte = construireTexteStatut(commande.numero, statut, env.NEXT_PUBLIC_SITE_URL);
      await provider.envoyerTexte(telephone, texte);
      return;
    }

    if (env.WHATSAPP_TEMPLATE_STATUT) {
      await provider.envoyerTemplate(telephone, env.WHATSAPP_TEMPLATE_STATUT, [
        commande.numero,
        statut,
      ]);
      return;
    }

    console.log(
      `[whatsapp] fenêtre fermée et aucun template configuré : notification ignorée pour ${commande.numero}.`,
    );
  } catch (erreur) {
    console.error("[whatsapp] notification de commande échouée:", erreur);
  }
}
