"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  inscriptionSchema,
  connexionSchema,
  emailSchema,
  nouveauMotDePasseSchema,
} from "@/validators/auth";
import {
  inscrireUtilisateur,
  connecterUtilisateur,
  deconnecterUtilisateur,
} from "@/modules/auth/service";
import { getAuthProvider } from "@/modules/auth";

export async function inscriptionAction(formData: FormData): Promise<void> {
  const brut = {
    nom: formData.get("nom"),
    email: formData.get("email"),
    telephone: formData.get("telephone"),
    motDePasse: formData.get("motDePasse"),
    role: formData.get("role"),
    nomBoutique: formData.get("nomBoutique") || undefined,
  };

  const parsed = inscriptionSchema.safeParse(brut);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/inscription?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await inscrireUtilisateur(parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "EMAIL_DEJA_UTILISE"
        ? "Cet email est déjà utilisé."
        : "Une erreur est survenue. Réessaie.";
    redirect(`/inscription?erreur=${encodeURIComponent(msg)}`);
  }

  redirect("/compte");
}

export async function connexionAction(formData: FormData): Promise<void> {
  const brut = {
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
  };

  const parsed = connexionSchema.safeParse(brut);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/connexion?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await connecterUtilisateur(parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "SUSPENDU"
        ? "Ce compte est suspendu. Contacte le support."
        : res.code === "IDENTIFIANTS_INVALIDES"
          ? "Email ou mot de passe incorrect."
          : "Une erreur est survenue. Réessaie.";
    redirect(`/connexion?erreur=${encodeURIComponent(msg)}`);
  }

  redirect("/compte");
}

export async function deconnexionAction(): Promise<void> {
  await deconnecterUtilisateur();
  redirect("/");
}

/** URL absolue du site, déduite de la requête (marche en local et sur Vercel). */
async function origineRequete(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function demanderReinitialisationAction(
  formData: FormData,
): Promise<void> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    redirect(`/mot-de-passe-oublie?erreur=${encodeURIComponent("Email invalide.")}`);
  }

  const origine = await origineRequete();
  const urlRedirection = `${origine}/auth/callback?next=${encodeURIComponent("/reinitialiser")}`;
  await getAuthProvider().demanderReinitialisation(parsed.data, urlRedirection);

  // Réponse identique que l'email existe ou non (anti-énumération).
  redirect("/mot-de-passe-oublie?ok=envoye");
}

export async function reinitialiserMotDePasseAction(
  formData: FormData,
): Promise<void> {
  const parsed = nouveauMotDePasseSchema.safeParse({
    motDePasse: formData.get("motDePasse"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/reinitialiser?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await getAuthProvider().changerMotDePasse(parsed.data.motDePasse);
  if (!res.ok) {
    redirect(
      `/reinitialiser?erreur=${encodeURIComponent(
        "Le lien a expiré ou la session est invalide. Redemande un email de réinitialisation.",
      )}`,
    );
  }

  redirect("/compte?ok=mdp");
}
