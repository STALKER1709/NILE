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
      _count: { select: { lignes: true } },
      livraison: { select: { statut: true, transporteur: true } },
    },
  });
  return commandes.map((c) => ({
    ...c,
    totalVendeur: c.lignes.reduce((s, l) => s + l.sousTotal, 0),
    // La boutique pilote le suivi seulement si TOUTES les lignes sont à elle
    // (commande multi-boutiques : suivi coordonné par NILE).
    gereeParVendeur: c._count.lignes === c.lignes.length,
  }));
}

/**
 * Autorisation de suivi : une boutique ne peut piloter la livraison d'une
 * commande que si TOUTES ses lignes lui appartiennent. Vérifié côté serveur
 * avant chaque transition (jamais seulement dans l'interface).
 */
export async function vendeurGereCommande(
  vendeurId: string,
  commandeId: string,
): Promise<boolean> {
  const [total, duVendeur] = await Promise.all([
    prisma.ligneCommande.count({ where: { commandeId } }),
    prisma.ligneCommande.count({ where: { commandeId, vendeurId } }),
  ]);
  return total > 0 && total === duVendeur;
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
