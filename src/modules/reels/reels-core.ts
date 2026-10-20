/**
 * Logique PURE des publications « Reels » : limites et validations du
 * composeur. Aucune importation base/réseau — c'est elle qui porte les tests
 * (convention *-core.ts du projet).
 *
 * Les poids/type de fichiers viennent de `stockage/StorageProvider` : une
 * seule source de vérité pour « ce que la plateforme accepte », évite qu'un
 * plafond change d'un côté sans changer de l'autre.
 *
 * Rappel des décisions produit (inchangées) :
 *   - confiance + conversion : chaque publication tague jusqu'à 4 produits ;
 *   - images + vidéos MP4 courtes, plafonnées car la data est chère au
 *     Cameroun (45 s / 15 Mo) ;
 *   - zéro commentaire (pas de modération de texte) ;
 *   - pas de transcodage serveur : on accepte ce que le téléphone produit
 *     déjà, et la modération est a posteriori.
 */

import {
  TYPES_IMAGE_ACCEPTES,
  TYPES_VIDEO_ACCEPTES,
  TAILLE_IMAGE_MAX_OCTETS,
  TAILLE_VIDEO_MAX_OCTETS,
} from "@/modules/stockage/StorageProvider";

/** Types de fichiers acceptés pour une publication (photos produit incluses). */
export const TYPES_IMAGE_PUBLICATION = TYPES_IMAGE_ACCEPTES;

export const TYPES_VIDEO_PUBLICATION = TYPES_VIDEO_ACCEPTES;

/** Poids max d'une image : même plafond que les images produit (2 Mo). */
export const TAILLE_IMAGE_PUBLICATION_MAX_OCTETS = TAILLE_IMAGE_MAX_OCTETS;

/** Poids max d'une vidéo : 15 Mo (~30-45 s d'enregistrement téléphone). */
export const TAILLE_VIDEO_PUBLICATION_MAX_OCTETS = TAILLE_VIDEO_MAX_OCTETS;

/** Durée max d'une vidéo : 45 secondes (vérifiée côté client sur les métadonnées). */
export const DUREE_VIDEO_MAX_SECONDES = 45;

/** Nombre max de médias (images + vidéos) par publication. */
export const MAX_MEDIAS_PAR_PUBLICATION = 5;

/** Une seule vidéo par publication : un fil à lecture au clic, pas un album. */
export const MAX_VIDEOS_PAR_PUBLICATION = 1;

/** Tags produits par publication (la conversion sans transformer le fil en catalogue). */
export const MAX_TAGS_PRODUITS = 4;

/** Longueur de la légende (vide autorisée : une photo peut se suffire). */
export const TEXTE_PUBLICATION_MAX = 500;

export type TypeMedia = "IMAGE" | "VIDEO";

/** Erreurs de validation d'un fichier média. */
export type CodeErreurMedia =
  | "TYPE_INVALIDE"
  | "TROP_LOURDE"
  | "DUREE_TROP_LONGUE";

export type CodeErreurPublication =
  | "TEXTE_TROP_LONG"
  | "AUCUN_MEDIA"
  | "TROP_DE_MEDIAS"
  | "TROP_DE_VIDEOS"
  | "TROP_DE_TAGS";

export type Resultat<TCode> = { ok: true } | { ok: false; code: TCode };

/**
 * Classe un fichier proposé : image ou vidéo, dans les limites.
 * `dureeSecondes` n'est pertinent que pour une vidéo (capturée côté client
 * sur les métadonnées du fichier — un client malicieux peut mentir, la
 * modération a posteriori et le poids max côté serveur complètent).
 */
export function validerMedia(input: {
  typeMime: string;
  tailleOctets: number;
  dureeSecondes?: number;
}):
  | { ok: true; type: TypeMedia }
  | { ok: false; code: CodeErreurMedia } {
  const estImage = (TYPES_IMAGE_PUBLICATION as readonly string[]).includes(
    input.typeMime,
  );
  const estVideo = (TYPES_VIDEO_PUBLICATION as readonly string[]).includes(
    input.typeMime,
  );

  if (estImage) {
    if (input.tailleOctets > TAILLE_IMAGE_PUBLICATION_MAX_OCTETS) {
      return { ok: false, code: "TROP_LOURDE" };
    }
    return { ok: true, type: "IMAGE" };
  }

  if (estVideo) {
    if (input.tailleOctets > TAILLE_VIDEO_PUBLICATION_MAX_OCTETS) {
      return { ok: false, code: "TROP_LOURDE" };
    }
    if (
      input.dureeSecondes != null &&
      input.dureeSecondes > DUREE_VIDEO_MAX_SECONDES
    ) {
      return { ok: false, code: "DUREE_TROP_LONGUE" };
    }
    return { ok: true, type: "VIDEO" };
  }

  return { ok: false, code: "TYPE_INVALIDE" };
}

/**
 * Valide la composition complète d'une publication : légende, listes de
 * médias (doublons de produit exclus par la base, pas ici) et tags produits.
 * Le nombre de vidéos est borné séparément : une vidéo pèse le poids de
 * plusieurs images, le plafond doit porter dessus.
 */
export function validerPublication(input: {
  texte: string;
  medias: { typeMime: string; tailleOctets: number }[];
  produitIds: string[];
}): Resultat<CodeErreurPublication> {
  if (input.texte.length > TEXTE_PUBLICATION_MAX) {
    return { ok: false, code: "TEXTE_TROP_LONG" };
  }
  if (input.medias.length === 0) {
    return { ok: false, code: "AUCUN_MEDIA" };
  }
  if (input.medias.length > MAX_MEDIAS_PAR_PUBLICATION) {
    return { ok: false, code: "TROP_DE_MEDIAS" };
  }
  const nbVideos = input.medias.filter((m) =>
    (TYPES_VIDEO_PUBLICATION as readonly string[]).includes(m.typeMime),
  ).length;
  if (nbVideos > MAX_VIDEOS_PAR_PUBLICATION) {
    return { ok: false, code: "TROP_DE_VIDEOS" };
  }
  if (dedupliquer(input.produitIds).length > MAX_TAGS_PRODUITS) {
    return { ok: false, code: "TROP_DE_TAGS" };
  }
  return { ok: true };
}

/** Retire les identifiants répétés en conservant le premier ordre. */
export function dedupliquer(ids: string[]): string[] {
  return [...new Set(ids)];
}

/** Traduit un code de validation en message affichable (français). */
export function messageErreurPublication(code: string): string {
  switch (code) {
    case "TYPE_INVALIDE":
      return "Format non accepté (JPEG, PNG, WEBP ou vidéo MP4).";
    case "TROP_LOURDE":
      return "Fichier trop lourd (2 Mo pour une image, 15 Mo pour une vidéo).";
    case "CORPS_TRONQUE":
      return "Transfert interrompu : le fichier n'est pas arrivé en entier. Réessayez (réseau instable souvent en mobile data).";
    case "DUREE_TROP_LONGUE":
      return `Vidéo trop longue : ${DUREE_VIDEO_MAX_SECONDES} secondes maximum.`;
    case "TEXTE_TROP_LONG":
      return `Légende trop longue (${TEXTE_PUBLICATION_MAX} caractères maximum).`;
    case "AUCUN_MEDIA":
      return "Ajoutez au moins une photo ou une vidéo.";
    case "TROP_DE_MEDIAS":
      return `${MAX_MEDIAS_PAR_PUBLICATION} médias maximum par publication.`;
    case "TROP_DE_VIDEOS":
      return "Une seule vidéo par publication.";
    case "TROP_DE_TAGS":
      return `${MAX_TAGS_PRODUITS} produits maximum par publication.`;
    default:
      return "Publication invalide.";
  }
}
