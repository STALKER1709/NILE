import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { creerClientServeur } from "@/modules/auth/supabase/serverClient";

/**
 * Retour des liens email Supabase (réinitialisation de mot de passe…).
 * Échange le `code` reçu contre une session (PKCE), puis redirige vers `next`.
 * ⚠️ Cette URL doit être ajoutée aux « Redirect URLs » autorisées dans
 * Supabase (Authentication > URL Configuration).
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  // Sécurité : on ne redirige que vers une page interne du site.
  const cible = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (env.AUTH_PROVIDER === "supabase" && code) {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(cible, url.origin));
    }
    console.error("[auth/callback] échange de code échoué:", error.message);
  }

  return NextResponse.redirect(
    new URL(
      "/connexion?erreur=" +
        encodeURIComponent("Lien invalide ou expiré. Redemande un email."),
      url.origin,
    ),
  );
}
