import { prisma } from "@/lib/db";
import { serieParJour, debutDuMois, type PointJour } from "@/modules/stats/stats-core";

/**
 * Statistiques des tableaux de bord. Conventions :
 *  - « CA réalisé » / « ventes » = commandes LIVRÉES et PAYÉES (même règle
 *    que les reversements : l'argent est réellement acquis).
 *  - « activité 7 jours » = montant des commandes CRÉÉES par jour (hors
 *    annulées/refusées) : mesure le rythme, pas l'encaissement.
 */

const STATUTS_ACTIFS = ["EN_ATTENTE", "CONFIRMEE", "EN_PREPARATION", "EXPEDIEE"] as const;
const NB_JOURS = 7;

function ilYAJours(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

// --------------------------------- ACHETEUR ----------------------------------

export async function statsAcheteur(utilisateurId: string) {
  const [enCours, livrees, depense, derniere] = await Promise.all([
    prisma.commande.count({
      where: { acheteurId: utilisateurId, statutCommande: { in: [...STATUTS_ACTIFS] } },
    }),
    prisma.commande.count({
      where: { acheteurId: utilisateurId, statutCommande: "LIVREE" },
    }),
    prisma.commande.aggregate({
      where: { acheteurId: utilisateurId, statutPaiement: "PAYE" },
      _sum: { total: true },
    }),
    prisma.commande.findFirst({
      where: { acheteurId: utilisateurId },
      orderBy: { dateCreation: "desc" },
      include: { _count: { select: { lignes: true } } },
    }),
  ]);
  return {
    enCours,
    livrees,
    totalDepense: depense._sum.total ?? 0,
    derniereCommande: derniere,
  };
}

// --------------------------------- VENDEUR -----------------------------------

export async function statsVendeur(vendeurId: string): Promise<{
  ventesMois: number;
  produitsActifs: number;
  produitsEnAlerte: { id: string; titre: string; stock: number }[];
  noteMoyenne: number | null;
  nbAvis: number;
  activite7Jours: PointJour[];
}> {
  const [ventesMois, produitsActifs, alerte, avis, lignesRecentes] =
    await Promise.all([
      prisma.ligneCommande.aggregate({
        where: {
          vendeurId,
          commande: {
            statutCommande: "LIVREE",
            statutPaiement: "PAYE",
            dateCreation: { gte: debutDuMois() },
          },
        },
        _sum: { sousTotal: true },
      }),
      prisma.produit.count({ where: { vendeurId, statut: "ACTIF" } }),
      // Le seuil ne peut plus être posé en SQL sur `Produit.stock` : ce champ
      // n'est plus décrémenté à la vente, l'alerte ne se déclencherait jamais.
      // Le stock réel étant réparti sur les déclinaisons, il se totalise ici.
      prisma.produit.findMany({
        where: { vendeurId, statut: "ACTIF" },
        select: {
          id: true,
          titre: true,
          variantes: { where: { actif: true }, select: { stock: true } },
        },
      }),
      prisma.avis.aggregate({
        where: { produit: { vendeurId } },
        _avg: { note: true },
        _count: true,
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
    ]);

  return {
    ventesMois: ventesMois._sum.sousTotal ?? 0,
    produitsActifs,
    produitsEnAlerte: alerte
      .map((p) => ({
        id: p.id,
        titre: p.titre,
        stock: p.variantes.reduce((s, v) => s + Math.max(0, v.stock), 0),
      }))
      .filter((p) => p.stock <= 2)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5),
    noteMoyenne: avis._avg.note,
    nbAvis: avis._count,
    activite7Jours: serieParJour(
      lignesRecentes.map((l) => ({ date: l.commande.dateCreation, valeur: l.sousTotal })),
      NB_JOURS,
    ),
  };
}

// ---------------------------------- ADMIN ------------------------------------

export async function statsAdmin() {
  const [caRealise, caMois, cashCOD, commandesActives, recentes, dernieres] =
    await Promise.all([
      prisma.commande.aggregate({
        where: { statutCommande: "LIVREE", statutPaiement: "PAYE" },
        _sum: { total: true },
      }),
      prisma.commande.aggregate({
        where: {
          statutCommande: "LIVREE",
          statutPaiement: "PAYE",
          dateCreation: { gte: debutDuMois() },
        },
        _sum: { total: true },
      }),
      // Espèces encaissées par les boutiques à la remise du colis. Chiffre
      // d'INFORMATION : cet argent ne revient pas à NILE, il n'y a donc rien
      // à réconcilier — le montant ne fait que croître avec les livraisons.
      prisma.livraison.aggregate({
        where: { statutCash: "COLLECTE" },
        _sum: { montantCashCollecte: true },
        _count: true,
      }),
      prisma.commande.count({
        where: { statutCommande: { in: [...STATUTS_ACTIFS] } },
      }),
      prisma.commande.findMany({
        where: {
          dateCreation: { gte: ilYAJours(NB_JOURS) },
          statutCommande: { notIn: ["ANNULEE", "REFUSEE"] },
        },
        select: { total: true, dateCreation: true },
      }),
      prisma.commande.findMany({
        orderBy: { dateCreation: "desc" },
        take: 5,
        include: { acheteur: { select: { nom: true } } },
      }),
    ]);

  // Chiffre d'affaires NET : `Commande.total` est déjà déduit de la remise
  // d'un éventuel code promo. Les reversements aux vendeurs et la commission,
  // eux, se calculent sur les `LigneCommande.sousTotal`, qui restent au prix
  // plein — la remise étant supportée par NILE. Les deux chiffres divergent
  // donc dès le premier code utilisé, et c'est voulu.
  return {
    caRealise: caRealise._sum.total ?? 0,
    caMois: caMois._sum.total ?? 0,
    cashEncaisseBoutiques: cashCOD._sum.montantCashCollecte ?? 0,
    nbLivraisonsCOD: cashCOD._count,
    commandesActives,
    activite7Jours: serieParJour(
      recentes.map((c) => ({ date: c.dateCreation, valeur: c.total })),
      NB_JOURS,
    ),
    dernieresCommandes: dernieres,
  };
}
