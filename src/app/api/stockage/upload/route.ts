import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { ErreurStockage, tailleMaxPourType, typeMimeDepuisExtension } from "@/modules/stockage/StorageProvider";
import { ecrireUploadDirect, supprimerUploadDirect } from "@/modules/stockage/local/LocalStorageProvider";

export async function PUT(request: Request): Promise<Response> {
  if (env.STORAGE_PROVIDER !== "local") return Response.json({ ok: false, code: "NON_LOCAL" }, { status: 400 });
  const utilisateur = await getUtilisateurCourant();
  if (!utilisateur) return Response.json({ ok: false, code: "NON_CONNECTE" }, { status: 401 });
  if (utilisateur.statut !== "ACTIF") return Response.json({ ok: false, code: "COMPTE_SUSPENDU" }, { status: 403 });
  if (utilisateur.role !== "VENDEUR") return Response.json({ ok: false, code: "INTERDIT" }, { status: 403 });

  const vendeur = await prisma.vendeur.findUnique({ where: { utilisateurId: utilisateur.id }, select: { id: true } });
  if (!vendeur) return Response.json({ ok: false, code: "INTERDIT" }, { status: 403 });

  const chemin = request.headers.get("x-chemin") ?? "";
  const motifAttendu = new RegExp(`^publications/${vendeur.id}/[0-9a-fA-F-]{36}\\.(jpg|png|webp|mp4)$`);
  if (!motifAttendu.test(chemin)) return Response.json({ ok: false, code: "CHEMIN_INVALIDE" }, { status: 400 });

  const typeMime = (request.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
  const extension = chemin.slice(chemin.lastIndexOf(".") + 1).toLowerCase();
  if (typeMimeDepuisExtension(extension) !== typeMime) return Response.json({ ok: false, code: "TYPE_NON_CONCORDANT" }, { status: 400 });

  const annonce = Number(request.headers.get("content-length") ?? 0);
  if (annonce > tailleMaxPourType(typeMime)) return Response.json({ ok: false, code: "TROP_LOURDE" }, { status: 413 });
  if (!request.body) return Response.json({ ok: false, code: "CORPS_VIDE" }, { status: 400 });

  try {
    const octets = await ecrireUploadDirect(chemin, request.body, typeMime);
    if (annonce > 0 && octets < annonce) {
      await supprimerUploadDirect(chemin).catch((e) => console.error("[upload-local] suppression du fichier tronqué impossible :", e));
      return Response.json({ ok: false, code: "CORPS_TRONQUE" }, { status: 400 });
    }
    return Response.json({ ok: true, chemin, url: `/uploads/${chemin}`, tailleOctets: octets });
  } catch (erreur) {
    if (erreur instanceof ErreurStockage) return Response.json({ ok: false, code: erreur.code }, { status: erreur.code === "TROP_LOURDE" ? 413 : 400 });
    console.error("[upload-local] échec d'écriture :", erreur);
    return Response.json({ ok: false, code: "ERREUR" }, { status: 500 });
  }
}
