"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { exigerConnexion } from "@/modules/auth/access";
import {
  annulerCommandeAcheteur,
  reprendrePaiement,
} from "@/modules/commande/commande";

async function urlDeBase(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function reprendrePaiementAction(
  formData: FormData,
): Promise<void> {
  const utilisateur = await exigerConnexion();
  const commandeId = String(formData.get("commandeId") ?? "");
  const base = await urlDeBase();

  const res = await reprendrePaiement(utilisateur.id, commandeId, {
    urlRetour: `${base}/commandes`,
    urlNotification: `${base}/api/paiement/callback`,
    email: utilisateur.email,
    telephone: utilisateur.telephone,
    nom: utilisateur.nom,
  });
  if (!res.ok) {
    redirect(`/commandes/${commandeId}?erreur=Paiement%20indisponible.`);
  }
  redirect(res.urlPaiement);
}

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
