import { prisma } from "@/lib/db";

/**
 * Vue VENDEUR de ses commandes : chaque commande contenant au moins une de
 * ses lignes, avec UNIQUEMENT ses lignes (une commande peut mêler plusieurs
 * vendeurs). Lecture seule : la logistique (transporteur, expédition,
 * livraison) reste pilotée par l'admin ; le vendeur prépare ses articles.
 */
export async function listerCommandesVendeur(vendeurId: string) {
  const commandes = await prisma.commande.findMany({
    where: { lignes: { some: { vendeurId } } },
    orderBy: { dateCreation: "desc" },
    take: 100,
    include: {
      lignes: { where: { vendeurId } },
      livraison: { select: { statut: true, transporteur: true } },
    },
  });
  return commandes.map((c) => ({
    ...c,
    totalVendeur: c.lignes.reduce((s, l) => s + l.sousTotal, 0),
  }));
}

/**
 * Compteurs du tableau de bord vendeur. « À préparer » = commandes confirmées
 * (COD) ou payées (Mobile Money) pas encore expédiées.
 */
export async function compterCommandesVendeur(vendeurId: string) {
  const where = { lignes: { some: { vendeurId } } } as const;
  const [aPreparer, enCours, livrees] = await Promise.all([
    prisma.commande.count({
      where: { ...where, statutCommande: { in: ["CONFIRMEE", "EN_PREPARATION"] } },
    }),
    prisma.commande.count({
      where: { ...where, statutCommande: "EXPEDIEE" },
    }),
    prisma.commande.count({
      where: { ...where, statutCommande: "LIVREE" },
    }),
  ]);
  return { aPreparer, enCours, livrees };
}
