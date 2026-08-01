"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { exigerConnexion } from "@/modules/auth/access";
import {
  annulerCommandeAcheteur,
  reprendrePaiement,
} from "@/modules/commande/commande";
import { racheterCommande } from "@/modules/commande/rachat";
import { confirmerReceptionAcheteur } from "@/modules/livraison/livraison";

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

/**
 * Remet au panier les articles d'une ancienne commande. Redirige vers le
 * panier, où l'acheteur repart du parcours de commande habituel.
 */
export async function racheterCommandeAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const commandeId = String(formData.get("commandeId") ?? "");

  const res = await racheterCommande(utilisateur.id, commandeId);
  if (!res.ok) {
    const msg =
      res.code === "RIEN_DISPONIBLE"
        ? (res.avertissement ??
          "Aucun article de cette commande n'est disponible actuellement.")
        : "Commande introuvable.";
    redirect(`/commandes/${commandeId}?erreur=${encodeURIComponent(msg)}`);
  }
  // Le détail de ce qui n'a pas pu être repris est affiché sur le panier,
  // là où l'acheteur voit justement le résultat.
  const params = new URLSearchParams({ ok: "rachat" });
  if (res.avertissement) params.set("avertissement", res.avertissement);
  redirect(`/panier?${params.toString()}`);
}

/** Attestation de réception par l'acheteur (paiement à la livraison). */
export async function confirmerReceptionAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const commandeId = String(formData.get("commandeId") ?? "");

  const res = await confirmerReceptionAcheteur(utilisateur.id, commandeId);
  if (!res.ok) {
    const msg =
      res.code === "DEJA_CONFIRMEE"
        ? "Vous avez déjà confirmé la réception de cette commande."
        : res.code === "ETAT_INVALIDE"
          ? "Cette commande n'est pas encore marquée livrée."
          : "Commande introuvable.";
    redirect(`/commandes/${commandeId}?erreur=${encodeURIComponent(msg)}`);
  }
  redirect(`/commandes/${commandeId}?ok=reception`);
}
