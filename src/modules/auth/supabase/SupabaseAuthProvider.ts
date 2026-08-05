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
      console.error("[supabase] signUp erreur:", error.message);
      return { ok: false, error: "ERREUR_FOURNISSEUR" };
    }
    if (!data.user) {
      console.error("[supabase] signUp: aucun utilisateur renvoyé");
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
      if (error) console.error("[supabase] signIn erreur:", error.message);
      return { ok: false, error: "IDENTIFIANTS_INVALIDES" };
    }
    return { ok: true, data: { authId: data.user.id } };
  }

  async signOut(): Promise<void> {
    const supabase = await creerClientServeur();
    await supabase.auth.signOut();
  }

  /**
   * Identité de l'appelant, AUTHENTIFIÉE auprès du serveur Supabase.
   *
   * `getUser()` et non `getSession()` : ce dernier se contente de décoder le
   * cookie sans en vérifier la signature. N'importe qui peut forger un cookie
   * portant l'`id` d'un autre compte — un administrateur, par exemple — et
   * `getSession()` le renverrait tel quel. Tout le contrôle d'accès repose sur
   * cette valeur (`exigerRole`, `exigerVendeur`) : elle doit être prouvée, pas
   * lue.
   *
   * Le middleware appelle bien `getUser()` à chaque requête, mais il en jette
   * le résultat — il rafraîchit le jeton, il n'autorise rien. Et un contrôle
   * qui ne vit que dans le middleware n'est pas une frontière de sécurité : la
   * vérification doit se faire ici, au plus près de la donnée.
   *
   * Coût : un aller-retour réseau. Il est mutualisé par requête via le
   * `cache()` de React posé sur `getUtilisateurCourant()`.
   */
  async getCurrentAuthId(): Promise<string | null> {
    const supabase = await creerClientServeur();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }

  async deleteIdentity(authId: string): Promise<void> {
    try {
      const admin = creerClientAdmin();
      await admin.auth.admin.deleteUser(authId);
    } catch {
      // best-effort : nécessite la clé service_role ; sinon on ignore.
    }
  }

  async demanderReinitialisation(
    email: string,
    urlRedirection: string,
  ): Promise<void> {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: urlRedirection,
    });
    // On journalise mais on ne remonte rien : la réponse UX est identique que
    // l'email existe ou non (anti-énumération de comptes).
    if (error) {
      console.error("[supabase] resetPasswordForEmail erreur:", error.message);
    }
  }

  async changerMotDePasse(
    nouveauMotDePasse: string,
  ): Promise<AuthResult<{ authId: string }>> {
    const supabase = await creerClientServeur();
    const { data, error } = await supabase.auth.updateUser({
      password: nouveauMotDePasse,
    });
    if (error || !data.user) {
      if (error) console.error("[supabase] updateUser erreur:", error.message);
      return { ok: false, error: "ERREUR_FOURNISSEUR" };
    }
    return { ok: true, data: { authId: data.user.id } };
  }
}
