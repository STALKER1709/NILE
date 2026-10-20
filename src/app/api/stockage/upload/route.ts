import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getUtilisateurCourant } from "@/modules/auth/access";
import {
  ErreurStockage,
  tailleMaxPourType,
  typeMimeDepuisExtension,
} from "@/modules/stockage/StorageProvider";
import {
  ecrireUploadDirect,
  supprimerUploadDirect,
} from "@/modules/stockage/local/LocalStorageProvider";

/**
 * Envoi direct d'un fichier de publication — STOCKAGE LOCAL (développement).
 *
 * En production, cette route ne sert jamais : `preparerUploadDirect` renvoie
 * une URL signée Supabase et le navigateur envoie le fichier directement là-bas
 * (une vidéo de 15 Mo dépasserait la limite de corps des fonctions serverless).
 *
 * Garde-fous côté serveur, même en dev :
 *   - session vendeur exigée (jamais d'écriture anonyme sur le disque) ;
 *   - clé stricte `publications/<uuid du vendeur>/<uuid>.(jpg|png|webp|mp4)` :
 *     le vendeur ne peut écrire que dans SON dossier — pas de traversée de
 *     chemin, pas d'écriture chez un autre vendeur ;
 *   - extension ⇄ type MIME concordants ;
 *   - poids réel compté pendant le stream, au-dessus de la limite → 413 et
 *     suppression du fichier partiel.
 */
export async function PUT(request: Request): Promise<Response> {
  if (env.STORAGE_PROVIDER !== "local") {
    return Response.json(
      { ok: false, code: "NON_LOCAL" },
      { status: 400 },
    );
  }

  const utilisateur = await getUtilisateurCourant();
  if (!utilisateur) {
    return Response.json({ ok: false, code: "NON_CONNECTE" }, { status: 401 });
  }
  if (utilisateur.role !== "VENDEUR") {
    return Response.json({ ok: false, code: "INTERDIT" }, { status: 403 });
  }
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
    select: { id: true },
  });
  if (!vendeur) {
    return Response.json({ ok: false, code: "INTERDIT" }, { status: 403 });
  }

  const chemin = request.headers.get("x-chemin") ?? "";
  const motifAttendu = new RegExp(
    `^publications/${vendeur.id}/[0-9a-fA-F-]{36}\\.(jpg|png|webp|mp4)$`,
  );
  if (!motifAttendu.test(chemin)) {
    return Response.json({ ok: false, code: "CHEMIN_INVALIDE" }, { status: 400 });
  }

  const typeMime = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    ?.trim() ?? "";
  const extension = chemin.slice(chemin.lastIndexOf(".") + 1).toLowerCase();
  if (typeMimeDepuisExtension(extension) !== typeMime) {
    return Response.json(
      { ok: false, code: "TYPE_NON_CONCORDANT" },
      { status: 400 },
    );
  }

  // Refus AVANT lecture si le navigateur annonce un corps plus lourd que la
  // limite du type : inutile de faire transiter un fichier qu'on va jeter.
  const annonce = Number(request.headers.get("content-length") ?? 0);
  if (annonce > tailleMaxPourType(typeMime)) {
    return Response.json({ ok: false, code: "TROP_LOURDE" }, { status: 413 });
  }

  if (!request.body) {
    return Response.json({ ok: false, code: "CORPS_VIDE" }, { status: 400 });
  }

  try {
    const octets = await ecrireUploadDirect(chemin, request.body, typeMime);

    // Un flux clos avant l'annonce (proxy ou serveur qui tronque le corps à
    // sa propre limite) laisse un fichier incomplet mais pourtant valide au
    // regard du poids : on compare au Content-Length et, en cas d'écart, on
    // supprime plutôt que de livrer une vidéo illisible à l'acheteur.
    if (annonce > 0 && octets < annonce) {
      await supprimerUploadDirect(chemin).catch((e) => {
        console.error(
          "[upload-local] suppression du fichier tronqué impossible :",
          e,
        );
      });
      return Response.json({ ok: false, code: "CORPS_TRONQUE" }, { status: 400 });
    }

    return Response.json({
      ok: true,
      chemin,
      url: `/uploads/${chemin}`,
      tailleOctets: octets,
    });
  } catch (erreur) {
    if (erreur instanceof ErreurStockage) {
      const status = erreur.code === "TROP_LOURDE" ? 413 : 400;
      return Response.json({ ok: false, code: erreur.code }, { status });
    }
    // Erreur inattendue : journalisée (règle : aucun catch silencieux),
    // réponse générique côté client.
    console.error("[upload-local] échec d'écriture :", erreur);
    return Response.json({ ok: false, code: "ERREUR" }, { status: 500 });
  }
}
