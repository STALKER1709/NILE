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

  // Le cœur apparaît sur plusieurs écrans : la page d'où part le clic, la
  // liste elle-même, et le compteur du compte. Revalider la page courante
  // seule laisserait les autres afficher l'état d'avant.
  //
  // `"layout"` et non `"page"` : le compteur de favoris vit dans l'en-tête,
  // donc dans la mise en page racine. Ne revalider que la page laisserait la
  // pastille annoncer le compte d'avant le clic jusqu'à la navigation
  // suivante.
  //
  // Le chemin est vérifié : il vient du navigateur, et revalider une route
  // arbitraire sur simple demande d'un client n'a pas à être possible.
  const chemin = String(formData.get("retour") ?? "");
  if (chemin.startsWith("/") && !chemin.startsWith("//")) {
    revalidatePath(chemin, "layout");
  }
  revalidatePath("/favoris", "layout");
}
