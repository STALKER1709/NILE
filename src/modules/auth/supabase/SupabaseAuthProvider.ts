import type { AuthProvider, AuthResult } from "@/modules/auth/AuthProvider";
import {
  creerClientServeur,
  creerClientAdmin,
} from "@/modules/auth/supabase/serverClient";

/**
 * Vrai fournisseur d'authentification (managé) pour la production.
 *
 * Note de vérification : cette implémentation suit le motif officiel
 * @supabase/ssr mais n'a pas encore été exécutée contre un vrai projet Supabase
 * dans cet environnement (pas d'accès réseau au service ici). À valider lors du
 * branchement Supabase (voir README, section « Passer à Supabase »).
 *
 * Prérequis Supabase : désactiver la confirmation d'email par lien (« Confirm
 * email ») pour que signIn fonctionne juste après signUp au MVP, OU adapter le
 * flux d'inscription pour gérer la confirmation.
 */
export class SupabaseAuthProvider implements AuthProvider {
  async signUp(
    email: string,
    password: string,
  ): Promise<AuthResult<{ authId: string }>> {
    const supabase = await creerClientServeur();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      // Supabase renvoie un message spécifique quand l'email existe déjà.
      if (/registered|already/i.test(error.message)) {
        return { ok: false, error: "EMAIL_DEJA_UTILISE" };
      }
      return { ok: false, error: "ERREUR_FOURNISSEUR" };
    }
    if (!data.user) {
      return { ok: false, error: "ERREUR_FOURNISSEUR" };
    }
    return { ok: true, data: { authId: data.user.id } };
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult<{ authId: string }>> {
    const supabase = await creerClientServeur();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return { ok: false, error: "IDENTIFIANTS_INVALIDES" };
    }
    return { ok: true, data: { authId: data.user.id } };
  }

  async signOut(): Promise<void> {
    const supabase = await creerClientServeur();
    await supabase.auth.signOut();
  }

  async getCurrentAuthId(): Promise<string | null> {
    const supabase = await creerClientServeur();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  async deleteIdentity(authId: string): Promise<void> {
    try {
      const admin = creerClientAdmin();
      await admin.auth.admin.deleteUser(authId);
    } catch {
      // best-effort : nécessite la clé service_role ; sinon on ignore.
    }
  }
}
