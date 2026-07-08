"use server";

import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { ajoutPanierSchema, majQuantiteSchema } from "@/validators/commande";
import {
  ajouterAuPanier,
  modifierQuantite,
  retirerLigne,
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

export async function ajouterAuPanierAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();
  const slug = String(formData.get("slug") ?? "");

  const parsed = ajoutPanierSchema.safeParse({
    produitId: formData.get("produitId"),
    quantite: formData.get("quantite"),
  });
  if (!parsed.success) {
    redirect(`/produit/${slug}?erreur=Quantit%C3%A9%20invalide.`);
  }

  const res = await ajouterAuPanier(
    utilisateur.id,
    parsed.data.produitId,
    parsed.data.quantite,
  );
  if (!res.ok) {
    redirect(
      `/produit/${slug}?erreur=${encodeURIComponent(messagePanier(res.code))}`,
    );
  }
  redirect("/panier?ok=ajoute");
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
