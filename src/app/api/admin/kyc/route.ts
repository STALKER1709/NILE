import { NextRequest } from "next/server";
import { exigerRole } from "@/modules/auth/access";
import { getStorageProvider } from "@/modules/stockage";
import { LocalStorageProvider, lireFichierKycLocal } from "@/modules/stockage/local/LocalStorageProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consultation d'un justificatif KYC local.
 * Le contrôle ADMIN précède toute lecture disque ; aucune URL publique n'est créée.
 */
export async function GET(request: NextRequest): Promise<Response> {
  await exigerRole("ADMIN");

  const chemin = request.nextUrl.searchParams.get("chemin");
  if (!chemin) return new Response("Document introuvable.", { status: 404 });

  if (!(getStorageProvider() instanceof LocalStorageProvider)) {
    return new Response("Document introuvable.", { status: 404 });
  }

  try {
    const fichier = await lireFichierKycLocal(chemin);
    return new Response(new Uint8Array(fichier.contenu), {
      headers: {
        "Content-Type": fichier.typeMime,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new Response("Document introuvable.", { status: 404 });
  }
}
