import { prisma } from "@/lib/db";
import { getSoldeVendeur } from "@/modules/reversement/reversement";
import { bornesMoisPrecedent, calculerVariationPourcent, debutDuMois, serieParJour, type PointJour } from "@/modules/stats/stats-core";
import { etatVente, fusionnerTransactions, type TransactionVendeur } from "@/modules/reversement/finances-core";
import type { CalculSolde } from "@/modules/reversement/reversement-core";

const NB_JOURS = 7;
const NB_TRANSACTIONS = 20;

export interface FinancesVendeur {
  solde: CalculSolde & { tauxPourcent: number };
  ventesMois: number;
  ventesMoisPrecedent: number;
  variationPourcent: number | null;
  commandesFinaliseesMois: number;
  serieJours: PointJour[];
  transactions: TransactionVendeur[];
}

/** Les ventes mensuelles sont attribuées au mois de livraison confirmée. */
export async function getFinancesVendeur(vendeurId: string): Promise<FinancesVendeur | null> {
  const solde = await getSoldeVendeur(vendeurId);
  if (!solde) return null;
  const debutMois = debutDuMois();
  const { debut: debutPrec, fin: finPrec } = bornesMoisPrecedent();

  const [moisCourant, moisPrecedent, commandesMois, lignesRecentes, lignes, reversements] = await Promise.all([
    prisma.ligneCommande.aggregate({
      where: { vendeurId, commande: { statutCommande: "LIVREE", statutPaiement: "PAYE", livraison: { is: { dateLivraison: { gte: debutMois } } } } },
      _sum: { sousTotal: true },
    }),
    prisma.ligneCommande.aggregate({
      where: { vendeurId, commande: { statutCommande: "LIVREE", statutPaiement: "PAYE", livraison: { is: { dateLivraison: { gte: debutPrec, lt: finPrec } } } } },
      _sum: { sousTotal: true },
    }),
    prisma.commande.count({
      where: { statutCommande: "LIVREE", statutPaiement: "PAYE", livraison: { is: { dateLivraison: { gte: debutMois } } }, lignes: { some: { vendeurId } } },
    }),
    prisma.ligneCommande.findMany({
      where: { vendeurId, commande: { dateCreation: { gte: ilYAJours(NB_JOURS) }, statutCommande: { notIn: ["ANNULEE", "REFUSEE"] } } },
      select: { sousTotal: true, commande: { select: { dateCreation: true } } },
    }),
    prisma.ligneCommande.findMany({
      where: { vendeurId }, orderBy: { commande: { dateCreation: "desc" } }, take: NB_TRANSACTIONS,
      select: { id: true, titreProduit: true, quantite: true, sousTotal: true, commande: { select: { numero: true, dateCreation: true, statutCommande: true, statutPaiement: true, livraison: { select: { dateLivraison: true } } } } },
    }),
    prisma.reversement.findMany({
      where: { vendeurId }, orderBy: { dateCreation: "desc" }, take: NB_TRANSACTIONS,
      select: { id: true, montant: true, commentaire: true, dateCreation: true, dateTraitement: true, statut: true },
    }),
  ]);

  const ventes: TransactionVendeur[] = lignes.map((l) => ({
    id: l.id, date: l.commande.livraison?.dateLivraison ?? l.commande.dateCreation, type: "VENTE",
    libelle: l.quantite > 1 ? `Vente · ${l.titreProduit} × ${l.quantite}` : `Vente · ${l.titreProduit}`,
    reference: l.commande.numero, montant: l.sousTotal,
    etat: etatVente(l.commande.statutCommande, l.commande.statutPaiement),
  }));
  const versements: TransactionVendeur[] = reversements.map((r) => ({
    id: r.id, date: r.dateTraitement ?? r.dateCreation, type: "REVERSEMENT",
    libelle: r.commentaire ? `Reversement · ${r.commentaire}` : r.statut === "DEMANDE" ? "Demande de reversement Mobile Money" : r.statut === "REJETE" ? "Demande de reversement rejetée" : "Reversement Mobile Money",
    reference: r.id.slice(0, 8).toUpperCase(), montant: r.montant,
    etat: r.statut === "PAYE" ? "VERSE" : r.statut === "REJETE" ? "REJETE" : "EN_ATTENTE",
  }));
  const ventesMois = moisCourant._sum.sousTotal ?? 0;
  const ventesMoisPrecedent = moisPrecedent._sum.sousTotal ?? 0;
  return {
    solde, ventesMois, ventesMoisPrecedent,
    variationPourcent: calculerVariationPourcent(ventesMois, ventesMoisPrecedent),
    commandesFinaliseesMois: commandesMois,
    serieJours: serieParJour(lignesRecentes.map((l) => ({ date: l.commande.dateCreation, valeur: l.sousTotal })), NB_JOURS),
    transactions: fusionnerTransactions(ventes, versements, NB_TRANSACTIONS),
  };
}

function ilYAJours(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - (n - 1)); d.setHours(0, 0, 0, 0); return d;
}
