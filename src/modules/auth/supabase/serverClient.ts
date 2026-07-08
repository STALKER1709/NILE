import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Client Supabase côté serveur, branché sur les cookies de la requête Next.js
 * (motif officiel @supabase/ssr). Supabase gère lui-même la session via cookies.
 */
export async function creerClientServeur() {
  const cookieStore = await cookies();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Configuration Supabase incomplète (URL / ANON_KEY). Voir .env.example.",
    );
  }
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component (écriture cookie interdite) :
          // on ignore, le rafraîchissement de session se fera ailleurs.
        }
      },
    },
  });
}

/**
 * Client "admin" (clé service_role) pour les opérations privilégiées
 * (ex : supprimer une identité orpheline). NE JAMAIS exposer côté client.
 */
export function creerClientAdmin() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant pour l'opération admin.");
  }
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
