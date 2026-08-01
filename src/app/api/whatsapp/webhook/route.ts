import { env } from "@/lib/env";
import { verifierSignatureWebhook, extraireExpediteurs } from "@/modules/whatsapp/whatsapp-core";
import { ouvrirFenetreServicePourExpediteur } from "@/modules/whatsapp/webhook";

/**
 * Vérification du webhook (handshake initial + chaque modification d'URL
 * dans WhatsApp Manager) : Meta appelle en GET avec hub.mode=subscribe et
 * hub.verify_token, on renvoie hub.challenge tel quel si le token correspond.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Réception des événements WhatsApp. On ne traite que les messages ENTRANTS
 * (ouverture de la fenêtre de service gratuite) ; les accusés de statut
 * (delivered/read) sont ignorés — rien d'utile à en faire pour l'instant.
 *
 * La signature est vérifiée sur le corps BRUT avant tout parsing JSON.
 */
export async function POST(req: Request): Promise<Response> {
  const corpsBrut = await req.text();

  if (env.WHATSAPP_APP_SECRET) {
    const signature = req.headers.get("x-hub-signature-256");
    if (!verifierSignatureWebhook(env.WHATSAPP_APP_SECRET, corpsBrut, signature)) {
      console.error("[whatsapp] webhook: signature invalide.");
      return new Response("Signature invalide", { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(corpsBrut);
  } catch {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const expediteurs = extraireExpediteurs(payload);
  await Promise.allSettled(expediteurs.map((tel) => ouvrirFenetreServicePourExpediteur(tel)));

  // Meta considère tout code hors 2xx comme un échec et réessaie : on
  // renvoie toujours 200 une fois le corps lu, même si le traitement d'un
  // expéditeur a échoué (déjà journalisé côté ouvrirFenetreServicePourExpediteur
  // via Promise.allSettled — aucune exception ne remonte ici).
  return new Response("EVENT_RECEIVED", { status: 200 });
}
