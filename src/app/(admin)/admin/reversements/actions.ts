"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerRole } from "@/modules/auth/access";
import {
  enregistrerReversement,
  traiterDemandeReversement,
} from "@/modules/reversement/reversement";

const reversementSchema = z.object({
  vendeurId: z.string().min(1),
  montant: z.coerce
    .number({ invalid_type_error: "Montant invalide." })
    .int("Montant invalide (FCFA entiers).")
    .positive("Le montant doit être positif."),
  commentaire: z.string().trim().max(200, "Commentaire trop long.").optional(),
});

export async function enregistrerReversementAction(
  formData: FormData,
): Promise<void> {
  await exigerRole("ADMIN");

  const parsed = reversementSchema.safeParse({
    vendeurId: formData.get("vendeurId"),
    montant: formData.get("montant"),
    commentaire: formData.get("commentaire") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/admin/reversements?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await enregistrerReversement(
    parsed.data.vendeurId,
    parsed.data.montant,
    parsed.data.commentaire,
  );
  if (!res.ok) {
    const msg =
      res.code === "SOLDE_INSUFFISANT"
        ? "Montant supérieur au solde dû à ce vendeur."
        : res.code === "MONTANT_INVALIDE"
          ? "Montant invalide."
          : "Vendeur introuvable.";
    redirect(`/admin/reversements?erreur=${encodeURIComponent(msg)}`);
  }
  redirect("/admin/reversements?ok=enregistre");
}

const traitementSchema = z.object({
  reversementId: z.string().min(1),
  decision: z.enum(["PAYE", "REJETE"]),
  commentaire: z.string().trim().max(200, "Commentaire trop long.").optional(),
});

/**
 * Traite une demande de versement émise par un vendeur : marque payée, ou
 * refuse en indiquant un motif.
 */
export async function traiterDemandeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");

  const parsed = traitementSchema.safeParse({
    reversementId: formData.get("reversementId"),
    decision: formData.get("decision"),
    commentaire: formData.get("commentaire") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/admin/reversements?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await traiterDemandeReversement(
    parsed.data.reversementId,
    parsed.data.decision,
    parsed.data.commentaire,
  );
  if (!res.ok) {
    const msg =
      res.code === "DEJA_TRAITE"
        ? "Cette demande a déjà été traitée."
        : "Demande introuvable.";
    redirect(`/admin/reversements?erreur=${encodeURIComponent(msg)}`);
  }
  redirect(
    `/admin/reversements?ok=${parsed.data.decision === "PAYE" ? "paye" : "rejete"}`,
  );
}
