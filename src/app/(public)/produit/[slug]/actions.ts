"use server";

import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { avisSchema } from "@/validators/avis";
import { creerAvis } from "@/modules/avis/avis";

export async function creerAvisAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const slug = String(formData.get("slug") ?? "");

  const parsed = avisSchema.safeParse({
    produitId: formData.get("produitId"),
    note: formData.get("note"),
    commentaire: formData.get("commentaire") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Avis invalide.";
    redirect(`/produit/${slug}?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await creerAvis(utilisateur.id, parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "NON_ACHETE"
        ? "Vous pouvez laisser un avis uniquement après avoir reçu ce produit."
        : res.code === "DEJA_AVIS"
          ? "Vous avez déjà donné un avis sur ce produit."
          : "Une erreur est survenue.";
    redirect(`/produit/${slug}?erreur=${encodeURIComponent(msg)}`);
  }
  redirect(`/produit/${slug}?ok=avis`);
}
