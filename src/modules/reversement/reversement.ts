import { prisma } from "@/lib/db";
import { getTauxCommissionPourcent } from "@/modules/commande/config";
import {
  calculerSolde,
  verifierReversement,
  type CalculSolde,
} from "@/modules/reversement/reversement-core";

/** Lignes de commande éligibles : commande LIVRÉE et PAYÉE. */
const WHERE_ELIGIBLE = {
  commande: { statutCommande: "LIVREE", statutPaiement: "PAYE" },
} as const;

export interface SoldeVendeur extends CalculSolde {
  vendeurId: string;
  nomBoutique: string;
  emailVendeur: string;
  estBoutiqueMaison: boolean;
  tauxPourcent: number;
}

/**
 * Soldes de TOUS les vendeurs tiers (la boutique maison est exclue : son
 * chiffre appartient déjà à la plateforme). Trié par solde décroissant.
 */
export async function listerSoldesVendeurs(): Promise<SoldeVendeur[]> {
  const [taux, vendeurs, ventes, reversements] = await Promise.all([
    getTauxCommissionPourcent(),
    prisma.vendeur.findMany({
      where: { estBoutiqueMaison: false },
      select: {
        id: true,
        nomBoutique: true,
        estBoutiqueMaison: true,
        utilisateur: { select: { email: true } },
      },
    }),
    prisma.ligneCommande.groupBy({
      by: ["vendeurId"],
      where: WHERE_ELIGIBLE,
      _sum: { sousTotal: true },
    }),
    prisma.reversement.groupBy({
      by: ["vendeurId"],
      _sum: { montant: true },
    }),
  ]);

  const brutPar = new Map(ventes.map((v) => [v.vendeurId, v._sum.sousTotal ?? 0]));
  const versePar = new Map(
    reversements.map((r) => [r.vendeurId, r._sum.montant ?? 0]),
  );

  return vendeurs
    .map((v) => ({
      vendeurId: v.id,
      nomBoutique: v.nomBoutique,
      emailVendeur: v.utilisateur.email,
      estBoutiqueMaison: v.estBoutiqueMaison,
      tauxPourcent: taux,
      ...calculerSolde({
        brut: brutPar.get(v.id) ?? 0,
        tauxPourcent: taux,
        dejaReverse: versePar.get(v.id) ?? 0,
        exempteCommission: v.estBoutiqueMaison,
      }),
    }))
    .sort((a, b) => b.solde - a.solde);
}

/** Solde d'UN vendeur (affiché aussi dans son tableau de bord). */
export async function getSoldeVendeur(
  vendeurId: string,
): Promise<(CalculSolde & { tauxPourcent: number }) | null> {
  const vendeur = await prisma.vendeur.findUnique({
    where: { id: vendeurId },
    select: { estBoutiqueMaison: true },
  });
  if (!vendeur) return null;

  const [taux, ventes, verse] = await Promise.all([
    getTauxCommissionPourcent(),
    prisma.ligneCommande.aggregate({
      where: { vendeurId, ...WHERE_ELIGIBLE },
      _sum: { sousTotal: true },
    }),
    prisma.reversement.aggregate({
      where: { vendeurId },
      _sum: { montant: true },
    }),
  ]);

  return {
    tauxPourcent: taux,
    ...calculerSolde({
      brut: ventes._sum.sousTotal ?? 0,
      tauxPourcent: taux,
      dejaReverse: verse._sum.montant ?? 0,
      exempteCommission: vendeur.estBoutiqueMaison,
    }),
  };
}

/** Historique des reversements d'un vendeur (plus récents d'abord). */
export async function listerReversementsVendeur(vendeurId: string) {
  return prisma.reversement.findMany({
    where: { vendeurId },
    orderBy: { dateCreation: "desc" },
    take: 50,
  });
}

export type ResultatReversement =
  | { ok: true }
  | {
      ok: false;
      code: "INTROUVABLE" | "MONTANT_INVALIDE" | "SOLDE_INSUFFISANT";
    };

/**
 * Enregistre un reversement fait au vendeur (transfert MoMo/OM manuel).
 * Transactionnel : le solde est recalculé DANS la transaction pour empêcher
 * un double enregistrement concurrent de dépasser le dû.
 */
export async function enregistrerReversement(
  vendeurId: string,
  montant: number,
  commentaire?: string,
): Promise<ResultatReversement> {
  const vendeur = await prisma.vendeur.findUnique({
    where: { id: vendeurId },
    select: { estBoutiqueMaison: true },
  });
  if (!vendeur || vendeur.estBoutiqueMaison) {
    return { ok: false, code: "INTROUVABLE" };
  }
  const taux = await getTauxCommissionPourcent();

  try {
    await prisma.$transaction(async (tx) => {
      const [ventes, verse] = await Promise.all([
        tx.ligneCommande.aggregate({
          where: { vendeurId, ...WHERE_ELIGIBLE },
          _sum: { sousTotal: true },
        }),
        tx.reversement.aggregate({
          where: { vendeurId },
          _sum: { montant: true },
        }),
      ]);
      const { solde } = calculerSolde({
        brut: ventes._sum.sousTotal ?? 0,
        tauxPourcent: taux,
        dejaReverse: verse._sum.montant ?? 0,
        exempteCommission: false,
      });
      const decision = verifierReversement(montant, solde);
      if (!decision.ok) throw new Error(decision.code);

      await tx.reversement.create({
        data: { vendeurId, montant, commentaire: commentaire || null },
      });
    });
    return { ok: true };
  } catch (erreur) {
    if (erreur instanceof Error) {
      if (erreur.message === "MONTANT_INVALIDE") {
        return { ok: false, code: "MONTANT_INVALIDE" };
      }
      if (erreur.message === "SOLDE_INSUFFISANT") {
        return { ok: false, code: "SOLDE_INSUFFISANT" };
      }
    }
    console.error("Erreur enregistrerReversement:", erreur);
    return { ok: false, code: "MONTANT_INVALIDE" };
  }
}
