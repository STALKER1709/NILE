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
 * Les « ventes du mois » comptent TOUTE vente aboutie (commande LIVREE et
 * PAYE), espèces comprises : c'est l'activité réelle de la boutique.
 *
 * Le solde, lui, ne retient que les ventes réglées en Mobile Money — seules
 * celles-là ont transité par NILE et restent donc à reverser. Les deux
 * chiffres divergent volontairement chez un vendeur qui vend en COD ; l'écran
 * Finances l'explique sous le détail du solde.
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
        take: NB_TRANSACTIONS * 5,
        select: {
          id: true,
          titreProduit: true,
          quantite: true,
          sousTotal: true,
          commande: {
            select: {
              id: true,
              numero: true,
              dateCreation: true,
              statutCommande: true,
              statutPaiement: true,
              modePaiement: true,
            },
          },
        },
      }),
      prisma.reversement.findMany({
        where: { vendeurId },
        orderBy: { dateCreation: "desc" },
        take: NB_TRANSACTIONS,
        select: { id: true, montant: true, commentaire: true, statut: true, dateCreation: true, dateTraitement: true },
      }),
    ]);

  // Regrouper les lignes par commande avant de calculer la commission :
  // l'arrondi se fait une fois sur le sous-total vendeur de la commande.
  const lignesParCommande = new Map<string, typeof lignes>();
  for (const ligne of lignes) {
    const groupe = lignesParCommande.get(ligne.commande.id) ?? [];
    groupe.push(ligne);
    lignesParCommande.set(ligne.commande.id, groupe);
  }

  const ventes: TransactionVendeur[] = [...lignesParCommande.entries()].map(
    ([commandeId, groupe]) => {
      const premiere = groupe[0]!;
      const montant = groupe.reduce((total, ligne) => total + ligne.sousTotal, 0);
      // La boutique maison est exemptée. Pour les vendeurs tiers, appliquer
      // le taux configuré et l'arrondi FCFA au sous-total de la commande.
      const commission = solde.commission > 0
        ? Math.round((montant * solde.tauxPourcent) / 100)
        : 0;
      const modePaiement = premiere.commande.modePaiement;
      const produits = groupe.map((ligne) =>
        ligne.quantite > 1
          ? ligne.titreProduit + " × " + ligne.quantite
          : ligne.titreProduit,
      ).join(", ");

      return {
        id: commandeId,
        date: premiere.commande.dateCreation,
        type: "VENTE",
        libelle: "Vente · " + produits,
        reference: premiere.commande.numero,
        montant,
        etat: etatVente(premiere.commande.statutCommande, premiere.commande.statutPaiement),
        commission,
        modePaiement,
        // En COD, le vendeur a déjà encaissé les espèces : la commission
        // reste due et s'impute sur ses reversements Mobile Money futurs.
        netVendeur: modePaiement === "MONETBIL" ? montant - commission : null,
      };
    },
  );

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
    etat: r.statut === "PAYE" ? "VERSE" : r.statut === "REJETE" ? "REJETE" : "EN_ATTENTE",
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
