import { prisma } from "@/lib/db";
import { notifierStatutCommande } from "@/modules/email/notifications";
import { notifierCommandeWhatsApp } from "@/modules/whatsapp/notifications";
import { notifierPushStatutAcheteur } from "@/modules/push/push";
import { getStorageProvider } from "@/modules/stockage";
import {
  TYPES_IMAGE_ACCEPTES,
  TAILLE_IMAGE_MAX_OCTETS,
  type FichierAEnregistrer,
} from "@/modules/stockage/StorageProvider";
import {
  peutAffecterTransporteur,
  peutExpedier,
  peutLivrer,
  peutRefuser,
  peutConfirmerReception,
} from "@/modules/livraison/livraison-core";

export type ResultatLivraison =
  | { ok: true }
  | {
      ok: false;
      code: "INTROUVABLE" | "ETAT_INVALIDE" | "NON_PAYE" | "IMAGE_INVALIDE";
    };

async function chargerCommande(commandeId: string) {
  return prisma.commande.findUnique({
    where: { id: commandeId },
    include: { lignes: true, livraison: true },
  });
}

/** Affecte un transporteur et passe la commande en préparation. */
export async function affecterTransporteur(
  commandeId: string,
  transporteur: string,
): Promise<ResultatLivraison> {
  const commande = await chargerCommande(commandeId);
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (!peutAffecterTransporteur(commande.statutCommande)) {
    return { ok: false, code: "ETAT_INVALIDE" };
  }
  await prisma.$transaction([
    prisma.commande.update({
      where: { id: commandeId },
      data: { statutCommande: "EN_PREPARATION" },
    }),
    prisma.livraison.update({
      where: { commandeId },
      data: { transporteur, statut: "AFFECTEE", dateAffectation: new Date() },
    }),
  ]);
  return { ok: true };
}

/** Marque la commande expédiée (interdit si Monetbil non payé). */
export async function marquerExpediee(
  commandeId: string,
): Promise<ResultatLivraison> {
  const commande = await chargerCommande(commandeId);
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (!peutExpedier(commande.statutCommande)) {
    return { ok: false, code: "ETAT_INVALIDE" };
  }
  if (
    commande.modePaiement === "MONETBIL" &&
    commande.statutPaiement !== "PAYE"
  ) {
    return { ok: false, code: "NON_PAYE" };
  }
  await prisma.$transaction([
    prisma.commande.update({
      where: { id: commandeId },
      data: { statutCommande: "EXPEDIEE" },
    }),
    prisma.livraison.update({
      where: { commandeId },
      data: { statut: "EN_TRANSIT" },
    }),
  ]);
  // Prévient l'acheteur (essentiel en COD : préparer le paiement au livreur).
  await notifierStatutCommande(commandeId, "EXPEDIEE");
  await notifierCommandeWhatsApp(commandeId, "EXPEDIEE");
  await notifierPushStatutAcheteur(commandeId, "EXPEDIEE");
  return { ok: true };
}

/** Marque la commande livrée. */
export async function marquerLivree(
  commandeId: string,
): Promise<ResultatLivraison> {
  const commande = await chargerCommande(commandeId);
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (!peutLivrer(commande.statutCommande)) {
    return { ok: false, code: "ETAT_INVALIDE" };
  }
  await prisma.$transaction([
    prisma.commande.update({
      where: { id: commandeId },
      data: { statutCommande: "LIVREE" },
    }),
    prisma.livraison.update({
      where: { commandeId },
      data: { statut: "LIVREE", dateLivraison: new Date() },
    }),
  ]);
  await notifierStatutCommande(commandeId, "LIVREE");
  await notifierCommandeWhatsApp(commandeId, "LIVREE");
  await notifierPushStatutAcheteur(commandeId, "LIVREE");
  return { ok: true };
}

export type ResultatConfirmation =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "ETAT_INVALIDE" | "DEJA_CONFIRMEE" };

/**
 * Attestation de réception par l'ACHETEUR lui-même.
 *
 * Purement déclarative : elle ne conditionne ni le reversement au vendeur
 * (qui reste dû dès que la commande est LIVREE et PAYEE), ni le droit de
 * laisser un avis. Elle sert de trace de confiance côté acheteur.
 *
 * La commande est retrouvée par (id, acheteurId) : un identifiant fourni par
 * le client ne peut pas confirmer la commande d'un tiers.
 */
export async function confirmerReceptionAcheteur(
  utilisateurId: string,
  commandeId: string,
): Promise<ResultatConfirmation> {
  const commande = await prisma.commande.findFirst({
    where: { id: commandeId, acheteurId: utilisateurId },
    select: { statutCommande: true, livraison: { select: { confirmationAcheteur: true } } },
  });
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (commande.livraison.confirmationAcheteur !== null) {
    return { ok: false, code: "DEJA_CONFIRMEE" };
  }
  if (!peutConfirmerReception(commande.statutCommande, commande.livraison.confirmationAcheteur)) {
    return { ok: false, code: "ETAT_INVALIDE" };
  }

  // Filtré sur confirmationAcheteur=null : deux clics concurrents ne peuvent
  // pas écraser la première attestation.
  const { count } = await prisma.livraison.updateMany({
    where: { commandeId, confirmationAcheteur: null },
    data: { confirmationAcheteur: new Date() },
  });
  return count > 0 ? { ok: true } : { ok: false, code: "DEJA_CONFIRMEE" };
}

/** Enregistre une preuve de livraison (image). */
export async function ajouterPreuve(
  commandeId: string,
  fichier: FichierAEnregistrer,
): Promise<ResultatLivraison> {
  const livraison = await prisma.livraison.findUnique({ where: { commandeId } });
  if (!livraison) return { ok: false, code: "INTROUVABLE" };
  if (!TYPES_IMAGE_ACCEPTES.includes(fichier.typeMime as never)) {
    return { ok: false, code: "IMAGE_INVALIDE" };
  }
  if (fichier.contenu.byteLength > TAILLE_IMAGE_MAX_OCTETS) {
    return { ok: false, code: "IMAGE_INVALIDE" };
  }
  const storage = getStorageProvider();
  const enregistre = await storage.enregistrer(fichier);
  // Remplace l'ancienne preuve si elle existait.
  if (livraison.preuveUrl) {
    const ancienChemin = livraison.preuveUrl.split("/").pop();
    if (ancienChemin) {
      await storage.supprimer(ancienChemin).catch(() => undefined);
    }
  }
  await prisma.livraison.update({
    where: { commandeId },
    data: { preuveUrl: enregistre.url },
  });
  return { ok: true };
}

/**
 * Refus à la livraison : commande REFUSEE, stock restitué, et incrément du
 * compteur anti-fraude COD de l'acheteur. Atomique et idempotent.
 */
export async function refuserLivraison(
  commandeId: string,
): Promise<ResultatLivraison> {
  const commande = await chargerCommande(commandeId);
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (!peutRefuser(commande.statutCommande)) {
    return { ok: false, code: "ETAT_INVALIDE" };
  }

  await prisma.$transaction(async (tx) => {
    // Transition atomique : n'agit que si toujours dans un état « refusable ».
    const maj = await tx.commande.updateMany({
      where: {
        id: commandeId,
        statutCommande: { in: ["EN_PREPARATION", "EXPEDIEE"] },
      },
      data: { statutCommande: "REFUSEE" },
    });
    if (maj.count === 0) return; // déjà traité

    for (const ligne of commande.lignes) {
      await tx.produit.update({
        where: { id: ligne.produitId },
        data: { stock: { increment: ligne.quantite } },
      });
    }
    await tx.livraison.update({
      where: { commandeId },
      data: { statut: "RETOURNEE" },
    });
    // Compteur anti-fraude : commande non aboutie pour cet acheteur.
    await tx.utilisateur.update({
      where: { id: commande.acheteurId },
      data: { nbCommandesNonAbouties: { increment: 1 } },
    });
  });
  return { ok: true };
}
