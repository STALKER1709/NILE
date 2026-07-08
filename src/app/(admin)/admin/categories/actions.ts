"use server";

import { redirect } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import { categorieSchema } from "@/validators/categorie";
import { creerCategorie } from "@/modules/catalogue/categories";

export async function creerCategorieAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");

  const parsed = categorieSchema.safeParse({
    nom: formData.get("nom"),
    parentId: formData.get("parentId"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/admin/categories?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await creerCategorie(parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "PARENT_INTROUVABLE"
        ? "Catégorie parente introuvable."
        : "Une erreur est survenue.";
    redirect(`/admin/categories?erreur=${encodeURIComponent(msg)}`);
  }

  redirect("/admin/categories?ok=cree");
}
