import { prisma } from "@/lib/db";

/** Commandes payées à la livraison, pour le suivi/réconciliation du cash. */
export async function listerCommandesCOD() {
  return prisma.commande.findMany({
    where: { modePaiement: "COD" },
    orderBy: { dateCreation: "desc" },
    include: { livraison: true },
    take: 100,
  });
}

export type ResultatReconciliation =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "ETAT_INVALIDE" };

/**
 * Le transporteur a remis le cash : on l'enregistre et la commande devient
 * « payée ». (statutCash NON_COLLECTE -> COLLECTE)
 */
export async function marquerCashCollecte(
  commandeId: string,
): Promise<ResultatReconciliation> {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { livraison: true },
  });
  if (!commande || !commande.livraison || commande.modePaiement !== "COD") {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (commande.livraison.statutCash !== "NON_COLLECTE") {
    return { ok: false, code: "ETAT_INVALIDE" };
  }
  await prisma.$transaction([
    prisma.livraison.update({
      where: { commandeId },
      data: { statutCash: "COLLECTE", montantCashCollecte: commande.total },
    }),
    prisma.commande.update({
      where: { id: commandeId },
      data: { statutPaiement: "PAYE" },
    }),
  ]);
  return { ok: true };
}

/** Le cash collecté a été reversé à la plateforme. (COLLECTE -> REVERSE) */
export async function marquerCashReverse(
  commandeId: string,
): Promise<ResultatReconciliation> {
  const livraison = await prisma.livraison.findUnique({ where: { commandeId } });
  if (!livraison) return { ok: false, code: "INTROUVABLE" };
  if (livraison.statutCash !== "COLLECTE") {
    return { ok: false, code: "ETAT_INVALIDE" };
  }
  await prisma.livraison.update({
    where: { commandeId },
    data: { statutCash: "REVERSE" },
  });
  return { ok: true };
}
