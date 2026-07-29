"use server";

import { redirect } from "next/navigation";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { ajoutPanierSchema } from "@/validators/commande";
import {
  ajouterAuPanier,
  retirerUneUnite,
  retirerProduit,
  viderPanier,
  compterArticlesPanier,
} from "@/modules/commande/panier";
import {
  ajouterInvite,
  retirerInvite,
  retirerToutInvite,
  viderInvite,
  compterArticlesInvite,
} from "@/modules/commande/panier-invite";

function messagePanier(code: string): string {
  switch (code) {
    case "INDISPONIBLE":
      return "Ce produit n'est plus disponible.";
    case "STOCK_INSUFFISANT":
      return "Stock insuffisant pour cette quantité.";
    default:
      return "Produit introuvable.";
  }
}

/** Résultat renvoyé aux compteurs « supermarché » des cartes produit. */
export type EtatBoutonPanier =
  | { ok: true; quantite: number; totalArticles: number }
  | { ok: false; message: string };

/**
 * Ajoute 1 unité au panier SANS quitter la page (compteur sur la carte).
 * Fonctionne aussi pour un VISITEUR non connecté (panier invité en cookie) :
 * l'inscription n'est exigée qu'au moment de passer la commande.
 */
export async function incrementerPanierAction(
  produitId: string,
): Promise<EtatBoutonPanier> {
  const parsed = ajoutPanierSchema.safeParse({ produitId, quantite: 1 });
  if (!parsed.success) return { ok: false, message: "Produit invalide." };

  const utilisateur = await getUtilisateurCourant();
  if (!utilisateur) {
    const res = await ajouterInvite(parsed.data.produitId);
    if (!res.ok) return { ok: false, message: messagePanier(res.code) };
    return { ok: true, quantite: res.quantite, totalArticles: await compterArticlesInvite() };
  }

  const res = await ajouterAuPanier(utilisateur.id, parsed.data.produitId, 1);
  if (!res.ok) return { ok: false, message: messagePanier(res.code) };
  const totalArticles = await compterArticlesPanier(utilisateur.id);
  return { ok: true, quantite: res.quantite, totalArticles };
}

/** Retire 1 unité du panier SANS quitter la page (invités inclus). */
export async function decrementerPanierAction(
  produitId: string,
): Promise<EtatBoutonPanier> {
  if (!produitId) return { ok: false, message: "Produit invalide." };

  const utilisateur = await getUtilisateurCourant();
  if (!utilisateur) {
    const res = await retirerInvite(produitId);
    if (!res.ok) return { ok: false, message: messagePanier(res.code) };
    return { ok: true, quantite: res.quantite, totalArticles: await compterArticlesInvite() };
  }

  const res = await retirerUneUnite(utilisateur.id, produitId);
  if (!res.ok) return { ok: false, message: messagePanier(res.code) };
  const totalArticles = await compterArticlesPanier(utilisateur.id);
  return { ok: true, quantite: res.quantite, totalArticles };
}

/**
 * Vide entièrement le panier. Fonctionne pour un visiteur (cookie) comme pour
 * un utilisateur connecté (lignes en base) : aucune connexion n'est exigée,
 * sinon un visiteur ne pourrait pas vider le sien.
 */
export async function viderPanierAction(): Promise<void> {
  const utilisateur = await getUtilisateurCourant();
  if (utilisateur) {
    await viderPanier(utilisateur.id);
  } else {
    await viderInvite();
  }
  redirect("/panier?ok=vide");
}

/**
 * Retire complètement un article du panier (bouton « Retirer »), pour un
 * visiteur comme pour un utilisateur connecté. Aucune connexion n'est
 * exigée, sinon un visiteur ne pourrait pas retirer un article du sien.
 */
export async function retirerArticleAction(formData: FormData): Promise<void> {
  const produitId = String(formData.get("produitId") ?? "");
  if (!produitId) redirect("/panier?erreur=Article%20introuvable.");

  const utilisateur = await getUtilisateurCourant();
  if (utilisateur) {
    await retirerProduit(utilisateur.id, produitId);
  } else {
    await retirerToutInvite(produitId);
  }
  redirect("/panier?ok=retire");
}
