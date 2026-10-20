import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  extensionDepuisMime,
  typeMimeDepuisExtension,
} from "@/modules/stockage/StorageProvider";
import { getStorageProvider } from "@/modules/stockage";
import {
  validerMedia,
  validerPublication,
  dedupliquer,
} from "@/modules/reels/reels-core";
import type { PublicationInput } from "@/validators/publication";

/**
 * Orchestration des publications « Reels » (accès base + transactions).
 * La logique de validation pure vit dans reels-core ; ici on la BRANCHE :
 * chaque média désigné par le navigateur est re-confirmé côté serveur
 * (existence, poids réel) et rattaché au préfixe du vendeur de session.
 */

export type CodeErreurPublication =
  | "TYPE_INVALIDE"
  | "TROP_LOURDE"
  | "DUREE_TROP_LONGUE"
  | "TEXTE_TROP_LONG"
  | "AUCUN_MEDIA"
  | "TROP_DE_MEDIAS"
  | "TROP_DE_VIDEOS"
  | "TROP_DE_TAGS"
  | "CHEMIN_INVALIDE"
  | "MEDIA_ABSENT"
  | "PRODUITS_INVALIDES"
  | "ERREUR";

export type ResultatPublication =
  | { ok: true; id: string }
  | { ok: false; code: CodeErreurPublication };

/** Préfixe de stockage propre à un vendeur : tout média doit s'y trouver. */
function estAuBonPrefixe(chemin: string, vendeurId: string): boolean {
  return chemin.startsWith(`publications/${vendeurId}/`);
}

/** Ticket d'envoi pour un fichier de publication (images ET vidéos). */
export type TicketPublication = Awaited<
  ReturnType<ReturnType<typeof getStorageProvider>["preparerUploadDirect"]>
>;

export async function demanderUploadPublication(
  vendeurId: string,
  input: { typeMime: string; tailleOctets: number; dureeSecondes?: number },
): Promise<
  | { ok: true; ticket: TicketPublication }
  | { ok: false; code: string }
> {
  const verdict = validerMedia(input);
  if (!verdict.ok) return { ok: false, code: verdict.code };

  const dossier = `publications/${vendeurId}`;
  const chemin = `${dossier}/${randomUUID()}.${extensionDepuisMime(input.typeMime)}`;
  const ticket = await getStorageProvider().preparerUploadDirect(chemin);
  return { ok: true, ticket };
}

/**
 * Après l'envoi navigateur : vérifie réception (existence + poids réel) et
 * renvoie la forme stockée à attacher à la publication.
 */
export async function confirmerUploadPublication(
  vendeurId: string,
  input: { chemin: string; typeMime: string },
): Promise<
  | { ok: true; chemin: string; url: string; type: "IMAGE" | "VIDEO" }
  | { ok: false; code: string }
> {
  if (!estAuBonPrefixe(input.chemin, vendeurId)) {
    return { ok: false, code: "CHEMIN_INVALIDE" };
  }
  try {
    const confirme = await getStorageProvider().confirmerUploadDirect(
      input.chemin,
      input.typeMime,
    );
    const verdict = validerMedia({
      typeMime: input.typeMime,
      tailleOctets: confirme.tailleOctets,
    });
    if (!verdict.ok) return { ok: false, code: verdict.code };
    return {
      ok: true,
      chemin: confirme.chemin,
      url: confirme.url,
      type: verdict.type,
    };
  } catch (erreur) {
    // Codes métier du stockage → erreur contrôlée ; le reste remonte.
    if (
      erreur !== null &&
      typeof erreur === "object" &&
      "code" in erreur &&
      typeof (erreur as { code: unknown }).code === "string"
    ) {
      return { ok: false, code: (erreur as { code: string }).code };
    }
    throw erreur;
  }
}

/**
 * Crée une publication dans une transaction : médias re-confirmés un par un,
 * tags produits vérifiés appartenir au vendeur ET en ligne (un tag vers un
 * produit masqué serait un lien mort côté acheteur).
 */
export async function creerPublication(
  vendeurId: string,
  input: PublicationInput,
): Promise<ResultatPublication> {
  try {
    const composition = validerPublication({
      texte: input.texte,
      medias: input.medias.map((m) => ({
        // Pour la composition, seul le TYPE déclaré compte ; le poids réel est
        // revérifié par la confirmation de chaque fichier ci-dessous.
        typeMime: m.type === "VIDEO" ? "video/mp4" : "image/jpeg",
        tailleOctets: 0,
      })),
      produitIds: input.produitIds,
    });
    if (!composition.ok) return { ok: false, code: composition.code };

    // Re-confirmation de chaque média : le navigateur ne fournit que des clés,
    // jamais d'URL — il faut que le fichier existe VRAIMENT chez ce vendeur.
    const mediasValides: {
      type: "IMAGE" | "VIDEO";
      url: string;
      chemin: string;
      posterUrl: string | null;
      posterChemin: string | null;
    }[] = [];
    for (const media of input.medias) {
      if (!estAuBonPrefixe(media.chemin, vendeurId)) {
        return { ok: false, code: "CHEMIN_INVALIDE" };
      }
      const extension = media.chemin.slice(media.chemin.lastIndexOf(".") + 1);
      const typeMime = typeMimeDepuisExtension(extension);
      if (!typeMime) return { ok: false, code: "TYPE_INVALIDE" };
      const confirme = await getStorageProvider().confirmerUploadDirect(
        media.chemin,
        typeMime,
      );
      const verdict = validerMedia({
        typeMime,
        tailleOctets: confirme.tailleOctets,
      });
      if (!verdict.ok) return { ok: false, code: verdict.code };

      let poster: { url: string; chemin: string } | null = null;
      if (media.posterChemin) {
        if (!estAuBonPrefixe(media.posterChemin, vendeurId)) {
          return { ok: false, code: "CHEMIN_INVALIDE" };
        }
        const confirmePoster = await getStorageProvider().confirmerUploadDirect(
          media.posterChemin,
          "image/jpeg",
        );
        poster = { url: confirmePoster.url, chemin: confirmePoster.chemin };
      }
      mediasValides.push({
        type: verdict.type,
        url: confirme.url,
        chemin: confirme.chemin,
        posterUrl: poster?.url ?? null,
        posterChemin: poster?.chemin ?? null,
      });
    }

    // Tags : produits du vendeur, en ligne, dédupliqués par la base.
    const produitIds = dedupliquer(input.produitIds);
    if (produitIds.length > 0) {
      const nbValables = await prisma.produit.count({
        where: {
          id: { in: produitIds },
          vendeurId,
          statut: "ACTIF",
        },
      });
      if (nbValables !== produitIds.length) {
        return { ok: false, code: "PRODUITS_INVALIDES" };
      }
    }

    const publication = await prisma.$transaction(async (tx) => {
      const creee = await tx.publication.create({
        data: {
          vendeurId,
          texte: input.texte || null,
          medias: {
            create: mediasValides.map((m, ordre) => ({ ...m, ordre })),
          },
          produits: {
            create: produitIds.map((produitId) => ({ produitId })),
          },
        },
      });
      return creee;
    });

    return { ok: true, id: publication.id };
  } catch (erreur) {
    console.error("[reels] échec de création de publication :", erreur);
    return { ok: false, code: "ERREUR" };
  }
}

/**
 * Abandon d'envois : le vendeur a retiré un média du composeur AVANT la
 * création — le fichier ne doit pas rester orphelin dans le stockage.
 * Chaque clé est revérifiée contre le préfixe du vendeur : impossible de
 * supprimer le fichier d'un autre.
 */
export async function abandonnerUploads(
  vendeurId: string,
  cles: string[],
): Promise<{ ok: boolean }> {
  const valides = cles.filter((c) => c && estAuBonPrefixe(c, vendeurId));
  if (valides.length !== cles.filter(Boolean).length) return { ok: false };
  const provider = getStorageProvider();
  let ok = true;
  for (const cle of valides) {
    try {
      await provider.supprimer(cle);
    } catch (erreur) {
      // Nettoyage best-effort : signalé, mais ne bloque jamais le vendeur.
      ok = false;
      console.error(`[reels] abandon upload ${cle} échoué :`, erreur);
    }
  }
  return { ok };
}

/** Publications d'une boutique : ACTIVES seulement, plus récentes d'abord. */
export async function listerPublicationsBoutique(
  vendeurId: string,
  limite = 6,
) {
  return prisma.publication.findMany({
    where: { vendeurId, statut: "ACTIF" },
    orderBy: { dateCreation: "desc" },
    take: limite,
    include: {
      medias: { orderBy: { ordre: "asc" } },
      produits: {
        where: { produit: { statut: "ACTIF" } },
        include: {
          produit: {
            select: { id: true, slug: true, titre: true, prix: true },
          },
        },
      },
    },
  });
}

/** Publications du vendeur (tout statut — il doit voir ses masquées). */
export async function listerPublicationsVendeur(vendeurId: string) {
  return prisma.publication.findMany({
    where: { vendeurId },
    orderBy: { dateCreation: "desc" },
    include: {
      medias: { orderBy: { ordre: "asc" } },
      _count: { select: { produits: true } },
    },
  });
}

/**
 * Supprime une publication du vendeur. Les fichiers sont détachés par cascade
 * en base, puis supprimés du stockage : un échec de suppression fichier est
 * journalisé (jamais avalé) mais ne roule pas en arrière la base — une ligne
 * absente est le résultat correct, un fichier orphelin reste un problème de
 * fidélisation, pas d'intégrité.
 */
export async function supprimerPublication(
  vendeurId: string,
  publicationId: string,
): Promise<{ ok: boolean }> {
  const existante = await prisma.publication.findFirst({
    where: { id: publicationId, vendeurId },
    include: { medias: true },
  });
  if (!existante) return { ok: false };

  await prisma.publication.delete({ where: { id: publicationId } });

  const provider = getStorageProvider();
  for (const media of existante.medias) {
    const cles = [media.chemin, media.posterChemin].filter(
      (c): c is string => !!c,
    );
    for (const cle of cles) {
      try {
        await provider.supprimer(cle);
      } catch (erreur) {
        // Fichier peut-être déjà parti : signalé, pas bloquant.
        console.error(`[reels] suppression fichier ${cle} échouée :`, erreur);
      }
    }
  }
  return { ok: true };
}
