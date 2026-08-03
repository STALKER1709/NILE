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
import type { ModeConfirmationLivraison } from "@prisma/client";
import {
  peutAffecterTransporteur,
  peutExpedier,
  peutLivrer,
  peutRefuser,
  peutConfirmerReception,
} from "@/modules/livraison/livraison-core";
import { verifierCodeReception } from "@/modules/livraison/reception-core";

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
  // Cette étape ne prévenait personne : l'acheteur voyait « Préparation »
  // dans sa frise sans jamais recevoir le moindre message.
  await notifierStatutCommande(commandeId, "EN_PREPARATION");
  await notifierCommandeWhatsApp(commandeId, "EN_PREPARATION");
  await notifierPushStatutAcheteur(commandeId, "EN_PREPARATION");
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

/**
 * Marque la commande livrée, en consignant COMMENT la réception a été
 * attestée. Il n'existe plus de passage à LIVREE sans preuve : soit le code
 * de l'acheteur a été fourni (SCAN/MANUEL), soit un administrateur a forcé
 * la remise en motivant (ADMIN).
 *
 * Ce point est devenu financièrement sensible : le calcul des reversements
 * ne compte que les commandes LIVREE et PAYEE, donc franchir cette étape,
 * c'est rendre le vendeur payable.
 *
 * N'est pas exportée : on y entre par `remettreParCode` ou par
 * `forcerLivraison`, jamais directement.
 */
async function appliquerLivraison(
  commandeId: string,
  confirmation: { mode: ModeConfirmationLivraison; motif?: string },
): Promise<{ ok: true } | { ok: false; code: "INTROUVABLE" | "ETAT_INVALIDE" }> {
  const commande = await chargerCommande(commandeId);
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (!peutLivrer(commande.statutCommande)) {
    return { ok: false, code: "ETAT_INVALIDE" };
  }

  const maintenant = new Date();
  // En paiement à la livraison, la remise du colis EST le paiement : le
  // client règle en espèces au livreur, en main propre. Marquer la commande
  // payée dans le même geste évite qu'elle reste indéfiniment « en attente de
  // paiement » aux yeux de l'acheteur, et que le chiffre d'affaires ignore
  // ces ventes. Le cash est consigné comme collecté PAR LA BOUTIQUE : il ne
  // remonte pas à NILE, il n'y a donc rien à réconcilier ensuite.
  const estCOD = commande.modePaiement === "COD";

  // Filtré sur EXPEDIEE : deux scans concurrents ne peuvent pas appliquer la
  // livraison deux fois, ni déclencher deux fois les notifications.
  const applique = await prisma.$transaction(async (tx) => {
    const maj = await tx.commande.updateMany({
      where: { id: commandeId, statutCommande: "EXPEDIEE" },
      data: {
        statutCommande: "LIVREE",
        ...(estCOD ? { statutPaiement: "PAYE" as const } : {}),
      },
    });
    if (maj.count === 0) return false;
    await tx.livraison.update({
      where: { commandeId },
      data: {
        statut: "LIVREE",
        dateLivraison: maintenant,
        // L'attestation n'est portée que par une preuve VENANT de l'acheteur
        // (son code, scanné ou dicté). Un forçage administrateur fait avancer
        // la commande sans que l'acheteur ait rien attesté : le champ reste
        // vide, sinon la trace mentirait — et c'est précisément sur ces
        // commandes que le rappel de confirmation garde un sens.
        confirmationAcheteur: confirmation.mode === "ADMIN" ? null : maintenant,
        modeConfirmation: confirmation.mode,
        forcageMotif: confirmation.motif ?? null,
        ...(estCOD
          ? { statutCash: "COLLECTE" as const, montantCashCollecte: commande.total }
          : {}),
      },
    });
    return true;
  });
  if (!applique) return { ok: false, code: "ETAT_INVALIDE" };

  await notifierStatutCommande(commandeId, "LIVREE");
  await notifierCommandeWhatsApp(commandeId, "LIVREE");
  await notifierPushStatutAcheteur(commandeId, "LIVREE");
  return { ok: true };
}

export type ResultatRemise =
  | { ok: true }
  | {
      ok: false;
      code: "INTROUVABLE" | "ETAT_INVALIDE" | "CODE_INVALIDE" | "MAUVAISE_COMMANDE";
    };

/**
 * Remise chez le client : le livreur fournit le code affiché sur le téléphone
 * de l'acheteur, scanné (SCAN) ou dicté puis saisi (MANUEL).
 *
 * `numeroAttendu` provient du QR : s'il ne correspond pas à la commande
 * ouverte, on refuse plutôt que de valider la mauvaise livraison — un livreur
 * qui porte plusieurs colis scannerait sinon le mauvais client sans le voir.
 */
export async function remettreParCode(
  commandeId: string,
  code: string,
  mode: "SCAN" | "MANUEL",
  numeroAttendu?: string,
): Promise<ResultatRemise> {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    select: {
      numero: true,
      statutCommande: true,
      livraison: { select: { secretReception: true } },
    },
  });
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };
  if (numeroAttendu && numeroAttendu !== commande.numero) {
    return { ok: false, code: "MAUVAISE_COMMANDE" };
  }
  if (!peutLivrer(commande.statutCommande)) return { ok: false, code: "ETAT_INVALIDE" };

  // Pas de secret => l'acheteur n'a jamais affiché son code : rien à valider.
  const secret = commande.livraison.secretReception;
  if (!secret || !verifierCodeReception(secret, code, new Date())) {
    return { ok: false, code: "CODE_INVALIDE" };
  }

  const res = await appliquerLivraison(commandeId, { mode });
  return res.ok ? { ok: true } : { ok: false, code: res.code };
}

/**
 * Filet de sécurité : un administrateur constate la livraison sans code
 * (acheteur sans smartphone, téléphone déchargé, aucun réseau sur place).
 * Le motif est obligatoire et conservé — ces remises n'ont pas la valeur
 * probante d'un code, elles doivent rester identifiables.
 */
export async function forcerLivraison(
  commandeId: string,
  motif: string,
): Promise<ResultatLivraison> {
  const propre = motif.trim();
  if (propre.length < 5) return { ok: false, code: "ETAT_INVALIDE" };
  return appliquerLivraison(commandeId, { mode: "ADMIN", motif: propre });
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
