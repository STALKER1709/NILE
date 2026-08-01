import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { envoyerRappelsConfirmation } from "@/modules/livraison/rappels";

/**
 * Rappels « avez-vous bien reçu votre commande ? », déclenchés depuis
 * l'extérieur (workflow GitHub Actions, ~toutes les 10 min) : Vercel Hobby
 * ne permet qu'une exécution planifiée par jour.
 *
 * Protégée par un secret partagé : sans lui, n'importe qui pourrait forcer
 * l'envoi de notifications à tous les acheteurs.
 */
function secretValide(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const entete = req.headers.get("authorization") ?? "";
  const fourni = entete.startsWith("Bearer ") ? entete.slice("Bearer ".length) : "";

  const a = Buffer.from(fourni);
  const b = Buffer.from(env.CRON_SECRET);
  // Comparaison en temps constant : la longueur est vérifiée d'abord car
  // timingSafeEqual exige deux tampons de même taille.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  if (!env.CRON_SECRET) {
    // Fonction non configurée : inactive plutôt qu'ouverte.
    return NextResponse.json({ ok: false, raison: "NON_CONFIGURE" }, { status: 503 });
  }
  if (!secretValide(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const { rappels } = await envoyerRappelsConfirmation();
    return NextResponse.json({ ok: true, rappels });
  } catch (erreur) {
    console.error("[cron] rappels de confirmation échoués:", erreur);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
