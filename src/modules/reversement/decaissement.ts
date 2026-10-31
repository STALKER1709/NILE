import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { lireInfosPaiement } from "@/modules/compte/profil";
import { HrSkillsPayProvider } from "@/modules/paiement/hrskills/HrSkillsPayProvider";
import { normaliserNumeroHrSkills } from "@/modules/paiement/hrskills/hrskills-core";

export type ResultatDecaissement =
  | { ok: true; statut: "EN_COURS" | "PAYE"; referenceFournisseur?: string; frais?: number | null }
  | { ok: false; code: "INTROUVABLE" | "DEJA_TRAITE" | "VENDEUR_NON_VALIDE" | "FOURNISSEUR_INACTIF" | "NUMERO_ABSENT" | "OPERATEUR_INVALIDE" | "ERREUR_FOURNISSEUR"; message: string };

/**
 * Exécute ou réconcilie un reversement réservé.
 *
 * La ligne passe d'abord à EN_COURS sous verrou. L'UUID du reversement est
 * ensuite la clé d'idempotence HR-Skills : une relance après timeout renvoie
 * le même ordre au fournisseur, jamais un second paiement.
 */
export async function executerDemandeReversement(
  reversementId: string,
  operateurDemande: string,
): Promise<ResultatDecaissement> {
  const operateur = operateurDemande.trim().toUpperCase();
  if (operateur !== "MTN" && operateur !== "ORANGE") {
    return { ok: false, code: "OPERATEUR_INVALIDE", message: "Choisis MTN ou Orange Money." };
  }
  if (env.PAYMENT_PROVIDER !== "hrskills") {
    return { ok: false, code: "FOURNISSEUR_INACTIF", message: "Le fournisseur HR-Skills Pay n'est pas activé." };
  }

  let demande = await prisma.reversement.findUnique({
    where: { id: reversementId },
    include: {
      vendeur: {
        select: {
          statutValidation: true,
          kyc: { select: { statut: true } },
          infosPaiement: true,
          nomBoutique: true,
        },
      },
    },
  });
  if (!demande) return { ok: false, code: "INTROUVABLE", message: "Demande introuvable." };
  if (demande.statut !== "DEMANDE" && demande.statut !== "EN_COURS") {
    return { ok: false, code: "DEJA_TRAITE", message: "Cette demande a déjà été traitée." };
  }
  if (demande.vendeur.statutValidation !== "VALIDE" || demande.vendeur.kyc?.statut !== "VALIDE") {
    return { ok: false, code: "VENDEUR_NON_VALIDE", message: "La boutique et le KYC doivent être validés." };
  }

  const infos = lireInfosPaiement(demande.vendeur.infosPaiement);
  const telephone = operateur === "MTN" ? infos.momoMtn : infos.momoOrange;
  if (!telephone || !normaliserNumeroHrSkills(telephone)) {
    return { ok: false, code: "NUMERO_ABSENT", message: `Aucun numéro ${operateur} valide n'est enregistré pour cette boutique.` };
  }

  // Sérialise les décisions admin. Le montant reste réservé pendant tout EN_COURS.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Reversement" WHERE id = ${reversementId} FOR UPDATE`;
      const courant = await tx.reversement.findUnique({ where: { id: reversementId } });
      if (!courant || (courant.statut !== "DEMANDE" && courant.statut !== "EN_COURS")) {
        throw new Error("DEJA_TRAITE");
      }
      if (courant.operateur && courant.operateur !== operateur) {
        throw new Error("OPERATEUR_VERROUILLE");
      }
      if (courant.statut === "DEMANDE") {
        await tx.reversement.update({
          where: { id: reversementId },
          data: {
            statut: "EN_COURS",
            operateur,
            telephoneDestination: normaliserNumeroHrSkills(telephone)!,
            commentaire: null,
          },
        });
      }
    });
  } catch (erreur) {
    const code = erreur instanceof Error ? erreur.message : "";
    return {
      ok: false,
      code: code === "DEJA_TRAITE" ? "DEJA_TRAITE" : "OPERATEUR_INVALIDE",
      message: code === "OPERATEUR_VERROUILLE"
        ? "L'opérateur est déjà fixé pour cette demande. Ne change pas le bénéficiaire d'un transfert en cours."
        : "La demande a changé d'état. Recharge la page avant de réessayer.",
    };
  }

  demande = await prisma.reversement.findUnique({
    where: { id: reversementId },
    include: { vendeur: { select: { nomBoutique: true } } },
  });
  if (!demande || demande.statut !== "EN_COURS") {
    return { ok: false, code: "DEJA_TRAITE", message: "La demande n'est plus en cours." };
  }

  const provider = new HrSkillsPayProvider();
  try {
    let statut: string;
    let referenceFournisseur = demande.referenceFournisseur;
    let frais = demande.frais;

    if (referenceFournisseur) {
      const lecture = await provider.lireStatut(referenceFournisseur);
      if (!lecture.ok) {
        return { ok: true, statut: "EN_COURS", referenceFournisseur, frais };
      }
      statut = lecture.statut;
    } else {
      const resultat = await provider.decaisser({
        reference: demande.id,
        telephone: demande.telephoneDestination ?? telephone,
        operateur,
        montant: demande.montant,
        description: `Reversement NILE · ${demande.vendeur.nomBoutique}`,
      });
      statut = resultat.statut;
      referenceFournisseur = resultat.reference;
      frais = resultat.frais;
      await prisma.reversement.updateMany({
        where: { id: demande.id, statut: "EN_COURS" },
        data: { referenceFournisseur, frais },
      });
    }

    const final = statut.trim().toUpperCase();
    if (final === "SUCCESS") {
      await prisma.reversement.updateMany({
        where: { id: demande.id, statut: "EN_COURS" },
        data: { statut: "PAYE", dateTraitement: new Date(), commentaire: "Transfert confirmé par HR-Skills Pay." },
      });
      return { ok: true, statut: "PAYE", referenceFournisseur: referenceFournisseur ?? undefined, frais };
    }
    if (final === "FAILED" || final === "REJECTED" || final === "CANCELLED") {
      await prisma.reversement.updateMany({
        where: { id: demande.id, statut: "EN_COURS" },
        data: { statut: "REJETE", dateTraitement: new Date(), commentaire: `Transfert refusé par HR-Skills Pay (${final}).` },
      });
      return { ok: false, code: "ERREUR_FOURNISSEUR", message: `HR-Skills Pay a refusé le transfert (${final}). Le montant est libéré.` };
    }
    return { ok: true, statut: "EN_COURS", referenceFournisseur: referenceFournisseur ?? undefined, frais };
  } catch (erreur) {
    // Timeout/5xx : résultat potentiellement ambigu. Surtout ne pas libérer la
    // réservation ; la prochaine tentative réutilise la même Idempotency-Key.
    console.error("[reversement] HR-Skills payout à réconcilier:", erreur);
    return {
      ok: false,
      code: "ERREUR_FOURNISSEUR",
      message: "Résultat du transfert non confirmé. Le montant reste réservé ; relance la vérification, sans créer une nouvelle demande.",
    };
  }
}
