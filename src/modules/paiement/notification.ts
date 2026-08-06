import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/modules/paiement";
import type { ContexteNotification } from "@/modules/paiement/PaymentProvider";
import { notifierCommandeConfirmee } from "@/modules/email/notifications";
import { notifierCommandeWhatsApp } from "@/modules/whatsapp/notifications";
import {
  notifierPushNouvelleCommande,
  notifierPushStatutAcheteur,
} from "@/modules/push/push";
import { restituerStockTx } from "@/modules/commande/stock";

export type ResultatTraitement =
  | { ok: true; statut: "PAYE" | "ECHOUE" | "DEJA_TRAITE" }
  | { ok: false; raison: string };

/**
 * Traite une notification de paiement (callback serveur vérifié).
 * SEUL point qui marque une commande « payée ». Idempotent : une notification
 * reçue plusieurs fois ne produit qu'un seul effet.
 *
 * Succès -> commande CONFIRMEE + paiement PAYE.
 * Échec  -> paiement ECHOUE + commande libérée (ANNULEE) et stock restitué.
 */
export async function traiterNotificationPaiement(
  corps: Record<string, string>,
  contexte?: ContexteNotification,
): Promise<ResultatTraitement> {
  const verif = await getPaymentProvider().verifierNotification(corps, contexte);
  if (!verif.ok) return { ok: false, raison: verif.raison };

  return conclurePaiement(verif.data.reference, verif.data.statut, corps);
}

/**
 * Applique un statut de paiement DÉJÀ ÉTABLI à la commande correspondante.
 *
 * Extrait de `traiterNotificationPaiement` pour être partagé avec la relecture
 * de statut (`modules/paiement/suivi`) : que la vérité vienne d'un webhook
 * signé ou d'une interrogation du fournisseur à notre initiative, la commande
 * doit basculer exactement de la même façon. Deux chemins d'écriture
 * divergents sur de l'argent, c'est deux comportements à maintenir et un jour
 * deux vérités.
 *
 * L'appelant est responsable d'avoir ÉTABLI ce statut — signature vérifiée, ou
 * lecture directe chez le fournisseur. Cette fonction ne fait confiance à
 * personne d'autre qu'à lui.
 *
 * Idempotent : appelée plusieurs fois pour un même paiement, elle ne produit
 * qu'un seul effet, et n'envoie les notifications qu'une fois.
 */
export async function conclurePaiement(
  reference: string,
  statut: "PAYE" | "ECHOUE",
  charge: Record<string, string>,
): Promise<ResultatTraitement> {
  // La référence est soit notre identifiant de paiement, soit celle attribuée
  // par le fournisseur (conservée dans `Paiement.reference` à l'initiation).
  // On tente les deux : selon le fournisseur, le webhook ne renvoie pas
  // forcément notre propre identifiant.
  const paiement =
    (await prisma.paiement.findUnique({
      where: { id: reference },
      include: { commande: { include: { lignes: true } } },
    })) ??
    (await prisma.paiement.findUnique({
      where: { reference },
      include: { commande: { include: { lignes: true } } },
    }));
  if (!paiement) return { ok: false, raison: "PAIEMENT_INTROUVABLE" };
  // Les écritures suivantes ciblent notre identifiant, jamais celui du
  // fournisseur : `reference` peut être l'un ou l'autre.
  const paiementId = paiement.id;

  // Idempotence : un paiement déjà finalisé n'est pas retraité.
  if (paiement.statut === "PAYE") return { ok: true, statut: "DEJA_TRAITE" };
  if (paiement.statut === "ECHOUE" && statut === "ECHOUE") {
    return { ok: true, statut: "DEJA_TRAITE" };
  }

  if (statut === "PAYE") {
    // `confirmee` = cette notification a réellement fait basculer la commande
    // (guard idempotent) : on n'envoie les emails qu'une seule fois.
    const confirmee = await prisma.$transaction(async (tx) => {
      await tx.paiement.updateMany({
        where: { id: paiementId, statut: { not: "PAYE" } },
        data: { statut: "PAYE", payload: charge },
      });
      // Ne confirme la commande que si elle attendait encore le paiement.
      const maj = await tx.commande.updateMany({
        where: { id: paiement.commandeId, statutCommande: "EN_ATTENTE" },
        data: { statutPaiement: "PAYE", statutCommande: "CONFIRMEE" },
      });
      return maj.count === 1;
    });
    if (confirmee) {
      // Email acheteur + vendeurs, WhatsApp et push acheteur, push
      // vendeurs/admin (n'échouent jamais le callback).
      await notifierCommandeConfirmee(paiement.commandeId);
      await notifierCommandeWhatsApp(paiement.commandeId, "CONFIRMEE");
      await notifierPushStatutAcheteur(paiement.commandeId, "CONFIRMEE");
      await notifierPushNouvelleCommande(paiement.commandeId);
    }
    return { ok: true, statut: "PAYE" };
  }

  // Échec : libère la commande (si encore en attente) et restitue le stock.
  await prisma.$transaction(async (tx) => {
    await tx.paiement.updateMany({
      where: { id: paiementId, statut: { not: "PAYE" } },
      data: { statut: "ECHOUE", payload: charge },
    });
    const maj = await tx.commande.updateMany({
      where: { id: paiement.commandeId, statutCommande: "EN_ATTENTE" },
      data: { statutCommande: "ANNULEE", statutPaiement: "ECHOUE" },
    });
    if (maj.count === 1) {
      await restituerStockTx(tx, paiement.commande.lignes);
      // Le code promo est rendu avec le stock : l'acheteur ne doit pas l'avoir
      // brûlé sur une commande dont le paiement a échoué. Supprimer la ligne
      // libère aussi une place dans le quota de la campagne — rien n'a été
      // vendu.
      await tx.utilisationCodePromo.deleteMany({
        where: { commandeId: paiement.commandeId },
      });
    }
  });
  return { ok: true, statut: "ECHOUE" };
}
