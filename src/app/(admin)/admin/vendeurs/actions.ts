"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerRole } from "@/modules/auth/access";
import { changerStatutVendeur } from "@/modules/admin/vendeurs";

const statutSchema = z.enum(["EN_ATTENTE", "VALIDE", "REJETE", "SUSPENDU"]);

export async function changerStatutVendeurAction(
  formData: FormData,
): Promise<void> {
  await exigerRole("ADMIN");
  const vendeurId = String(formData.get("vendeurId") ?? "");
  const statut = statutSchema.catch("EN_ATTENTE").parse(formData.get("statut"));

  const res = await changerStatutVendeur(vendeurId, statut);
  redirect(
    res.ok
      ? "/admin/vendeurs?ok=1"
      : "/admin/vendeurs?erreur=Action%20impossible.",
  );
}
