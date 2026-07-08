/**
 * Interface abstraite d'authentification.
 *
 * Même philosophie que le paiement : le reste de l'application ne connaît QUE
 * cette interface. Deux implémentations existent :
 *   - SupabaseAuthProvider : le vrai fournisseur managé (production).
 *   - MockAuthProvider     : développement/tests locaux uniquement.
 *
 * Un provider gère UNIQUEMENT l'identité (créer un compte, vérifier un mot de
 * passe, établir/lire/effacer la session). L'AUTORISATION (rôle, statut) est
 * gérée par l'application, dans la base (`Utilisateur`), pas ici.
 */

export type AuthErrorCode =
  | "EMAIL_DEJA_UTILISE"
  | "IDENTIFIANTS_INVALIDES"
  | "ERREUR_FOURNISSEUR";

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthErrorCode };

export interface AuthProvider {
  /**
   * Crée une identité d'authentification. Ne connecte pas l'utilisateur.
   * Renvoie l'identifiant d'auth qui servira de clé primaire à `Utilisateur`.
   */
  signUp(email: string, password: string): Promise<AuthResult<{ authId: string }>>;

  /**
   * Vérifie les identifiants ET établit la session (pose le cookie de session).
   * Doit être appelé depuis une Server Action ou une Route Handler.
   */
  signIn(email: string, password: string): Promise<AuthResult<{ authId: string }>>;

  /** Efface la session courante. */
  signOut(): Promise<void>;

  /** Identifiant d'auth de l'utilisateur connecté, ou null. Lecture seule. */
  getCurrentAuthId(): Promise<string | null>;

  /**
   * Nettoyage d'une identité orpheline (si la création du profil échoue juste
   * après signUp). Best-effort ; peut être un no-op selon le fournisseur.
   */
  deleteIdentity(authId: string): Promise<void>;
}
