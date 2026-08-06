"use server";

import { revalidatePath } from "next/cache";
import { exigerRole } from "@/modules/auth/access";
import { declarerAxe, retirerAxe } from "@/modules/catalogue/axes";

/**
 * Déclare un axe de déclinaison sur une catégorie.
 *
 * Réservé à l'administrateur : ces référentiels décident de ce que TOUS les
 * vendeurs pourront saisir, et de ce que les acheteurs pourront choisir.
 */
export async function declarerAxeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const categorieId = String(formData.get("categorieId") ?? "");
  const rang = Number(formData.get("rang") ?? 0);
  if (!categorieId || (rang !== 1 && rang !== 2)) return;

  await declarerAxe({
    categorieId,
    rang,
    libelle: String(formData.get("libelle") ?? ""),
    valeursBrutes: String(formData.get("valeurs") ?? ""),
  });
  revalidatePath("/admin/categories");
}

export async function retirerAxeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const categorieId = String(formData.get("categorieId") ?? "");
  const rang = Number(formData.get("rang") ?? 0);
  if (!categorieId || (rang !== 1 && rang !== 2)) return;

  await retirerAxe(categorieId, rang);
  revalidatePath("/admin/categories");
}
