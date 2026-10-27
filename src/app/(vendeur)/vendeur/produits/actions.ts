"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { produitSchema, statutPubliableSchema } from "@/validators/produit";
import {
  creerProduit,
  mettreAJourProduit,
  changerStatutProduit,
  supprimerProduit,
  restaurerProduit,
  ajouterImageProduit,
  supprimerImageProduit,
} from "@/modules/catalogue/produits";
import {
  TYPES_IMAGE_ACCEPTES,
  TAILLE_IMAGE_MAX_OCTETS,
  type FichierAEnregistrer,
} from "@/modules/stockage/StorageProvider";

const NOMBRE_MAX_IMAGES_PRODUIT = 3;
const POIDS_MAX_TOTAL_IMAGES = 3.5 * 1024 * 1024;

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
    marque: formData.get("marque") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/vendeur/produits/nouveau?erreur=${encodeURIComponent(msg)}`);
  }

  // Valider tous les fichiers AVANT de créer la fiche : une sélection invalide
  // ne doit pas laisser un brouillon incomplet sans explication.
  const fichiers = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fichiers.length > NOMBRE_MAX_IMAGES_PRODUIT) {
    redirect(`/vendeur/produits/nouveau?erreur=${encodeURIComponent("Ajoutez 3 images maximum à la création. Vous pourrez compléter la galerie après.")}`);
  }
  const poidsTotal = fichiers.reduce((total, fichier) => total + fichier.size, 0);
  if (poidsTotal > POIDS_MAX_TOTAL_IMAGES) {
    redirect(`/vendeur/produits/nouveau?erreur=${encodeURIComponent("Les images sélectionnées dépassent 3,5 Mo au total. Réduisez leur taille ou ajoutez-les en plusieurs fois après la création.")}`);
  }
  const fichierInvalide = fichiers.find((f) =>
    !TYPES_IMAGE_ACCEPTES.includes(f.type as (typeof TYPES_IMAGE_ACCEPTES)[number]) ||
    f.size > TAILLE_IMAGE_MAX_OCTETS
  );
  if (fichierInvalide) {
    const raison = !TYPES_IMAGE_ACCEPTES.includes(fichierInvalide.type as (typeof TYPES_IMAGE_ACCEPTES)[number])
      ? "Format d'image non accepté (JPEG, PNG ou WEBP seulement)."
      : "Chaque image doit peser 2 Mo maximum.";
    redirect(`/vendeur/produits/nouveau?erreur=${encodeURIComponent(raison)}`);
  }

  const produit = await creerProduit(vendeur.id, parsed.data);
  for (const f of fichiers) {
    const fichier = await fichierDepuisFile(f);
    if (!fichier) continue;
    const res = await ajouterImageProduit(vendeur.id, produit.id, fichier);
    if (!res.ok) {
      redirect(
        `/vendeur/produits/${produit.id}?erreur=${encodeURIComponent(messageErreurImage(res.code))}`,
      );
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
    marque: formData.get("marque") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(
      `/vendeur/produits/${produitId}?erreur=${encodeURIComponent(msg)}`,
    );
  }

  const res = await mettreAJourProduit(vendeur.id, produitId, parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "SUPPRIME"
        ? "Ce produit est dans la corbeille : restaurez-le avant de le modifier."
        : res.code === "DECLINAISONS_INCOMPATIBLES"
          ? "Cette catégorie ne prend pas en charge les déclinaisons actuelles. Choisissez une catégorie compatible ou adaptez d'abord les déclinaisons."
          : "Produit introuvable.";
    redirect(`/vendeur/produits/${produitId}?erreur=${encodeURIComponent(msg)}`);
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
        : res.code === "SUPPRIME"
          ? "Ce produit est dans la corbeille : restaurez-le avant de changer son statut."
          : res.code === "IMAGE_REQUISE"
            ? "Ajoutez au moins une image avant de publier ce produit."
            : res.code === "STOCK_INDISPONIBLE"
              ? "Ajoutez du stock à au moins une déclinaison active avant de publier."
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
  const res = await supprimerProduit(vendeur.id, produitId);
  if (!res.ok) {
    redirect(`/vendeur/produits/${produitId}?erreur=${encodeURIComponent("Produit introuvable.")}`);
  }
  redirect("/vendeur/produits?ok=supprime");
}

/** Restaure un produit depuis la corbeille (retour en brouillon). */
export async function restaurerProduitAction(
  formData: FormData,
): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const produitId = String(formData.get("produitId") ?? "");
  const res = await restaurerProduit(vendeur.id, produitId);
  if (!res.ok) {
    redirect(`/vendeur/produits?corbeille=1&erreur=${encodeURIComponent("Produit introuvable.")}`);
  }
  redirect(`/vendeur/produits/${produitId}?ok=restaure`);
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
