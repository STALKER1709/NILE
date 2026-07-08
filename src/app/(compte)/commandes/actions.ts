"use server";

import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { annulerCommandeAcheteur } from "@/modules/commande/commande";

export async function annulerCommandeAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const commandeId = String(formData.get("commandeId") ?? "");

  const res = await annulerCommandeAcheteur(utilisateur.id, commandeId);
  if (!res.ok) {
    const msg =
      res.code === "NON_ANNULABLE"
        ? "Cette commande ne peut plus être annulée."
        : "Commande introuvable.";
    redirect(`/commandes/${commandeId}?erreur=${encodeURIComponent(msg)}`);
  }
  redirect(`/commandes/${commandeId}?ok=annulee`);
}
