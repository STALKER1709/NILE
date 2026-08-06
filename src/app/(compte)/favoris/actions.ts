"use server";

import { revalidatePath } from "next/cache";
import { exigerConnexion } from "@/modules/auth/access";
import { basculerFavori } from "@/modules/catalogue/favoris";

/**
 * Ajoute ou retire un produit de la liste de souhaits.
 *
 * L'identité vient de la session : l'identifiant de produit transmis par le
 * navigateur ne peut toucher que les favoris de celui qui est connecté.
 */
export async function basculerFavoriAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const produitId = String(formData.get("produitId") ?? "");
  if (!produitId) return;

  await basculerFavori(utilisateur.id, produitId);

  // Le cœur apparaît sur plusieurs écrans : la fiche produit d'où part le
  // clic, la liste elle-même, et le compteur du compte. Revalider la page
  // courante seule laisserait les autres afficher l'état d'avant.
  const chemin = String(formData.get("retour") ?? "");
  if (chemin.startsWith("/")) revalidatePath(chemin);
  revalidatePath("/favoris");
}
