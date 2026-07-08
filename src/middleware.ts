import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Middleware global. En mode d'authentification "mock" (développement), c'est un
 * simple passe-plat. En "supabase", il rafraîchit la session à chaque requête.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (env.AUTH_PROVIDER !== "supabase") {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Toutes les routes sauf les assets statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
