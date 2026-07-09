"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { produitSchema, statutPubliableSchema } from "@/validators/produit";
import {
  creerProduit,
  mettreAJourProduit,
  changerStatutProduit,
  supprimerProduit,
  ajouterImageProduit,
  supprimerImageProduit,
} from "@/modules/catalogue/produits";
import type { FichierAEnregistrer } from "@/modules/stockage/StorageProvider";

/** Convertit un File de formulaire en fichier à enregistrer (null si vide). */
async function fichierDepuisFile(
  valeur: FormDataEntryValue | null,
): Promise<FichierAEnregistrer | null> {
  if (!(valeur instanceof File) || valeur.size === 0) return null;
  const contenu = Buffer.from(await valeur.arrayBuffer());
  return { nomOriginal: valeur.name, typeMime: valeur.type, contenu };
}

function messageErreurImage(code: string): string {
  switch (code) {
    case "TYPE_INVALIDE":
      return "Format d'image non accepté (JPEG, PNG ou WEBP seulement).";
    case "TROP_LOURDE":
      return "Image trop lourde (2 Mo maximum).";
    case "STOCKAGE_INDISPONIBLE":
      return "Le stockage d'images n'est pas encore configuré. Le produit a été créé sans image.";
    default:
      return "Image introuvable.";
  }
}

export async function creerProduitAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();

  const parsed = produitSchema.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description"),
    prix: formData.get("prix"),
    stock: formData.get("stock"),
    categorieId: formData.get("categorieId"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/vendeur/produits/nouveau?erreur=${encodeURIComponent(msg)}`);
  }

  const produit = await creerProduit(vendeur.id, parsed.data);

  // Images éventuelles jointes à la création.
  const fichiers = formData.getAll("images");
  for (const f of fichiers) {
    const fichier = await fichierDepuisFile(f);
    if (fichier) {
      const res = await ajouterImageProduit(vendeur.id, produit.id, fichier);
      if (!res.ok) {
        redirect(
          `/vendeur/produits/${produit.id}?erreur=${encodeURIComponent(messageErreurImage(res.code))}`,
        );
      }
    }
  }

  redirect(`/vendeur/produits/${produit.id}?ok=cree`);
}

export async function mettreAJourProduitAction(
  formData: FormData,
): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");

  const parsed = produitSchema.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description"),
    prix: formData.get("prix"),
    stock: formData.get("stock"),
    categorieId: formData.get("categorieId"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(
      `/vendeur/produits/${produitId}?erreur=${encodeURIComponent(msg)}`,
    );
  }

  const res = await mettreAJourProduit(vendeur.id, produitId, parsed.data);
  if (!res.ok) {
    redirect("/vendeur/produits?erreur=Produit%20introuvable.");
  }
  redirect(`/vendeur/produits/${produitId}?ok=maj`);
}

export async function changerStatutProduitAction(
  formData: FormData,
): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");

  const parsed = statutPubliableSchema.safeParse(formData.get("statut"));
  if (!parsed.success) {
    redirect(`/vendeur/produits/${produitId}?erreur=Statut%20invalide.`);
  }

  const res = await changerStatutProduit(vendeur.id, produitId, parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "BOUTIQUE_NON_VALIDEE"
        ? "Votre boutique doit être validée par un administrateur avant de publier."
        : "Produit introuvable.";
    redirect(`/vendeur/produits/${produitId}?erreur=${encodeURIComponent(msg)}`);
  }
  redirect(`/vendeur/produits/${produitId}?ok=statut`);
}

export async function supprimerProduitAction(
  formData: FormData,
): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  await supprimerProduit(vendeur.id, produitId);
  redirect("/vendeur/produits?ok=supprime");
}

export async function ajouterImageAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");

  const fichier = await fichierDepuisFile(formData.get("image"));
  if (!fichier) {
    redirect(`/vendeur/produits/${produitId}?erreur=Aucune%20image%20fournie.`);
  }
  const res = await ajouterImageProduit(vendeur.id, produitId, fichier);
  if (!res.ok) {
    redirect(
      `/vendeur/produits/${produitId}?erreur=${encodeURIComponent(messageErreurImage(res.code))}`,
    );
  }
  redirect(`/vendeur/produits/${produitId}?ok=image`);
}

export async function supprimerImageAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  await supprimerImageProduit(vendeur.id, imageId);
  redirect(`/vendeur/produits/${produitId}?ok=image_supprimee`);
}
