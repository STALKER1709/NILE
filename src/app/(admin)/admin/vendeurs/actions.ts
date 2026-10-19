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

export async function validerKycAdminAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const vendeurId = String(formData.get("vendeurId") ?? "");
  const { validerKycAdmin } = await import("@/modules/kyc/kyc");

  const res = await validerKycAdmin(vendeurId);
  redirect(
    res.ok
      ? `/admin/vendeurs/${vendeurId}?ok=KYC%20valid%C3%A9%20avec%20succ%C3%A8s.`
      : `/admin/vendeurs/${vendeurId}?erreur=${encodeURIComponent(res.message)}`,
  );
}

export async function rejeterKycAdminAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const vendeurId = String(formData.get("vendeurId") ?? "");
  const motif = String(formData.get("motif") ?? "");
  const { rejeterKycAdmin } = await import("@/modules/kyc/kyc");

  const res = await rejeterKycAdmin(vendeurId, motif);
  redirect(
    res.ok
      ? `/admin/vendeurs/${vendeurId}?ok=Dossier%20KYC%20rejet%C3%A9.`
      : `/admin/vendeurs/${vendeurId}?erreur=${encodeURIComponent(res.message)}`,
  );
}
