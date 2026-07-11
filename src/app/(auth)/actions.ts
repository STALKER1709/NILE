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
import { getUtilisateurCourant } from "@/modules/auth/access";
import { fusionnerPanierInvite } from "@/modules/commande/panier-invite";
import {
  consommerTentative,
  reinitialiserLimite,
} from "@/modules/securite/rate-limit";

/**
 * Cible de redirection après connexion/inscription (`suite`) : uniquement un
 * chemin interne au site (jamais une URL externe).
 */
function cibleApresAuth(formData: FormData): string {
  const suite = String(formData.get("suite") ?? "");
  return suite.startsWith("/") && !suite.startsWith("//") ? suite : "/compte";
}

/** Suffixe `&suite=...` à conserver dans les redirections d'erreur du formulaire. */
function suffixeSuite(formData: FormData): string {
  const suite = String(formData.get("suite") ?? "");
  return suite.startsWith("/") && !suite.startsWith("//")
    ? `&suite=${encodeURIComponent(suite)}`
    : "";
}

/** Fusionne l'éventuel panier invité dans le panier du compte connecté. */
async function recupererPanierInvite(): Promise<void> {
  const utilisateur = await getUtilisateurCourant();
  if (utilisateur) await fusionnerPanierInvite(utilisateur.id);
}

/** Adresse IP du client (Vercel : premier élément de x-forwarded-for). */
async function ipClient(): Promise<string> {
  const h = await headers();
  const premiere = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  return premiere || "ip-inconnue";
}

function messageTropDeTentatives(minutes: number): string {
  return `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

// Plafonds anti-abus (fenêtre glissante).
const LIMITE_CONNEXION = { max: 5, fenetreMinutes: 15 };
const LIMITE_INSCRIPTION = { max: 5, fenetreMinutes: 60 };
const LIMITE_RESET = { max: 3, fenetreMinutes: 60 };

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
    redirect(`/inscription?erreur=${encodeURIComponent(msg)}${suffixeSuite(formData)}`);
  }

  // Anti-abus : créations de comptes en rafale depuis une même IP.
  const limite = await consommerTentative(
    `inscription:${await ipClient()}`,
    LIMITE_INSCRIPTION.max,
    LIMITE_INSCRIPTION.fenetreMinutes,
  );
  if (!limite.autorise) {
    redirect(
      `/inscription?erreur=${encodeURIComponent(messageTropDeTentatives(limite.minutesRestantes))}${suffixeSuite(formData)}`,
    );
  }

  const res = await inscrireUtilisateur(parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "EMAIL_DEJA_UTILISE"
        ? "Cet email est déjà utilisé."
        : "Une erreur est survenue. Réessaie.";
    redirect(`/inscription?erreur=${encodeURIComponent(msg)}${suffixeSuite(formData)}`);
  }

  await recupererPanierInvite();
  redirect(cibleApresAuth(formData));
}

export async function connexionAction(formData: FormData): Promise<void> {
  const brut = {
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
  };

  const parsed = connexionSchema.safeParse(brut);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/connexion?erreur=${encodeURIComponent(msg)}${suffixeSuite(formData)}`);
  }

  // Anti-abus : force brute sur un compte depuis une même IP. Le compteur est
  // remis à zéro à la première connexion réussie.
  const cleLimite = `connexion:${await ipClient()}:${parsed.data.email}`;
  const limite = await consommerTentative(
    cleLimite,
    LIMITE_CONNEXION.max,
    LIMITE_CONNEXION.fenetreMinutes,
  );
  if (!limite.autorise) {
    redirect(
      `/connexion?erreur=${encodeURIComponent(messageTropDeTentatives(limite.minutesRestantes))}${suffixeSuite(formData)}`,
    );
  }

  const res = await connecterUtilisateur(parsed.data);
  if (!res.ok) {
    const msg =
      res.code === "SUSPENDU"
        ? "Ce compte est suspendu. Contacte le support."
        : res.code === "IDENTIFIANTS_INVALIDES"
          ? "Email ou mot de passe incorrect."
          : "Une erreur est survenue. Réessaie.";
    redirect(`/connexion?erreur=${encodeURIComponent(msg)}${suffixeSuite(formData)}`);
  }

  await reinitialiserLimite(cleLimite);
  await recupererPanierInvite();
  redirect(cibleApresAuth(formData));
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

  // Anti-abus : envois d'emails de réinitialisation en rafale.
  const limite = await consommerTentative(
    `reset:${await ipClient()}`,
    LIMITE_RESET.max,
    LIMITE_RESET.fenetreMinutes,
  );
  if (!limite.autorise) {
    redirect(
      `/mot-de-passe-oublie?erreur=${encodeURIComponent(messageTropDeTentatives(limite.minutesRestantes))}`,
    );
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
