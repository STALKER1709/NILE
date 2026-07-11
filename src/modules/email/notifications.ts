import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/modules/email";
import {
  construireEmailAcheteur,
  construireEmailVendeur,
  construireEmailStatut,
  vendeursDeLaCommande,
  type CommandePourEmail,
  type StatutNotifiable,
} from "@/modules/email/notifications-core";

/**
 * Notifications email de commande. Règle métier :
 *  - COD      -> notifiée à la CRÉATION (la commande est confirmée d'office).
 *  - MONETBIL -> notifiée à la CONFIRMATION DU PAIEMENT (callback vérifié) :
 *    le vendeur ne doit pas préparer une commande non payée.
 * Un échec d'envoi est journalisé mais ne fait JAMAIS échouer la commande.
 */
export async function notifierCommandeConfirmee(
  commandeId: string,
): Promise<void> {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        lignes: true,
        acheteur: { select: { nom: true, email: true } },
      },
    });
    if (!commande) return;

    const donnees: CommandePourEmail = {
      numero: commande.numero,
      total: commande.total,
      modePaiement: commande.modePaiement,
      lignes: commande.lignes.map((l) => ({
        titreProduit: l.titreProduit,
        quantite: l.quantite,
        sousTotal: l.sousTotal,
        vendeurId: l.vendeurId,
      })),
      destNom: commande.destNom,
      destTelephone: commande.destTelephone,
      ville: commande.ville,
      quartier: commande.quartier,
      reperes: commande.reperes,
    };

    const provider = getEmailProvider();
    const envois: Promise<void>[] = [];

    // 1) Acheteur.
    const pourAcheteur = construireEmailAcheteur(donnees, commande.acheteur.nom);
    envois.push(
      provider.envoyer({
        a: commande.acheteur.email,
        nomDestinataire: commande.acheteur.nom,
        ...pourAcheteur,
      }),
    );

    // 2) Chaque vendeur concerné (ses lignes uniquement).
    const vendeurs = await prisma.vendeur.findMany({
      where: { id: { in: vendeursDeLaCommande(donnees.lignes) } },
      select: {
        id: true,
        nomBoutique: true,
        utilisateur: { select: { email: true } },
      },
    });
    for (const v of vendeurs) {
      const pourVendeur = construireEmailVendeur(donnees, v.id, v.nomBoutique);
      if (pourVendeur) {
        envois.push(
          provider.envoyer({
            a: v.utilisateur.email,
            nomDestinataire: v.nomBoutique,
            ...pourVendeur,
          }),
        );
      }
    }

    // Envois en parallèle ; chaque échec est journalisé sans bloquer les autres.
    const resultats = await Promise.allSettled(envois);
    for (const r of resultats) {
      if (r.status === "rejected") {
        console.error("[email] envoi échoué:", r.reason);
      }
    }
  } catch (erreur) {
    console.error("[email] notification de commande échouée:", erreur);
  }
}

/**
 * Prévient l'ACHETEUR d'un changement d'étape (expédiée, livrée).
 * Un échec d'envoi est journalisé et ne fait JAMAIS échouer la transition.
 */
export async function notifierStatutCommande(
  commandeId: string,
  statut: StatutNotifiable,
): Promise<void> {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        acheteur: { select: { nom: true, email: true } },
        livraison: { select: { transporteur: true } },
      },
    });
    if (!commande) return;

    const contenu = construireEmailStatut(
      {
        numero: commande.numero,
        total: commande.total,
        modePaiement: commande.modePaiement,
      },
      statut,
      commande.acheteur.nom,
      commande.livraison?.transporteur,
    );
    await getEmailProvider().envoyer({
      a: commande.acheteur.email,
      nomDestinataire: commande.acheteur.nom,
      ...contenu,
    });
  } catch (erreur) {
    console.error("[email] notification de statut échouée:", erreur);
  }
}
