"use server";

import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { ajoutPanierSchema, majQuantiteSchema } from "@/validators/commande";
import {
  ajouterAuPanier,
  retirerUneUnite,
  modifierQuantite,
  retirerLigne,
  compterArticlesPanier,
} from "@/modules/commande/panier";

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

/** Ajoute 1 unité au panier SANS quitter la page (compteur sur la carte). */
export async function incrementerPanierAction(
  produitId: string,
): Promise<EtatBoutonPanier> {
  const utilisateur = await exigerConnexion();

  const parsed = ajoutPanierSchema.safeParse({ produitId, quantite: 1 });
  if (!parsed.success) return { ok: false, message: "Produit invalide." };

  const res = await ajouterAuPanier(utilisateur.id, parsed.data.produitId, 1);
  if (!res.ok) return { ok: false, message: messagePanier(res.code) };
  const totalArticles = await compterArticlesPanier(utilisateur.id);
  return { ok: true, quantite: res.quantite, totalArticles };
}

/** Retire 1 unité du panier SANS quitter la page (compteur sur la carte). */
export async function decrementerPanierAction(
  produitId: string,
): Promise<EtatBoutonPanier> {
  const utilisateur = await exigerConnexion();
  if (!produitId) return { ok: false, message: "Produit invalide." };

  const res = await retirerUneUnite(utilisateur.id, produitId);
  if (!res.ok) return { ok: false, message: messagePanier(res.code) };
  const totalArticles = await compterArticlesPanier(utilisateur.id);
  return { ok: true, quantite: res.quantite, totalArticles };
}

export async function modifierQuantiteAction(
  formData: FormData,
): Promise<void> {
  const utilisateur = await exigerConnexion();

  const parsed = majQuantiteSchema.safeParse({
    ligneId: formData.get("ligneId"),
    quantite: formData.get("quantite"),
  });
  if (!parsed.success) {
    redirect("/panier?erreur=Quantit%C3%A9%20invalide.");
  }

  const res = await modifierQuantite(
    utilisateur.id,
    parsed.data.ligneId,
    parsed.data.quantite,
  );
  if (!res.ok) {
    redirect(`/panier?erreur=${encodeURIComponent(messagePanier(res.code))}`);
  }
  redirect("/panier");
}

export async function retirerLigneAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const ligneId = String(formData.get("ligneId") ?? "");
  await retirerLigne(utilisateur.id, ligneId);
  redirect("/panier");
}
