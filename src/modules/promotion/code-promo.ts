import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  normaliserCode,
  calculerRemise,
  evaluerCodePromo,
  type DecisionCodePromo,
} from "@/modules/promotion/code-promo-core";

/**
 * Codes promotionnels : lecture, évaluation, consommation.
 *
 * La remise sort de la marge de NILE et non de celle du vendeur : elle est
 * retranchée du total payé par l'acheteur, mais les `LigneCommande.sousTotal`
 * restent au prix plein, puisque c'est sur eux que reposent le reversement au
 * vendeur et la commission. D'où la restriction au Mobile Money — en paiement
 * à la livraison, NILE n'encaisse rien et n'a donc rien à remiser.
 */

export type ResultatCodePromo =
  | { ok: true; codePromoId: string; code: string; remise: number }
  | { ok: false; raison: DecisionCodePromo };

/**
 * Évalue un code SANS le consommer : sert à l'aperçu au moment de commander.
 *
 * Le résultat n'engage à rien — le code est réévalué, sous verrou, au moment
 * d'enregistrer la commande. Un aperçu favorable ne garantit donc pas la
 * remise : entre les deux, le quota a pu s'épuiser.
 */
export async function evaluerCode(params: {
  saisie: string;
  utilisateurId: string;
  totalPanier: number;
  modePaiement: string;
  maintenant?: Date;
}): Promise<ResultatCodePromo> {
  const code = normaliserCode(params.saisie);
  if (!code) return { ok: false, raison: "INTROUVABLE" };

  const promo = await prisma.codePromo.findUnique({ where: { code } });
  if (!promo) return { ok: false, raison: "INTROUVABLE" };

  const [nbUtilisations, dejaUtilise] = await Promise.all([
    prisma.utilisationCodePromo.count({ where: { codePromoId: promo.id } }),
    prisma.utilisationCodePromo.findFirst({
      where: { codePromoId: promo.id, utilisateurId: params.utilisateurId },
      select: { id: true },
    }),
  ]);

  const decision = evaluerCodePromo({
    etat: {
      actif: promo.actif,
      dateDebut: promo.dateDebut,
      dateFin: promo.dateFin,
      quotaTotal: promo.quotaTotal,
      nbUtilisations,
      minPanier: promo.minPanier,
      dejaUtiliseParAcheteur: dejaUtilise !== null,
    },
    totalPanier: params.totalPanier,
    modePaiement: params.modePaiement,
    maintenant: params.maintenant,
  });
  if (decision !== "OK") return { ok: false, raison: decision };

  return {
    ok: true,
    codePromoId: promo.id,
    code: promo.code,
    remise: calculerRemise({
      type: promo.type,
      valeur: promo.valeur,
      plafondRemise: promo.plafondRemise,
      totalPanier: params.totalPanier,
    }),
  };
}

/**
 * Réévalue et consomme un code À L'INTÉRIEUR de la transaction de commande.
 *
 * Le verrou sur la ligne du code est indispensable : sous l'isolation par
 * défaut (READ COMMITTED), deux commandes concurrentes liraient le même
 * compteur, passeraient toutes deux la vérification de quota, et une campagne
 * bornée à 100 utilisations pourrait en servir 102. Le verrou sérialise les
 * consommations d'un même code.
 *
 * L'unicité (code, acheteur) est en revanche portée par la BASE : elle protège
 * même si ce verrou venait à être contourné un jour.
 *
 * Renvoie `null` quand aucun code n'est fourni — le cas normal.
 */
export async function consommerCodeTx(
  tx: Prisma.TransactionClient,
  params: {
    saisie: string | null | undefined;
    utilisateurId: string;
    totalPanier: number;
    modePaiement: string;
  },
): Promise<{ codePromoId: string; code: string; remise: number } | null> {
  if (!params.saisie) return null;
  const code = normaliserCode(params.saisie);
  if (!code) return null;

  const promo = await tx.codePromo.findUnique({ where: { code } });
  if (!promo) throw new ErreurCodePromo("INTROUVABLE");

  // Verrou sur la ligne du code AVANT de compter ses utilisations.
  await tx.$queryRaw`SELECT id FROM "CodePromo" WHERE id = ${promo.id} FOR UPDATE`;

  const [nbUtilisations, dejaUtilise] = await Promise.all([
    tx.utilisationCodePromo.count({ where: { codePromoId: promo.id } }),
    tx.utilisationCodePromo.findFirst({
      where: { codePromoId: promo.id, utilisateurId: params.utilisateurId },
      select: { id: true },
    }),
  ]);

  const decision = evaluerCodePromo({
    etat: {
      actif: promo.actif,
      dateDebut: promo.dateDebut,
      dateFin: promo.dateFin,
      quotaTotal: promo.quotaTotal,
      nbUtilisations,
      minPanier: promo.minPanier,
      dejaUtiliseParAcheteur: dejaUtilise !== null,
    },
    totalPanier: params.totalPanier,
    modePaiement: params.modePaiement,
  });
  if (decision !== "OK") throw new ErreurCodePromo(decision);

  const remise = calculerRemise({
    type: promo.type,
    valeur: promo.valeur,
    plafondRemise: promo.plafondRemise,
    totalPanier: params.totalPanier,
  });

  return { codePromoId: promo.id, code: promo.code, remise };
}

/** Portée par une exception pour remonter à travers la transaction de commande. */
export class ErreurCodePromo extends Error {
  constructor(public readonly raison: DecisionCodePromo) {
    super(`Code promo refusé : ${raison}`);
    this.name = "ErreurCodePromo";
  }
}
