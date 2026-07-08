"use server";

import { redirect } from "next/navigation";
import { inscriptionSchema, connexionSchema } from "@/validators/auth";
import {
  inscrireUtilisateur,
  connecterUtilisateur,
  deconnecterUtilisateur,
} from "@/modules/auth/service";

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
