import { NextResponse } from "next/server";
import { traiterNotificationPaiement } from "@/modules/paiement/notification";

/**
 * Callback serveur de paiement (Monetbil notify_url).
 * SEULE source de vérité pour marquer une commande payée. Le retour navigateur
 * n'est jamais utilisé pour confirmer un paiement.
 */
export async function POST(req: Request): Promise<Response> {
  const corps: Record<string, string> = {};
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await req.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(json)) corps[k] = String(v);
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) corps[k] = String(v);
    }
  } catch (erreur) {
    console.error("Callback paiement: corps illisible", erreur);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const res = await traiterNotificationPaiement(corps);
  if (!res.ok) {
    console.error("[callback] notification rejetée:", res.raison);
    return NextResponse.json({ ok: false, raison: res.raison }, { status: 400 });
  }
  return NextResponse.json({ ok: true, statut: res.statut });
}
