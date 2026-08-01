import { prisma } from "@/lib/db";
import { envoyerPushAUtilisateurs } from "@/modules/push/push";
import { chargeRappelConfirmation } from "@/modules/push/push-core";
import { seuilRappelConfirmation } from "@/modules/livraison/livraison-core";

/**
 * Rappel « avez-vous bien reçu votre commande ? ».
 *
 * Déclenché périodiquement depuis l'extérieur (voir la route
 * /api/cron/rappels-livraison) : Vercel Hobby ne permet qu'une exécution
 * planifiée par jour, la cadence vient donc d'un workflow GitHub Actions.
 *
 * UN SEUL rappel par commande : le drapeau `rappelConfirmationEnvoye` est
 * posé AVANT l'envoi et filtré sur sa valeur `false`, de sorte que deux
 * passages concurrents ne peuvent pas notifier deux fois le même acheteur.
 */
export async function envoyerRappelsConfirmation(
  maintenant: Date = new Date(),
): Promise<{ rappels: number }> {
  const seuil = seuilRappelConfirmation(maintenant);

  const candidates = await prisma.livraison.findMany({
    where: {
      statut: "LIVREE",
      // Depuis la remise par code, une livraison normale porte déjà
      // l'attestation de l'acheteur : il ne reste à relancer que les
      // livraisons forcées par un administrateur, sans preuve de sa part.
      confirmationAcheteur: null,
      rappelConfirmationEnvoye: false,
      dateLivraison: { lte: seuil },
    },
    select: {
      id: true,
      commande: {
        select: { id: true, numero: true, acheteurId: true, statutCommande: true },
      },
    },
    take: 100,
  });

  let rappels = 0;
  for (const livraison of candidates) {
    // La commande a pu changer d'état entre la requête et maintenant.
    if (livraison.commande.statutCommande !== "LIVREE") continue;

    // Réserve le rappel AVANT de l'envoyer : si l'envoi échoue, on préfère
    // ne pas rappeler du tout plutôt que risquer d'inonder l'acheteur au
    // passage suivant.
    const { count } = await prisma.livraison.updateMany({
      where: { id: livraison.id, rappelConfirmationEnvoye: false },
      data: { rappelConfirmationEnvoye: true },
    });
    if (count === 0) continue; // un autre passage l'a pris en charge

    await envoyerPushAUtilisateurs(
      [livraison.commande.acheteurId],
      chargeRappelConfirmation({
        numero: livraison.commande.numero,
        commandeId: livraison.commande.id,
      }),
    );
    rappels += 1;
  }

  return { rappels };
}
