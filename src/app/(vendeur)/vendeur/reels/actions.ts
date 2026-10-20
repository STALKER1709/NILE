"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigerVendeur } from "@/modules/auth/access";
import { publicationSchema } from "@/validators/publication";
import type { TicketUpload } from "@/modules/stockage/StorageProvider";
import {
  demanderUploadPublication,
  confirmerUploadPublication,
  creerPublication,
  supprimerPublication,
  abandonnerUploads,
} from "@/modules/reels/reels";
import { messageErreurPublication } from "@/modules/reels/reels-core";

/**
 * Actions du composeur de publications (« Reels »).
 *
 * Deux temporées distinctes :
 *  - l'UPLOAD est un échange de données (ticket → envoi → confirmation) :
 *    ces actions RENVOIENT un résultat, elles ne redirigent pas ;
 *  - la CRÉATION suit la convention du projet : redirect + message en
 *    searchParams, la page affiche l'état.
 */

/** Étape 1 : obtenir un ticket d'envoi (le serveur valide la forme annoncée). */
export async function demanderUploadAction(input: {
  typeMime: string;
  tailleOctets: number;
  dureeSecondes?: number;
}): Promise<{ ok: boolean; ticket?: TicketUpload; code?: string }> {
  const { vendeur } = await exigerVendeur();
  // Un vendeur non validé n'a pas encore le droit de publier : on bloque
  // l'envoi avant même qu'un fichier n'atteigne le stockage.
  if (vendeur.statutValidation !== "VALIDE") {
    return { ok: false, code: "BOUTIQUE_NON_VALIDEE" };
  }
  const res = await demanderUploadPublication(vendeur.id, input);
  if (!res.ok) return { ok: false, code: res.code };
  return { ok: true, ticket: res.ticket };
}

/** Étape 3 : confirmer la réception et récupérer la forme stockée. */
export async function confirmerUploadAction(input: {
  chemin: string;
  typeMime: string;
}): Promise<{
  ok: boolean;
  chemin?: string;
  url?: string;
  type?: "IMAGE" | "VIDEO";
  code?: string;
}> {
  const { vendeur } = await exigerVendeur();
  const res = await confirmerUploadPublication(vendeur.id, input);
  if (!res.ok) return { ok: false, code: res.code };
  return {
    ok: true,
    chemin: res.chemin,
    url: res.url,
    type: res.type,
  };
}

function messageEchec(code: string): string {
  if (code === "CHEMIN_INVALIDE" || code === "MEDIA_ABSENT") {
    return "Un fichier n'a pas pu être retrouvé : réessayez l'envoi.";
  }
  if (code === "PRODUITS_INVALIDES") {
    return "Un des produits tagués n'est pas en ligne dans votre boutique.";
  }
  if (code === "ERREUR") {
    return "La publication n'a pas pu être enregistrée. Réessayez.";
  }
  return messageErreurPublication(code);
}

/**
 * Étape finale : créer la publication (médias déjà envoyés et confirmés).
 *
 * RENVOIE un résultat au lieu de rediriger en erreur : une erreur en cours de
 * route re-initialiserait le composeur et coûterait à chaque vendeur de
 * re-téléverser ses vidéos (data chère). La redirection ne survient qu'au
 * succès, depuis le navigateur.
 */
export async function creerPublicationAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { vendeur } = await exigerVendeur();
  if (vendeur.statutValidation !== "VALIDE") {
    return {
      ok: false,
      message: "Votre boutique doit être validée avant de publier des Reels.",
    };
  }

  // Le navigateur sérialise les tableaux en JSON dans des champs cachés :
  // c'est la forme classique d'un formulaire multi-médias côté serveur.
  const lireJSON = (cle: string): unknown => {
    const brut = String(formData.get(cle) ?? "");
    try {
      return JSON.parse(brut);
    } catch {
      return null;
    }
  };

  const parsed = publicationSchema.safeParse({
    texte: formData.get("texte") ?? "",
    medias: lireJSON("medias"),
    produitIds: lireJSON("produitIds"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    return { ok: false, message: msg };
  }

  const res = await creerPublication(vendeur.id, parsed.data);
  if (!res.ok) {
    return { ok: false, message: messageEchec(res.code) };
  }

  revalidatePath("/vendeur/reels");
  revalidatePath(`/boutique/${vendeur.id}`);
  return { ok: true };
}

/**
 * Nettoyage best-effort d'envois retirés du composeur avant création.
 * Un échec est journalisé côté serveur mais ne bloque jamais le vendeur :
 * un fichier orphelin est un souci de fidélisation, pas d'intégrité.
 */
export async function supprimerUploadAction(input: {
  chemins: string[];
}): Promise<{ ok: boolean }> {
  const { vendeur } = await exigerVendeur();
  return abandonnerUploads(vendeur.id, input.chemins.filter(Boolean));
}

/** Suppression d'une de ses publications (depuis la liste vendeur). */
export async function supprimerPublicationAction(
  formData: FormData,
): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const publicationId = String(formData.get("publicationId") ?? "");
  const res = await supprimerPublication(vendeur.id, publicationId);
  if (!res.ok) {
    redirect(
      `/vendeur/reels?erreur=${encodeURIComponent("Publication introuvable.")}`,
    );
  }
  revalidatePath("/vendeur/reels");
  redirect("/vendeur/reels?ok=supprimee");
}
