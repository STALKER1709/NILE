"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/modules/auth/access";
import { marquerCashRemis } from "@/modules/paiement/reconciliation";

/**
 * Enregistre la remise à NILE du cash d'une commande payée à la livraison.
 *
 * Réservée à l'administrateur, vérifié côté serveur : c'est une écriture sur
 * un mouvement d'argent réel, et la seule trace attestant qu'un livreur ne
 * détient plus les espèces.
 */
export async function marquerCashRemisAction(
  formData: FormData,
): Promise<void> {
  await exigerRole("ADMIN");
  const commandeId = String(formData.get("commandeId") ?? "");
  if (!commandeId) return;

  const res = await marquerCashRemis(commandeId);
  if (!res.ok) {
    // Aucune de ces situations n'est une erreur du serveur : la page est
    // simplement rechargée, l'état réel y sera visible.
    console.warn("[cash] remise non enregistrée:", commandeId, res.code);
  }
  revalidatePath("/admin/reconciliation");
}
