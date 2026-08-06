import { Prisma } from "@prisma/client";
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

/* ------------------------------ Administration ------------------------------ */

export interface CodePromoAdmin {
  id: string;
  code: string;
  type: string;
  valeur: number;
  plafondRemise: number | null;
  minPanier: number;
  dateDebut: Date;
  dateFin: Date;
  quotaTotal: number | null;
  actif: boolean;
  /** Utilisations effectives, et remise totale déjà consentie. */
  nbUtilisations: number;
  remiseConsentie: number;
}

/**
 * Codes existants, avec ce qu'ils ont réellement coûté.
 *
 * `remiseConsentie` est le chiffre à regarder : c'est de l'argent sorti de la
 * marge de NILE. Un code sans budget visible est un code dont personne ne sait
 * s'il a rapporté quoi que ce soit.
 */
export async function listerCodesPromo(): Promise<CodePromoAdmin[]> {
  const [codes, agregats] = await Promise.all([
    prisma.codePromo.findMany({ orderBy: { dateCreation: "desc" }, take: 100 }),
    prisma.utilisationCodePromo.groupBy({
      by: ["codePromoId"],
      _count: true,
      _sum: { remise: true },
    }),
  ]);
  const parCode = new Map(agregats.map((a) => [a.codePromoId, a]));

  return codes.map((c) => {
    const agg = parCode.get(c.id);
    return {
      ...c,
      nbUtilisations: agg?._count ?? 0,
      remiseConsentie: agg?._sum.remise ?? 0,
    };
  });
}

export type ResultatCreationCode =
  | { ok: true }
  | { ok: false; code: "DEJA_EXISTANT" | "ERREUR" };

export async function creerCodePromo(params: {
  code: string;
  type: "POURCENTAGE" | "MONTANT";
  valeur: number;
  plafondRemise?: number;
  minPanier: number;
  dateDebut: Date;
  dateFin: Date;
  quotaTotal?: number;
}): Promise<ResultatCreationCode> {
  try {
    await prisma.codePromo.create({
      data: {
        code: params.code,
        type: params.type,
        valeur: params.valeur,
        // 0 saisi = pas de plafond : stocké `null` pour que l'absence de
        // plafond ne se confonde pas avec un plafond nul, qui annulerait
        // toute remise.
        plafondRemise: params.plafondRemise ? params.plafondRemise : null,
        minPanier: params.minPanier,
        dateDebut: params.dateDebut,
        dateFin: params.dateFin,
        quotaTotal: params.quotaTotal ? params.quotaTotal : null,
      },
    });
    return { ok: true };
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, code: "DEJA_EXISTANT" };
    }
    console.error("[code-promo] création échouée:", erreur);
    return { ok: false, code: "ERREUR" };
  }
}

/**
 * Active ou désactive un code, sans toucher à ses dates.
 *
 * Les utilisations déjà consenties ne sont PAS remises en cause : les
 * commandes concernées ont figé leur remise, et réécrire l'histoire d'une
 * commande payée n'est jamais la bonne réponse à un code mal calibré.
 */
export async function basculerCodePromo(id: string): Promise<void> {
  const code = await prisma.codePromo.findUnique({
    where: { id },
    select: { actif: true },
  });
  if (!code) return;
  await prisma.codePromo.update({
    where: { id },
    data: { actif: !code.actif },
  });
}
