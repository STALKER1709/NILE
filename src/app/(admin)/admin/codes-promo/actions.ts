"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigerRole } from "@/modules/auth/access";
import { codePromoFormSchema } from "@/validators/code-promo";
import {
  creerCodePromo,
  basculerCodePromo,
} from "@/modules/promotion/code-promo";

/**
 * Création d'un code promo. Réservée à l'administrateur : un code est de
 * l'argent retiré de la marge de NILE, jamais un réglage anodin.
 */
export async function creerCodePromoAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");

  const parsed = codePromoFormSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    valeur: formData.get("valeur"),
    plafondRemise: formData.get("plafondRemise") || undefined,
    minPanier: formData.get("minPanier") || 0,
    dateDebut: formData.get("dateDebut"),
    dateFin: formData.get("dateFin"),
    quotaTotal: formData.get("quotaTotal") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Formulaire invalide.";
    redirect(`/admin/codes-promo?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await creerCodePromo(parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "DEJA_EXISTANT"
        ? "Un code portant ce nom existe déjà."
        : "La création a échoué. Réessaie.";
    redirect(`/admin/codes-promo?erreur=${encodeURIComponent(msg)}`);
  }
  redirect("/admin/codes-promo?ok=1");
}

/** Active ou coupe un code, sans toucher aux remises déjà consenties. */
export async function basculerCodePromoAction(
  formData: FormData,
): Promise<void> {
  await exigerRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await basculerCodePromo(id);
  revalidatePath("/admin/codes-promo");
}
