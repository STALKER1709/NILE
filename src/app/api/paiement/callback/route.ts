import { NextResponse } from "next/server";
import { traiterNotificationPaiement } from "@/modules/paiement/notification";

/**
 * Callback serveur de paiement (Monetbil notify_url).
 * SEULE source de vérité pour marquer une commande payée. Le retour navigateur
 * n'est jamais utilisé pour confirmer un paiement.
 */
export async function POST(req: Request): Promise<Response> {
  // Le corps est lu UNE fois, en texte : les signatures HMAC portent sur les
  // octets reçus, pas sur l'objet reconstruit après décodage. Le décodage
  // vient ensuite, à partir de cette même chaîne.
  let brut: string;
  try {
    brut = await req.text();
  } catch (erreur) {
    console.error("Callback paiement: corps illisible", erreur);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const corps: Record<string, string> = {};
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = JSON.parse(brut) as Record<string, unknown>;
      for (const [k, v] of Object.entries(json)) corps[k] = String(v);
    } else {
      for (const [k, v] of new URLSearchParams(brut).entries()) corps[k] = v;
    }
  } catch (erreur) {
    // Corps non décodable : certains fournisseurs signent une charge que
    // seul leur propre lecteur sait interpréter. On laisse le fournisseur
    // trancher à partir du brut plutôt que de rejeter d'emblée.
    console.error("Callback paiement: décodage partiel", erreur);
  }

  const res = await traiterNotificationPaiement(corps, {
    brut,
    entetes: req.headers,
  });
  if (!res.ok) {
    // « Pas encore définitif » (paiement en cours, ou bloqué en revue
    // manuelle) n'est PAS une erreur : la notification a été reçue et
    // comprise, il n'y a simplement rien à écrire. Répondre 400 ferait
    // rejouer indéfiniment le webhook par le fournisseur. On accuse
    // réception ; le statut final arrivera dans une notification suivante.
    if (res.raison === "NON_DEFINITIF") {
      return NextResponse.json({ ok: true, statut: "EN_ATTENTE" });
    }
    console.error("[callback] notification rejetée:", res.raison);
    return NextResponse.json({ ok: false, raison: res.raison }, { status: 400 });
  }
  return NextResponse.json({ ok: true, statut: res.statut });
}
