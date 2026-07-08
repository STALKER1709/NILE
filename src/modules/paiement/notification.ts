import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/modules/paiement";

export type ResultatTraitement =
  | { ok: true; statut: "PAYE" | "ECHOUE" | "DEJA_TRAITE" }
  | { ok: false; raison: string };

/**
 * Traite une notification de paiement (callback serveur vérifié).
 * SEUL point qui marque une commande « payée ». Idempotent : une notification
 * reçue plusieurs fois ne produit qu'un seul effet.
 *
 * Succès -> commande CONFIRMEE + paiement PAYE.
 * Échec  -> paiement ECHOUE + commande libérée (ANNULEE) et stock restitué.
 */
export async function traiterNotificationPaiement(
  corps: Record<string, string>,
): Promise<ResultatTraitement> {
  const verif = await getPaymentProvider().verifierNotification(corps);
  if (!verif.ok) return { ok: false, raison: verif.raison };

  const { reference, statut } = verif.data;

  const paiement = await prisma.paiement.findUnique({
    where: { id: reference },
    include: { commande: { include: { lignes: true } } },
  });
  if (!paiement) return { ok: false, raison: "PAIEMENT_INTROUVABLE" };

  // Idempotence : un paiement déjà finalisé n'est pas retraité.
  if (paiement.statut === "PAYE") return { ok: true, statut: "DEJA_TRAITE" };
  if (paiement.statut === "ECHOUE" && statut === "ECHOUE") {
    return { ok: true, statut: "DEJA_TRAITE" };
  }

  if (statut === "PAYE") {
    await prisma.$transaction(async (tx) => {
      await tx.paiement.updateMany({
        where: { id: reference, statut: { not: "PAYE" } },
        data: { statut: "PAYE", payload: corps },
      });
      // Ne confirme la commande que si elle attendait encore le paiement.
      await tx.commande.updateMany({
        where: { id: paiement.commandeId, statutCommande: "EN_ATTENTE" },
        data: { statutPaiement: "PAYE", statutCommande: "CONFIRMEE" },
      });
    });
    return { ok: true, statut: "PAYE" };
  }

  // Échec : libère la commande (si encore en attente) et restitue le stock.
  await prisma.$transaction(async (tx) => {
    await tx.paiement.updateMany({
      where: { id: reference, statut: { not: "PAYE" } },
      data: { statut: "ECHOUE", payload: corps },
    });
    const maj = await tx.commande.updateMany({
      where: { id: paiement.commandeId, statutCommande: "EN_ATTENTE" },
      data: { statutCommande: "ANNULEE", statutPaiement: "ECHOUE" },
    });
    if (maj.count === 1) {
      for (const ligne of paiement.commande.lignes) {
        await tx.produit.update({
          where: { id: ligne.produitId },
          data: { stock: { increment: ligne.quantite } },
        });
      }
    }
  });
  return { ok: true, statut: "ECHOUE" };
}
