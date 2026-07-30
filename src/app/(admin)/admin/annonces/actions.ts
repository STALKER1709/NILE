"use server";

import { redirect } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import {
  creerAnnonce,
  basculerEpingleAnnonce,
  supprimerAnnonce,
} from "@/modules/annonce/annonce";
import { annonceSchema } from "@/validators/annonce";

export async function creerAnnonceAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");

  const parsed = annonceSchema.safeParse({
    titre: formData.get("titre"),
    contenu: formData.get("contenu"),
    epinglee: formData.get("epinglee") === "on",
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/admin/annonces?erreur=${encodeURIComponent(msg)}`);
  }

  await creerAnnonce(parsed.data);
  redirect("/admin/annonces?ok=creee");
}

export async function basculerEpingleAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const annonceId = String(formData.get("annonceId") ?? "");
  const epinglee = formData.get("epinglee") === "true";
  await basculerEpingleAnnonce(annonceId, epinglee);
  redirect("/admin/annonces?ok=maj");
}

export async function supprimerAnnonceAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const annonceId = String(formData.get("annonceId") ?? "");
  await supprimerAnnonce(annonceId);
  redirect("/admin/annonces?ok=supprimee");
}
