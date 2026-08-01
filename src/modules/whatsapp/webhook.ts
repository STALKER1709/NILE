import { prisma } from "@/lib/db";
import { calculerFinFenetreService, normaliserTelephoneCM } from "@/modules/whatsapp/whatsapp-core";

/**
 * Un message entrant vient d'être reçu du numéro `telephoneExpediteur` :
 * ouvre (ou prolonge) sa fenêtre de service de 24h. Recherche large sur les
 * 9 derniers chiffres : le format stocké dans `Utilisateur.telephone` varie
 * (avec ou sans 237/+), la volumétrie reste faible (marché solo dev).
 */
export async function ouvrirFenetreServicePourExpediteur(
  telephoneExpediteur: string,
): Promise<void> {
  const normalise = normaliserTelephoneCM(telephoneExpediteur);
  if (!normalise) return;
  const local = normalise.slice(3);
  await prisma.utilisateur.updateMany({
    where: { telephone: { contains: local } },
    data: { whatsappFenetreOuverteJusqua: calculerFinFenetreService(new Date()) },
  });
}
