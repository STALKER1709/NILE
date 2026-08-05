import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Rafraîchit la session Supabase à chaque requête (motif officiel @supabase/ssr).
 * Nécessaire car les Server Components ne peuvent pas écrire de cookies : sans
 * ce middleware, le jeton d'accès expirerait (~1 h) et l'utilisateur serait
 * déconnecté malgré un refresh token valide.
 *
 * Règle critique : ne RIEN exécuter entre createServerClient et getUser().
 *
 * ⚠️ Ce middleware RAFRAÎCHIT, il n'AUTORISE pas. Le `getUser()` ci-dessous
 * voit son résultat ignoré : une requête munie d'un cookie invalide passe et
 * sera refusée plus loin, par `exigerRole()`. Ne jamais déduire d'ici qu'une
 * identité est prouvée — la vérification appartient au contrôle d'accès, qui
 * appelle `getUser()` pour son propre compte.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return supabaseResponse;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Rafraîchit le jeton. Ne rien insérer avant cette ligne.
  await supabase.auth.getUser();

  return supabaseResponse;
}
