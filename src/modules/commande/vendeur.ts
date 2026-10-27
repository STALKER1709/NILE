import { prisma } from "@/lib/db";
import type { StatutCommande } from "@prisma/client";

export interface FiltresCommandesVendeur {
  q?: string;
  statut?: StatutCommande;
}

function whereCommandes(vendeurId: string, filtres: FiltresCommandesVendeur = {}) {
  return {
    lignes: { some: { vendeurId } },
    ...(filtres.statut ? { statutCommande: filtres.statut } : {}),
    ...(filtres.q ? { numero: { contains: filtres.q, mode: "insensitive" as const } } : {}),
  };
}

export async function listerCommandesVendeur(
  vendeurId: string,
  page = 1,
  parPage = 20,
  filtres: FiltresCommandesVendeur = {},
) {
  const pageSecurisee = Number.isInteger(page) && page > 0 ? page : 1;
  const commandes = await prisma.commande.findMany({
    where: whereCommandes(vendeurId, filtres),
    orderBy: { dateCreation: "desc" },
    skip: (pageSecurisee - 1) * parPage,
    take: parPage,
    include: {
      lignes: { where: { vendeurId } },
      _count: { select: { lignes: true } },
      livraison: { select: { statut: true, transporteur: true } },
    },
  });
  return commandes.map((c) => ({
    ...c,
    totalVendeur: c.lignes.reduce((s, l) => s + l.sousTotal, 0),
    gereeParVendeur: c._count.lignes === c.lignes.length,
  }));
}

export async function compterTotalCommandesVendeur(
  vendeurId: string,
  filtres: FiltresCommandesVendeur = {},
): Promise<number> {
  return prisma.commande.count({ where: whereCommandes(vendeurId, filtres) });
}

export async function vendeurGereCommande(vendeurId: string, commandeId: string): Promise<boolean> {
  const [total, duVendeur] = await Promise.all([
    prisma.ligneCommande.count({ where: { commandeId } }),
    prisma.ligneCommande.count({ where: { commandeId, vendeurId } }),
  ]);
  return total > 0 && total === duVendeur;
}

/** « À préparer » ne compte que les commandes que le vendeur peut piloter. */
export async function compterCommandesVendeur(vendeurId: string) {
  const commandesVendeur = { lignes: { some: { vendeurId } } } as const;
  const commandesEntierementVendeur = {
    lignes: { some: { vendeurId }, every: { vendeurId } },
  } as const;
  const [aPreparer, enCours, livrees] = await Promise.all([
    prisma.commande.count({
      where: { ...commandesEntierementVendeur, statutCommande: { in: ["CONFIRMEE", "EN_PREPARATION"] } },
    }),
    prisma.commande.count({ where: { ...commandesVendeur, statutCommande: "EXPEDIEE" } }),
    prisma.commande.count({ where: { ...commandesVendeur, statutCommande: "LIVREE" } }),
  ]);
  return { aPreparer, enCours, livrees };
}
