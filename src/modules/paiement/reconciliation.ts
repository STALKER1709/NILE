import { prisma } from "@/lib/db";
import { decisionRemiseCash } from "@/modules/paiement/cash-core";

/**
 * Suivi du cash encaissé à la livraison (COD).
 *
 * Les livreurs sont fournis par NILE : les espèces remises par l'acheteur
 * remontent donc à la plateforme, qui en prélève sa commission et reverse le
 * reste au vendeur. Deux moments sont à distinguer, et c'est tout l'objet de
 * ce module :
 *   - à la validation du code de réception, `appliquerLivraison` consigne le
 *     cash comme COLLECTE : le livreur l'a en main ;
 *   - la remise effective à NILE est enregistrée ici (REVERSE).
 *
 * Entre les deux, l'argent est détenu par une personne et pas par la
 * plateforme. C'est exactement ce que ce suivi rend visible — et ce que le
 * calcul des reversements doit respecter : un vendeur n'est payable que sur
 * du cash effectivement remis.
 */

export async function listerCommandesCOD() {
  return prisma.commande.findMany({
    where: { modePaiement: "COD" },
    orderBy: { dateCreation: "desc" },
    include: { livraison: true },
    take: 100,
  });
}

export interface TotauxCash {
  /** FCFA encaissés par les livreurs et pas encore remis à NILE. */
  enMainLivreur: number;
  /** Nombre de commandes concernées. */
  nbEnAttente: number;
  /** FCFA effectivement remis à NILE. */
  remis: number;
}

/**
 * Combien d'argent les livreurs détiennent-ils en ce moment ?
 *
 * C'est le chiffre à surveiller : il mesure une exposition réelle, pas une
 * écriture comptable. Une somme qui gonfle sans être remise signale soit un
 * retard de remise, soit une perte.
 */
export async function totauxCash(): Promise<TotauxCash> {
  const [attente, remis] = await Promise.all([
    prisma.livraison.aggregate({
      where: { statutCash: "COLLECTE" },
      _sum: { montantCashCollecte: true },
      _count: true,
    }),
    prisma.livraison.aggregate({
      where: { statutCash: "REVERSE" },
      _sum: { montantCashCollecte: true },
    }),
  ]);
  return {
    enMainLivreur: attente._sum.montantCashCollecte ?? 0,
    nbEnAttente: attente._count,
    remis: remis._sum.montantCashCollecte ?? 0,
  };
}

export type ResultatRemiseCash =
  | { ok: true }
  | {
      ok: false;
      code: "INTROUVABLE" | "DEJA_REMIS" | "PAS_ENCAISSE" | "SANS_OBJET";
    };

/**
 * Enregistre la remise du cash d'une commande par le livreur à NILE.
 *
 * Idempotent : une commande déjà remise n'est pas réenregistrée — la
 * réenregistrer fausserait les totaux et, une fois les reversements branchés
 * dessus, pourrait payer un vendeur deux fois.
 */
export async function marquerCashRemis(
  commandeId: string,
): Promise<ResultatRemiseCash> {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { livraison: true },
  });
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };

  const decision = decisionRemiseCash({
    modePaiement: commande.modePaiement,
    statutCash: commande.livraison.statutCash,
  });
  if (decision !== "OK") return { ok: false, code: decision };

  // Filtré sur COLLECTE : deux enregistrements concurrents ne peuvent pas
  // marquer la même remise deux fois.
  const maj = await prisma.livraison.updateMany({
    where: { commandeId, statutCash: "COLLECTE" },
    data: { statutCash: "REVERSE", dateRemiseCash: new Date() },
  });
  if (maj.count === 0) return { ok: false, code: "DEJA_REMIS" };

  return { ok: true };
}
