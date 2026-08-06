"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigerVendeur } from "@/modules/auth/access";
import {
  ajouterVariante,
  majStockVariante,
  basculerVarianteActive,
  supprimerVariante,
  type ResultatVariante,
} from "@/modules/catalogue/variantes";

/**
 * Gestion des déclinaisons d'un produit par son vendeur.
 *
 * La propriété du produit est vérifiée dans le module, à partir du vendeur de
 * la session : un identifiant transmis par le navigateur ne peut jamais
 * toucher l'article d'une autre boutique.
 */
function message(res: Extract<ResultatVariante, { ok: false }>): string {
  switch (res.code) {
    case "COMBINAISON_INVALIDE":
      return "Cette combinaison ne correspond pas aux axes de la catégorie.";
    case "DEJA_EXISTANTE":
      return "Cette déclinaison existe déjà pour ce produit.";
    case "DERNIERE_DECLINAISON":
      return "Impossible de supprimer la dernière déclinaison : un produit sans déclinaison serait invendable. Retirez plutôt le produit de la vente.";
    default:
      return "Produit introuvable.";
  }
}

function retour(produitId: string, res: ResultatVariante): never {
  if (!res.ok) {
    redirect(
      `/vendeur/produits/${produitId}?erreur=${encodeURIComponent(message(res))}`,
    );
  }
  revalidatePath(`/vendeur/produits/${produitId}`);
  redirect(`/vendeur/produits/${produitId}?ok=declinaison`);
}

export async function ajouterVarianteAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  const res = await ajouterVariante(
    vendeur.id,
    produitId,
    String(formData.get("valeur1") ?? ""),
    String(formData.get("valeur2") ?? ""),
    Number(formData.get("stock") ?? 0),
  );
  retour(produitId, res);
}

export async function majStockVarianteAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  const res = await majStockVariante(
    vendeur.id,
    String(formData.get("varianteId") ?? ""),
    Number(formData.get("stock") ?? 0),
  );
  retour(produitId, res);
}

export async function basculerVarianteAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  const res = await basculerVarianteActive(
    vendeur.id,
    String(formData.get("varianteId") ?? ""),
  );
  retour(produitId, res);
}

export async function supprimerVarianteAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  const res = await supprimerVariante(
    vendeur.id,
    String(formData.get("varianteId") ?? ""),
  );
  retour(produitId, res);
}
