import webpush from "web-push";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  chargeNouvelleCommandeVendeur,
  chargeNouvelleCommandeAdmin,
  vendeursAvecTotaux,
  type ChargePush,
} from "@/modules/push/push-core";

/**
 * Envoi de notifications Web Push (VAPID, librairie standard web-push).
 * Inactif tant que les clés VAPID ne sont pas configurées : tout est alors
 * silencieusement ignoré (journalisé une fois). Un envoi qui échoue ne fait
 * JAMAIS échouer l'opération métier ; les abonnements expirés (HTTP 404/410)
 * sont purgés au fil de l'eau.
 */

let configure = false;
function pushActif(): boolean {
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  if (!configure) {
    webpush.setVapidDetails(
      env.NEXT_PUBLIC_SITE_URL,
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    configure = true;
  }
  return true;
}

/** Envoie une charge à TOUS les abonnements des utilisateurs donnés. */
export async function envoyerPushAUtilisateurs(
  utilisateurIds: string[],
  charge: ChargePush,
): Promise<void> {
  if (!pushActif() || utilisateurIds.length === 0) return;

  const abonnements = await prisma.abonnementPush.findMany({
    where: { utilisateurId: { in: utilisateurIds } },
  });
  if (abonnements.length === 0) return;

  const payload = JSON.stringify(charge);
  await Promise.allSettled(
    abonnements.map(async (ab) => {
      try {
        await webpush.sendNotification(
          { endpoint: ab.endpoint, keys: { p256dh: ab.p256dh, auth: ab.auth } },
          payload,
          { TTL: 24 * 60 * 60 },
        );
      } catch (erreur) {
        const statut = (erreur as { statusCode?: number }).statusCode;
        if (statut === 404 || statut === 410) {
          // Abonnement expiré / révoqué : on le purge.
          await prisma.abonnementPush
            .delete({ where: { id: ab.id } })
            .catch(() => undefined);
        } else {
          console.error("[push] envoi échoué:", statut ?? erreur);
        }
      }
    }),
  );
}

/**
 * Nouvelle commande confirmée : push aux VENDEURS concernés (leurs lignes)
 * et aux ADMINS. Appelé aux mêmes points que les emails (COD : création ;
 * Mobile Money : paiement vérifié).
 */
export async function notifierPushNouvelleCommande(
  commandeId: string,
): Promise<void> {
  try {
    if (!pushActif()) return;
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: { lignes: true },
    });
    if (!commande) return;

    const parVendeur = vendeursAvecTotaux(
      commande.lignes.map((l) => ({
        vendeurId: l.vendeurId,
        quantite: l.quantite,
        sousTotal: l.sousTotal,
      })),
    );

    // Vendeurs concernés -> leur compte utilisateur.
    const vendeurs = await prisma.vendeur.findMany({
      where: { id: { in: [...parVendeur.keys()] } },
      select: { id: true, utilisateurId: true },
    });
    const envois: Promise<void>[] = vendeurs.map((v) => {
      const totaux = parVendeur.get(v.id);
      if (!totaux) return Promise.resolve();
      return envoyerPushAUtilisateurs(
        [v.utilisateurId],
        chargeNouvelleCommandeVendeur({
          numero: commande.numero,
          nbArticles: totaux.nbArticles,
          totalVendeur: totaux.totalVendeur,
          modePaiement: commande.modePaiement,
        }),
      );
    });

    // Admins (vue globale).
    const admins = await prisma.utilisateur.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    envois.push(
      envoyerPushAUtilisateurs(
        admins.map((a) => a.id),
        chargeNouvelleCommandeAdmin({
          numero: commande.numero,
          total: commande.total,
          modePaiement: commande.modePaiement,
        }),
      ),
    );

    await Promise.allSettled(envois);
  } catch (erreur) {
    console.error("[push] notification de commande échouée:", erreur);
  }
}
