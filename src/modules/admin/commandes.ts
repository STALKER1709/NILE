import { prisma } from "@/lib/db";

/** Toutes les commandes (supervision admin). */
export async function listerToutesCommandes() {
  return prisma.commande.findMany({
    orderBy: { dateCreation: "desc" },
    take: 200,
    include: {
      acheteur: { select: { nom: true } },
      livraison: { select: { statut: true } },
      _count: { select: { lignes: true } },
    },
  });
}

export async function getCommandeAdmin(commandeId: string) {
  return prisma.commande.findUnique({
    where: { id: commandeId },
    include: {
      lignes: true,
      livraison: true,
      paiements: { orderBy: { dateCreation: "desc" } },
      acheteur: { select: { nom: true, email: true, telephone: true } },
    },
  });
}
