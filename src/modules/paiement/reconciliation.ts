import { prisma } from "@/lib/db";

/**
 * Suivi des commandes payées à la livraison.
 *
 * LECTURE SEULE. Le cash COD ne transite plus par NILE : il est remis en
 * main propre au livreur de la boutique, et `appliquerLivraison` le consigne
 * comme collecté au moment même où le code de réception de l'acheteur est
 * validé. Il n'y a donc plus rien à « réconcilier » — ni cash à encaisser
 * côté plateforme, ni reversement à opérer dans l'autre sens.
 *
 * Les actions manuelles d'autrefois (marquer le cash collecté, puis reversé)
 * ont été retirées : la première marquait une commande « payée » AVANT toute
 * livraison, ce qui contournait la preuve de remise ; la seconde décrivait un
 * flux d'argent qui n'existe plus.
 */
export async function listerCommandesCOD() {
  return prisma.commande.findMany({
    where: { modePaiement: "COD" },
    orderBy: { dateCreation: "desc" },
    include: { livraison: true },
    take: 100,
  });
}
