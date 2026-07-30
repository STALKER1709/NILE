"use server";

import { redirect } from "next/navigation";
import { exigerConnexion, exigerVendeur } from "@/modules/auth/access";
import { getAuthProvider } from "@/modules/auth";
import {
  boutiqueSchema,
  infosPaiementSchema,
  nouveauMotDePasseSchema,
  profilSchema,
} from "@/validators/auth";
import {
  mettreAJourBoutique,
  mettreAJourInfosPaiement,
  mettreAJourProfil,
} from "@/modules/compte/profil";

/** Renvoie vers le profil avec un message d'erreur affichable. */
function echec(message: string): never {
  redirect(`/compte/profil?erreur=${encodeURIComponent(message)}`);
}

export async function mettreAJourProfilAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();

  const parsed = profilSchema.safeParse({
    nom: formData.get("nom"),
    telephone: formData.get("telephone"),
  });
  if (!parsed.success) echec(parsed.error.issues[0]?.message ?? "Profil invalide.");

  await mettreAJourProfil(utilisateur.id, parsed.data);
  redirect("/compte/profil?ok=profil");
}

export async function mettreAJourBoutiqueAction(formData: FormData): Promise<void> {
  // exigerVendeur vérifie le rôle côté serveur : un acheteur ne peut pas
  // atteindre cette action, même en forgeant la requête.
  const { utilisateur } = await exigerVendeur();

  const parsed = boutiqueSchema.safeParse({
    nomBoutique: formData.get("nomBoutique"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) echec(parsed.error.issues[0]?.message ?? "Boutique invalide.");

  const res = await mettreAJourBoutique(utilisateur.id, parsed.data);
  if (!res.ok) echec("Boutique introuvable.");
  redirect("/compte/profil?ok=boutique");
}

export async function mettreAJourInfosPaiementAction(
  formData: FormData,
): Promise<void> {
  const { utilisateur } = await exigerVendeur();

  const parsed = infosPaiementSchema.safeParse({
    momoMtn: formData.get("momoMtn") || undefined,
    momoOrange: formData.get("momoOrange") || undefined,
    titulaire: formData.get("titulaire") || undefined,
  });
  if (!parsed.success) {
    echec(parsed.error.issues[0]?.message ?? "Coordonnées de reversement invalides.");
  }

  const res = await mettreAJourInfosPaiement(utilisateur.id, parsed.data);
  if (!res.ok) echec("Boutique introuvable.");
  redirect("/compte/profil?ok=paiement");
}

export async function changerMotDePasseAction(formData: FormData): Promise<void> {
  // Le changement porte sur la session courante ; exiger la connexion garantit
  // qu'il y en a une.
  await exigerConnexion();

  const parsed = nouveauMotDePasseSchema.safeParse({
    motDePasse: formData.get("motDePasse"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    echec(parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
  }

  const res = await getAuthProvider().changerMotDePasse(parsed.data.motDePasse);
  if (!res.ok) echec("Le mot de passe n'a pas pu être modifié. Réessayez.");
  redirect("/compte/profil?ok=mdp");
}
