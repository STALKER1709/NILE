"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerRole } from "@/modules/auth/access";
import { traiterDemandeReversement } from "@/modules/reversement/reversement";
import { executerDemandeReversement } from "@/modules/reversement/decaissement";

const executionSchema = z.object({
  reversementId: z.string().min(1),
  operateur: z.enum(["MTN", "ORANGE"]),
});

/** Lance le Cash-Out ou relit le statut d'un transfert déjà envoyé. */
export async function executerDemandeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const parsed = executionSchema.safeParse({
    reversementId: formData.get("reversementId"),
    operateur: formData.get("operateur"),
  });
  if (!parsed.success) {
    redirect("/admin/reversements?erreur=" + encodeURIComponent("Choisis un opérateur Mobile Money valide."));
  }
  const resultat = await executerDemandeReversement(
    parsed.data.reversementId,
    parsed.data.operateur,
  );
  if (!resultat.ok) {
    redirect("/admin/reversements?erreur=" + encodeURIComponent(resultat.message));
  }
  redirect(
    resultat.statut === "PAYE"
      ? "/admin/reversements?ok=paye"
      : "/admin/reversements?ok=en-cours",
  );
}

const rejetSchema = z.object({
  reversementId: z.string().min(1),
  decision: z.literal("REJETE"),
  commentaire: z.string().trim().max(200, "Motif trop long.").optional(),
});

/** Refuse une demande AVANT tout ordre de décaissement. */
export async function traiterDemandeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const parsed = rejetSchema.safeParse({
    reversementId: formData.get("reversementId"),
    decision: formData.get("decision"),
    commentaire: formData.get("commentaire") || undefined,
  });
  if (!parsed.success) {
    redirect("/admin/reversements?erreur=" + encodeURIComponent("Données invalides."));
  }
  const res = await traiterDemandeReversement(
    parsed.data.reversementId,
    "REJETE",
    parsed.data.commentaire,
  );
  if (!res.ok) {
    const msg = res.code === "DEJA_TRAITE"
      ? "Cette demande a déjà été prise en charge."
      : "Demande introuvable ou non modifiable.";
    redirect("/admin/reversements?erreur=" + encodeURIComponent(msg));
  }
  redirect("/admin/reversements?ok=rejete");
}
