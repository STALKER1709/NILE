import { env } from "@/lib/env";
import type { AuthProvider } from "@/modules/auth/AuthProvider";
import { MockAuthProvider } from "@/modules/auth/mock/MockAuthProvider";
import { SupabaseAuthProvider } from "@/modules/auth/supabase/SupabaseAuthProvider";

let instance: AuthProvider | null = null;

/**
 * Renvoie le fournisseur d'authentification actif, selon AUTH_PROVIDER.
 * Garde-fou : le provider "mock" est INTERDIT en production, sauf override
 * explicite ALLOW_MOCK_AUTH=true (environnement de démonstration).
 */
export function getAuthProvider(): AuthProvider {
  if (instance) return instance;

  // Pendant `next build` (pré-rendu), NODE_ENV vaut "production" alors qu'on ne
  // sert aucune requête réelle : on n'applique pas le garde à ce moment-là.
  const enPhaseDeBuild =
    process.env.NEXT_PHASE === "phase-production-build";

  if (env.AUTH_PROVIDER === "mock") {
    if (env.NODE_ENV === "production" && !env.ALLOW_MOCK_AUTH && !enPhaseDeBuild) {
      throw new Error(
        'AUTH_PROVIDER="mock" est interdit en production. ' +
          'Passe à AUTH_PROVIDER="supabase" (ou ALLOW_MOCK_AUTH="true" pour une démo).',
      );
    }
    instance = new MockAuthProvider();
  } else {
    instance = new SupabaseAuthProvider();
  }
  return instance;
}
