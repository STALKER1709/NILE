import { prisma } from "@/lib/db";

/**
 * Signature des commandes visibles par quelqu'un : une empreinte courte qui
 * change dès qu'un statut bouge.
 *
 * Sert au rafraîchissement automatique des écrans de suivi. L'idée est
 * d'éviter le réflexe coûteux — recharger la page à intervalle fixe. Toutes
 * les pages étant en `force-dynamic`, un rechargement est un rendu serveur
 * complet accompagné de ses requêtes : le faire toutes les minutes, pour
 * chaque utilisateur connecté, coûterait de la data mobile à des acheteurs
 * qui la paient cher, et des invocations à la plateforme.
 *
 * Une signature, elle, tient en quelques octets et se calcule avec une seule
 * agrégation. Le client ne recharge que lorsqu'elle a changé.
 *
 * `dateMaj` est mise à jour par Prisma (`@updatedAt`) à chaque écriture sur la
 * commande — changement de statut compris. Le compte capte les créations, que
 * le maximum des dates seul manquerait si une commande était supprimée en même
 * temps qu'une autre était créée.
 */
function empreinte(nb: number, derniere: Date | null): string {
  return `${nb}:${derniere ? derniere.getTime() : 0}`;
}

/** Commandes d'un acheteur. */
export async function signatureCommandesAcheteur(
  utilisateurId: string,
): Promise<string> {
  const agg = await prisma.commande.aggregate({
    where: { acheteurId: utilisateurId },
    _count: true,
    _max: { dateMaj: true },
  });
  return empreinte(agg._count, agg._max.dateMaj);
}

/** Une commande précise, vue par son acheteur. */
export async function signatureCommandeAcheteur(
  utilisateurId: string,
  commandeId: string,
): Promise<string> {
  const commande = await prisma.commande.findFirst({
    // L'appartenance est vérifiée ici : une signature qui changerait pour une
    // commande étrangère renseignerait sur l'activité d'autrui.
    where: { id: commandeId, acheteurId: utilisateurId },
    select: { dateMaj: true },
  });
  return empreinte(commande ? 1 : 0, commande?.dateMaj ?? null);
}

/** Commandes contenant au moins un article de ce vendeur. */
export async function signatureCommandesVendeur(
  vendeurId: string,
): Promise<string> {
  const agg = await prisma.commande.aggregate({
    where: { lignes: { some: { vendeurId } } },
    _count: true,
    _max: { dateMaj: true },
  });
  return empreinte(agg._count, agg._max.dateMaj);
}

/** Toutes les commandes (back-office). */
export async function signatureCommandesAdmin(): Promise<string> {
  const agg = await prisma.commande.aggregate({
    _count: true,
    _max: { dateMaj: true },
  });
  return empreinte(agg._count, agg._max.dateMaj);
}
