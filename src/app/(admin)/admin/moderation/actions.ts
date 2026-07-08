"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerRole } from "@/modules/auth/access";
import { modererProduit } from "@/modules/admin/moderation";

const statutSchema = z.enum(["REJETE", "ACTIF", "INACTIF"]);

export async function modererProduitAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const produitId = String(formData.get("produitId") ?? "");
  const statut = statutSchema.catch("INACTIF").parse(formData.get("statut"));

  const res = await modererProduit(produitId, statut);
  redirect(
    res.ok
      ? "/admin/moderation?ok=1"
      : "/admin/moderation?erreur=Action%20impossible.",
  );
}
