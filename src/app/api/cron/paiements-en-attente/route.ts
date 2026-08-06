import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { balayerPaiementsEnAttente } from "@/modules/paiement/suivi";

/**
 * Balayage des paiements Mobile Money restés en attente, déclenché depuis
 * l'extérieur (workflow GitHub Actions) : Vercel Hobby ne permet qu'une
 * exécution planifiée par jour.
 *
 * Dernier filet du parcours de paiement. Le webhook est la voie rapide ;
 * l'écran d'attente relit le statut tant que l'acheteur reste sur la page ;
 * ce balayage rattrape tout le reste — navigateur fermé, webhook jamais émis,
 * serveur indisponible au mauvais moment. Sans lui, une commande peut rester
 * figée indéfiniment avec l'argent encaissé et le stock immobilisé.
 *
 * Protégée par un secret partagé : sans lui, n'importe qui pourrait déclencher
 * des appels en rafale vers le fournisseur de paiement.
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
    const resultat = await balayerPaiementsEnAttente();
    return NextResponse.json({ ok: true, ...resultat });
  } catch (erreur) {
    console.error("[cron] balayage des paiements échoué:", erreur);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
