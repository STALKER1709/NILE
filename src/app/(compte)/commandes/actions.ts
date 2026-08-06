"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { exigerConnexion } from "@/modules/auth/access";
import {
  annulerCommandeAcheteur,
  reprendrePaiement,
} from "@/modules/commande/commande";
import { racheterCommande } from "@/modules/commande/rachat";
import { confirmerReceptionAcheteur } from "@/modules/livraison/livraison";
import { paiementSansRedirection } from "@/modules/paiement";
import { rafraichirPaiementCommande } from "@/modules/paiement/suivi";
import { estOperateurValide } from "@/modules/paiement/hrskills/hrskills-core";

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

  // Même exigence qu'à la commande : les fournisseurs qui débitent directement
  // le portefeuille refusent une demande sans opérateur. Sans cette reprise du
  // choix, la relance échouait à tous les coups.
  let operateur: string | undefined;
  if (paiementSansRedirection()) {
    const choix = String(formData.get("operateur") ?? "");
    if (!estOperateurValide(choix)) {
      redirect(
        `/commandes/${commandeId}?erreur=${encodeURIComponent(
          "Choisissez votre opérateur Mobile Money (MTN ou Orange).",
        )}`,
      );
    }
    operateur = choix;
  }

  const res = await reprendrePaiement(utilisateur.id, commandeId, {
    urlRetour: `${base}/commandes`,
    urlNotification: `${base}/api/paiement/callback`,
    email: utilisateur.email,
    telephone: utilisateur.telephone,
    nom: utilisateur.nom,
    operateur,
  });
  if (!res.ok) {
    redirect(`/commandes/${commandeId}?erreur=Paiement%20indisponible.`);
  }
  // Sans page de paiement, le client valide sur son téléphone : on le laisse
  // sur le suivi de commande, où l'avancement se met à jour tout seul.
  redirect(res.urlPaiement ?? `/commandes/${commandeId}?ok=paiement_en_cours`);
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

/**
 * Demande au fournisseur où en est le paiement d'une commande, et rafraîchit
 * la page si le statut a basculé.
 *
 * Appelée en boucle par l'écran d'attente tant que le paiement Mobile Money
 * n'est pas tranché — le webhook peut ne jamais arriver. L'identité vient de
 * la session serveur : `commandeId` seul ne donne accès à rien.
 */
export async function rafraichirPaiementAction(
  commandeId: string,
): Promise<{ termine: boolean }> {
  const utilisateur = await exigerConnexion();
  const resultat = await rafraichirPaiementCommande(utilisateur.id, commandeId);
  // Commande introuvable (ou pas la sienne) : inutile d'insister.
  if (!resultat.ok) return { termine: true };

  const termine = resultat.statutPaiement !== "EN_ATTENTE";
  // Ne revalide que lorsqu'il y a du nouveau : recharger la page toutes les
  // 10 s pour rien coûterait de la data mobile à l'acheteur.
  if (termine) revalidatePath(`/commandes/${commandeId}`);
  return { termine };
}
