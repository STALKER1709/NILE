"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigerVendeur } from "@/modules/auth/access";

export async function enregistrerVitrineAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const localisationPublique = String(formData.get("localisationPublique") ?? "").trim().slice(0, 160);
  const telephonePublic = String(formData.get("telephonePublic") ?? "").trim().slice(0, 30);
  const whatsappPublic = String(formData.get("whatsappPublic") ?? "").replace(/\\D/g, "").slice(0, 20);
  const emailPublic = String(formData.get("emailPublic") ?? "").trim().slice(0, 160);
  const afficherCoordonnees = formData.get("afficherCoordonnees") === "on";

  if (telephonePublic && !/^[+0-9() .-]{8,30}$/.test(telephonePublic)) {
    redirect("/vendeur/boutique?erreur=Téléphone%20invalide");
  }
  if (emailPublic && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailPublic)) {
    redirect("/vendeur/boutique?erreur=Adresse%20e-mail%20invalide");
  }

  await prisma.vendeur.update({
    where: { id: vendeur.id },
    data: {
      localisationPublique: localisationPublique || null,
      telephonePublic: telephonePublic || null,
      whatsappPublic: whatsappPublic || null,
      emailPublic: emailPublic || null,
      afficherCoordonnees,
    },
  });
  redirect("/vendeur/boutique?ok=1");
}
