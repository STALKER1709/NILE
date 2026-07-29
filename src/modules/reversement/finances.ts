import { prisma } from "@/lib/db";
import { getSoldeVendeur } from "@/modules/reversement/reversement";
import {
  bornesMoisPrecedent,
  calculerVariationPourcent,
  debutDuMois,
  serieParJour,
  type PointJour,
} from "@/modules/stats/stats-core";
import {
  etatVente,
  fusionnerTransactions,
  type TransactionVendeur,
} from "@/modules/reversement/finances-core";
import type { CalculSolde } from "@/modules/reversement/reversement-core";

/** Fenêtre de l'histogramme des revenus. */
const NB_JOURS = 7;
/** Nombre de lignes affichées dans l'historique. */
const NB_TRANSACTIONS = 20;

export interface FinancesVendeur {
  solde: CalculSolde & { tauxPourcent: number };
  /** Ventes réglées du mois en cours (FCFA). */
  ventesMois: number;
  /** Ventes réglées du mois précédent, pour la comparaison. */
  ventesMoisPrecedent: number;
  /** Évolution en % d'un mois sur l'autre, `null` si le mois précédent est vide. */
  variationPourcent: number | null;
  /** Commandes distinctes livrées et payées ce mois-ci. */
  commandesFinaliseesMois: number;
  /** Revenus des 7 derniers jours (commandes non annulées). */
  serieJours: PointJour[];
  transactions: TransactionVendeur[];
}

/**
 * Toutes les données de l'écran Finances d'un vendeur.
 *
 * Les « ventes du mois » suivent la même règle que le solde (commande LIVREE
 * et PAYE) pour que les deux chiffres restent cohérents entre eux.
 */
export async function getFinancesVendeur(
  vendeurId: string,
): Promise<FinancesVendeur | null> {
  const solde = await getSoldeVendeur(vendeurId);
  if (!solde) return null;

  const debutMois = debutDuMois();
  const { debut: debutPrec, fin: finPrec } = bornesMoisPrecedent();

  const [moisCourant, moisPrecedent, commandesMois, lignesRecentes, lignes, reversements] =
    await Promise.all([
      prisma.ligneCommande.aggregate({
        where: {
          vendeurId,
          commande: {
            statutCommande: "LIVREE",
            statutPaiement: "PAYE",
            dateCreation: { gte: debutMois },
          },
        },
        _sum: { sousTotal: true },
      }),
      prisma.ligneCommande.aggregate({
        where: {
          vendeurId,
          commande: {
            statutCommande: "LIVREE",
            statutPaiement: "PAYE",
            dateCreation: { gte: debutPrec, lt: finPrec },
          },
        },
        _sum: { sousTotal: true },
      }),
      // Commandes DISTINCTES : une commande de 3 lignes ne compte qu'une fois.
      prisma.commande.count({
        where: {
          statutCommande: "LIVREE",
          statutPaiement: "PAYE",
          dateCreation: { gte: debutMois },
          lignes: { some: { vendeurId } },
        },
      }),
      prisma.ligneCommande.findMany({
        where: {
          vendeurId,
          commande: {
            dateCreation: { gte: ilYAJours(NB_JOURS) },
            statutCommande: { notIn: ["ANNULEE", "REFUSEE"] },
          },
        },
        select: { sousTotal: true, commande: { select: { dateCreation: true } } },
      }),
      prisma.ligneCommande.findMany({
        where: { vendeurId },
        orderBy: { commande: { dateCreation: "desc" } },
        take: NB_TRANSACTIONS,
        select: {
          id: true,
          titreProduit: true,
          quantite: true,
          sousTotal: true,
          commande: {
            select: {
              numero: true,
              dateCreation: true,
              statutCommande: true,
              statutPaiement: true,
            },
          },
        },
      }),
      prisma.reversement.findMany({
        where: { vendeurId },
        orderBy: { dateCreation: "desc" },
        take: NB_TRANSACTIONS,
        select: { id: true, montant: true, commentaire: true, dateCreation: true },
      }),
    ]);

  const ventes: TransactionVendeur[] = lignes.map((l) => ({
    id: l.id,
    date: l.commande.dateCreation,
    type: "VENTE",
    libelle:
      l.quantite > 1
        ? `Vente · ${l.titreProduit} × ${l.quantite}`
        : `Vente · ${l.titreProduit}`,
    reference: l.commande.numero,
    montant: l.sousTotal,
    etat: etatVente(l.commande.statutCommande, l.commande.statutPaiement),
  }));

  const versements: TransactionVendeur[] = reversements.map((r) => ({
    id: r.id,
    date: r.dateCreation,
    type: "REVERSEMENT",
    libelle: r.commentaire
      ? `Reversement · ${r.commentaire}`
      : "Reversement Mobile Money",
    // Pas de numéro lisible sur un reversement : on montre un préfixe d'id.
    reference: r.id.slice(0, 8).toUpperCase(),
    montant: r.montant,
    etat: "VERSE",
  }));

  const ventesMois = moisCourant._sum.sousTotal ?? 0;
  const ventesMoisPrecedent = moisPrecedent._sum.sousTotal ?? 0;

  return {
    solde,
    ventesMois,
    ventesMoisPrecedent,
    variationPourcent: calculerVariationPourcent(ventesMois, ventesMoisPrecedent),
    commandesFinaliseesMois: commandesMois,
    serieJours: serieParJour(
      lignesRecentes.map((l) => ({
        date: l.commande.dateCreation,
        valeur: l.sousTotal,
      })),
      NB_JOURS,
    ),
    transactions: fusionnerTransactions(ventes, versements, NB_TRANSACTIONS),
  };
}

function ilYAJours(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
