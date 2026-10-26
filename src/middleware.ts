import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Middleware global. En mode d'authentification "mock" (développement), c'est un
 * simple passe-plat. En "supabase", il rafraîchit la session à chaque requête.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Le garde serveur pourra préserver la page demandée lors de la connexion.
  // La valeur est écrasée ici : un client ne peut pas injecter sa propre cible.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nile-pathname", request.nextUrl.pathname + request.nextUrl.search);
  const requestWithPath = new NextRequest(request, { headers: requestHeaders });

  if (env.AUTH_PROVIDER !== "supabase") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return updateSession(requestWithPath);
}

export const config = {
  matcher: [
    // Toutes les routes sauf les assets statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
