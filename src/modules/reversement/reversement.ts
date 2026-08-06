import { prisma } from "@/lib/db";
import { getTauxCommissionPourcent } from "@/modules/commande/config";
import {
  calculerSolde,
  verifierReversement,
  type CalculSolde,
} from "@/modules/reversement/reversement-core";

/**
 * Lignes de commande donnant lieu à un versement DE NILE VERS LE VENDEUR :
 * commande livrée, payée, et réglée par Mobile Money.
 *
 * Le paiement à la livraison est volontairement exclu : l'argent y est remis
 * en espèces au livreur de la boutique, il n'a jamais transité par NILE. Le
 * vendeur détient déjà ces recettes — lui reverser quoi que ce soit
 * reviendrait à le payer deux fois.
 */
const WHERE_ELIGIBLE = {
  commande: {
    statutCommande: "LIVREE",
    statutPaiement: "PAYE",
    modePaiement: "MONETBIL",
  },
} as const;

/**
 * Lignes réglées en espèces à la livraison, abouties elles aussi.
 *
 * Elles n'entrent PAS dans le montant reversable — le vendeur a déjà encaissé
 * — mais elles entrent dans l'assiette de commission : la vente a bien eu lieu
 * sur NILE. La commission correspondante est retenue sur les reversements
 * Mobile Money du même vendeur, faute de pouvoir la prélever sur des espèces
 * que la plateforme ne touche jamais.
 */
const WHERE_COMMISSIONNABLE_COD = {
  commande: {
    statutCommande: "LIVREE",
    statutPaiement: "PAYE",
    modePaiement: "COD",
  },
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
  const [taux, vendeurs, ventes, ventesCOD, reversements] = await Promise.all([
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
    prisma.ligneCommande.groupBy({
      by: ["vendeurId"],
      where: WHERE_COMMISSIONNABLE_COD,
      _sum: { sousTotal: true },
    }),
    prisma.reversement.groupBy({
      by: ["vendeurId", "statut"],
      _sum: { montant: true },
    }),
  ]);

  const brutPar = new Map(ventes.map((v) => [v.vendeurId, v._sum.sousTotal ?? 0]));
  const brutCODPar = new Map(
    ventesCOD.map((v) => [v.vendeurId, v._sum.sousTotal ?? 0]),
  );
  // Payé et en attente sont comptés séparément : seul le premier est sorti
  // des caisses, le second n'est qu'une réservation.
  const versePar = new Map<string, number>();
  const attentePar = new Map<string, number>();
  for (const r of reversements) {
    const cible = r.statut === "PAYE" ? versePar : r.statut === "DEMANDE" ? attentePar : null;
    if (cible) cible.set(r.vendeurId, (cible.get(r.vendeurId) ?? 0) + (r._sum.montant ?? 0));
  }

  return vendeurs
    .map((v) => ({
      vendeurId: v.id,
      nomBoutique: v.nomBoutique,
      emailVendeur: v.utilisateur.email,
      estBoutiqueMaison: v.estBoutiqueMaison,
      tauxPourcent: taux,
      ...calculerSolde({
        brut: brutPar.get(v.id) ?? 0,
        brutCOD: brutCODPar.get(v.id) ?? 0,
        tauxPourcent: taux,
        dejaReverse: versePar.get(v.id) ?? 0,
        enAttente: attentePar.get(v.id) ?? 0,
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

  const [taux, ventes, ventesCOD, verse, attente] = await Promise.all([
    getTauxCommissionPourcent(),
    prisma.ligneCommande.aggregate({
      where: { vendeurId, ...WHERE_ELIGIBLE },
      _sum: { sousTotal: true },
    }),
    prisma.ligneCommande.aggregate({
      where: { vendeurId, ...WHERE_COMMISSIONNABLE_COD },
      _sum: { sousTotal: true },
    }),
    prisma.reversement.aggregate({
      where: { vendeurId, statut: "PAYE" },
      _sum: { montant: true },
    }),
    prisma.reversement.aggregate({
      where: { vendeurId, statut: "DEMANDE" },
      _sum: { montant: true },
    }),
  ]);

  return {
    tauxPourcent: taux,
    ...calculerSolde({
      brut: ventes._sum.sousTotal ?? 0,
      brutCOD: ventesCOD._sum.sousTotal ?? 0,
      tauxPourcent: taux,
      dejaReverse: verse._sum.montant ?? 0,
      enAttente: attente._sum.montant ?? 0,
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
 * Enregistre un reversement DÉJÀ PAYÉ au vendeur (transfert MoMo/OM manuel
 * effectué par l'admin). Le solde est revérifié sous verrou (voir
 * creerLigneReversement).
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

  return creerLigneReversement(vendeurId, montant, "PAYE", taux, commentaire);
}

/**
 * Demande de versement émise par le VENDEUR lui-même. Crée une ligne DEMANDE :
 * le montant est réservé sur son solde mais n'est pas encore payé.
 */
export async function demanderReversement(
  vendeurId: string,
  montant: number,
): Promise<ResultatReversement> {
  const vendeur = await prisma.vendeur.findUnique({
    where: { id: vendeurId },
    select: { estBoutiqueMaison: true },
  });
  if (!vendeur || vendeur.estBoutiqueMaison) {
    return { ok: false, code: "INTROUVABLE" };
  }
  const taux = await getTauxCommissionPourcent();
  return creerLigneReversement(vendeurId, montant, "DEMANDE", taux);
}

/**
 * Crée une ligne de reversement après avoir revérifié le solde sous verrou de
 * la ligne vendeur : deux écritures concurrentes ne peuvent pas, ensemble,
 * dépasser le dû.
 */
async function creerLigneReversement(
  vendeurId: string,
  montant: number,
  statut: "PAYE" | "DEMANDE",
  taux: number,
  commentaire?: string,
): Promise<ResultatReversement> {
  try {
    await prisma.$transaction(async (tx) => {
      // Verrou sur la ligne du vendeur AVANT de calculer le solde.
      // Indispensable : sous l'isolation par défaut (READ COMMITTED), deux
      // demandes concurrentes liraient le même agrégat, passeraient toutes
      // deux la vérification et insèreraient chacune sa ligne — le total
      // réservé dépasserait alors le dû. Le verrou sérialise les écritures
      // de reversement par vendeur.
      await tx.$queryRaw`SELECT id FROM "Vendeur" WHERE id = ${vendeurId} FOR UPDATE`;

      const [ventes, ventesCOD, verse, attente] = await Promise.all([
        tx.ligneCommande.aggregate({
          where: { vendeurId, ...WHERE_ELIGIBLE },
          _sum: { sousTotal: true },
        }),
        tx.ligneCommande.aggregate({
          where: { vendeurId, ...WHERE_COMMISSIONNABLE_COD },
          _sum: { sousTotal: true },
        }),
        tx.reversement.aggregate({
          where: { vendeurId, statut: "PAYE" },
          _sum: { montant: true },
        }),
        tx.reversement.aggregate({
          where: { vendeurId, statut: "DEMANDE" },
          _sum: { montant: true },
        }),
      ]);
      const { solde } = calculerSolde({
        brut: ventes._sum.sousTotal ?? 0,
        brutCOD: ventesCOD._sum.sousTotal ?? 0,
        tauxPourcent: taux,
        dejaReverse: verse._sum.montant ?? 0,
        enAttente: attente._sum.montant ?? 0,
        exempteCommission: false,
      });
      const decision = verifierReversement(montant, solde);
      if (!decision.ok) throw new Error(decision.code);

      await tx.reversement.create({
        data: {
          vendeurId,
          montant,
          statut,
          commentaire: commentaire || null,
          // Un paiement direct est traité d'emblée ; une demande attend l'admin.
          dateTraitement: statut === "PAYE" ? new Date() : null,
        },
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
    console.error("Erreur creerLigneReversement:", erreur);
    return { ok: false, code: "MONTANT_INVALIDE" };
  }
}

/** Demandes de versement en attente, pour l'écran d'administration. */
export async function listerDemandesReversement() {
  return prisma.reversement.findMany({
    where: { statut: "DEMANDE" },
    orderBy: { dateCreation: "asc" }, // les plus anciennes d'abord
    include: {
      vendeur: {
        select: {
          id: true,
          nomBoutique: true,
          infosPaiement: true,
          utilisateur: { select: { email: true, telephone: true } },
        },
      },
    },
  });
}

/** Demandes du vendeur lui-même (les plus récentes d'abord). */
export async function listerDemandesDuVendeur(vendeurId: string) {
  return prisma.reversement.findMany({
    where: { vendeurId, statut: "DEMANDE" },
    orderBy: { dateCreation: "desc" },
    take: 10,
  });
}

export type ResultatTraitement =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "DEJA_TRAITE" };

/**
 * Marque une demande comme payée, ou la refuse. Le passage n'est autorisé que
 * depuis DEMANDE : un `updateMany` filtré sur ce statut rend l'opération
 * idempotente et empêche deux admins de traiter deux fois la même demande.
 */
export async function traiterDemandeReversement(
  reversementId: string,
  decision: "PAYE" | "REJETE",
  commentaire?: string,
): Promise<ResultatTraitement> {
  const { count } = await prisma.reversement.updateMany({
    where: { id: reversementId, statut: "DEMANDE" },
    data: {
      statut: decision,
      dateTraitement: new Date(),
      ...(commentaire ? { commentaire } : {}),
    },
  });
  if (count > 0) return { ok: true };

  const existe = await prisma.reversement.findUnique({
    where: { id: reversementId },
    select: { id: true },
  });
  return { ok: false, code: existe ? "DEJA_TRAITE" : "INTROUVABLE" };
}

/**
 * Dette de commission de vendeurs donnés, en FCFA.
 *
 * Ciblée sur une liste plutôt que sur tous les vendeurs : c'est appelé au
 * moment de commander, à chaque passage en caisse. Les vendeurs sans dette
 * n'apparaissent pas dans le résultat.
 *
 * La boutique maison est exemptée de commission, donc jamais endettée : elle
 * est écartée d'emblée pour ne pas se retrouver bloquée par son propre
 * garde-fou.
 */
export async function dettesVendeurs(
  vendeurIds: string[],
): Promise<Map<string, number>> {
  const dettes = new Map<string, number>();
  if (vendeurIds.length === 0) return dettes;

  const [taux, vendeurs, ventes, ventesCOD, reversements] = await Promise.all([
    getTauxCommissionPourcent(),
    prisma.vendeur.findMany({
      where: { id: { in: vendeurIds }, estBoutiqueMaison: false },
      select: { id: true },
    }),
    prisma.ligneCommande.groupBy({
      by: ["vendeurId"],
      where: { vendeurId: { in: vendeurIds }, ...WHERE_ELIGIBLE },
      _sum: { sousTotal: true },
    }),
    prisma.ligneCommande.groupBy({
      by: ["vendeurId"],
      where: { vendeurId: { in: vendeurIds }, ...WHERE_COMMISSIONNABLE_COD },
      _sum: { sousTotal: true },
    }),
    prisma.reversement.groupBy({
      by: ["vendeurId"],
      where: { vendeurId: { in: vendeurIds }, statut: "PAYE" },
      _sum: { montant: true },
    }),
  ]);

  const brutPar = new Map(ventes.map((v) => [v.vendeurId, v._sum.sousTotal ?? 0]));
  const brutCODPar = new Map(
    ventesCOD.map((v) => [v.vendeurId, v._sum.sousTotal ?? 0]),
  );
  const versePar = new Map(
    reversements.map((r) => [r.vendeurId, r._sum.montant ?? 0]),
  );

  for (const { id } of vendeurs) {
    const { dette } = calculerSolde({
      brut: brutPar.get(id) ?? 0,
      brutCOD: brutCODPar.get(id) ?? 0,
      tauxPourcent: taux,
      dejaReverse: versePar.get(id) ?? 0,
      // Les demandes en attente ne sont pas déduites ici : elles réduisent le
      // disponible, pas le dû. Les compter gonflerait artificiellement la
      // dette et couperait le COD à un vendeur qui ne doit rien.
      exempteCommission: false,
    });
    if (dette > 0) dettes.set(id, dette);
  }
  return dettes;
}
