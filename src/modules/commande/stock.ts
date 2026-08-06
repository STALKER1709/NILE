import type { Prisma } from "@prisma/client";

/**
 * Restitution du stock d'une commande qui n'aboutit pas.
 *
 * Le stock est porté par la DÉCLINAISON, jamais par le produit : c'est elle
 * qu'on décrémente à la commande, c'est elle qu'il faut recréditer. Créditer
 * `Produit.stock` — le champ historique — laisserait la déclinaison
 * définitivement amputée, et le vendeur verrait son stock fondre à chaque
 * paiement échoué sans jamais comprendre pourquoi.
 *
 * Rassemblé ici plutôt que recopié dans chacun des quatre chemins d'annulation
 * (paiement qui ne démarre pas, paiement échoué, annulation par l'acheteur,
 * refus à la livraison) : c'est exactement le genre de règle qui diverge quand
 * elle est écrite quatre fois.
 */
export async function restituerStockTx(
  tx: Prisma.TransactionClient,
  lignes: { varianteId: string | null; quantite: number }[],
): Promise<void> {
  for (const ligne of lignes) {
    // Les commandes antérieures aux déclinaisons n'en désignent aucune : rien
    // à recréditer plutôt qu'une variante devinée.
    if (!ligne.varianteId) continue;
    await tx.varianteProduit.update({
      where: { id: ligne.varianteId },
      data: { stock: { increment: ligne.quantite } },
    });
  }
}
