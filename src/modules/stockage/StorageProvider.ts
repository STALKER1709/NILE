/**
 * Interface abstraite de stockage de fichiers (images produit).
 *
 * Même philosophie que l'auth et le paiement : le code métier ne connaît que
 * cette interface. Deux implémentations :
 *   - LocalStorageProvider    : dossier public/uploads (développement).
 *   - SupabaseStorageProvider : bucket Supabase Storage (production).
 */

export interface FichierAEnregistrer {
  nomOriginal: string;
  typeMime: string;
  contenu: Buffer;
}

export interface FichierEnregistre {
  /** URL publique affichable (dans <img src>). */
  url: string;
  /** Clé de stockage, conservée pour pouvoir supprimer le fichier ensuite. */
  chemin: string;
}

/** Fichier confirmé : l'URL publique + le poids RÉELlement téléversé. */
export interface FichierConfirme extends FichierEnregistre {
  tailleOctets: number;
}

/**
 * Ticket d'envoi direct. `url` est soit une URL signée Supabase, soit la
 * route locale de développement — le navigateur suit le même chemin dans les
 * deux cas (une requête PUT, puis confirmation serveur).
 */
/**
 * Ticket d'envoi direct. `url` est soit une URL signée Supabase, soit la
 * route locale de développement — le navigateur suit le même chemin dans les
 * deux cas (une requête PUT, puis confirmation serveur).
 */
export interface TicketUpload {
  url: string;
  methode: "PUT";
  /** Clé finale du fichier, à transmettre à la confirmation. */
  chemin: string;
  /**
   * "signe"  -> URL signée Supabase : corps FormData (cacheControl + fichier).
   * "local"  -> route locale de dev : corps brut + en-têtes x-chemin/content-type.
   * Le composeur ne devine jamais d'après la forme de l'URL.
   */
  mode: "signe" | "local";
}

/**
 * Erreur de stockage portant un code métier, pour que l'appelant puisse
 * distinguer un fichier absent d'un fichier trop lourd sans lire de message.
 * Les codes inconnus restent des exceptions : jamais de catch silencieux.
 */
export class ErreurStockage extends Error {
  constructor(
    public code: "ABSENT" | "TROP_LOURDE" | "TYPE_INVALIDE" | "INACCESSIBLE",
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface StorageProvider {
  enregistrer(fichier: FichierAEnregistrer): Promise<FichierEnregistre>;
  supprimer(chemin: string): Promise<void>;

  /* ---- Envoi direct depuis le navigateur (fichiers lourds) ---- */
  // Une vidéo de 15 Mo dépasse la limite de corps des fonctions serverless
  // (4,5 Mo sur Vercel) : elle ne peut PAS transiter par le serveur. Le
  // navigateur demande un ticket, envoie le fichier lui-même, puis le serveur
  // confirme la réception. Même contrat pour les deux fournisseurs.

  /** Ticket d'envoi : où et comment le navigateur doit envoyer le fichier. */
  preparerUploadDirect(chemin: string): Promise<TicketUpload>;

  /**
   * Après envoi : vérifie que le fichier a bien été reçu (existence et poids
   * réel, pas la taille déclarée) et renvoie son URL publique.
   */
  confirmerUploadDirect(
    chemin: string,
    typeMime: string,
  ): Promise<FichierConfirme>;
}

/** Types d'images acceptés et taille maximale (pages légères). */
export const TYPES_IMAGE_ACCEPTES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const TAILLE_IMAGE_MAX_OCTETS = 2 * 1024 * 1024; // 2 Mo

/**
 * Vidéos acceptées : MP4 seul (H.264, ce que tout téléphone produit).
 * 15 Mo / 45 s : data camerounaise chère — le plafond est un choix produit,
 * pas une limite technique. Pas de transcodage : la modération est a posteriori.
 */
export const TYPES_VIDEO_ACCEPTES = ["video/mp4"] as const;

export const TAILLE_VIDEO_MAX_OCTETS = 15 * 1024 * 1024; // 15 Mo

/** Poids maximum d'un fichier, selon son type. */
export function tailleMaxPourType(typeMime: string): number {
  return (TYPES_VIDEO_ACCEPTES as readonly string[]).includes(typeMime)
    ? TAILLE_VIDEO_MAX_OCTETS
    : TAILLE_IMAGE_MAX_OCTETS;
}

export function extensionDepuisMime(typeMime: string): string {
  switch (typeMime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    default:
      return "bin";
  }
}

/**
 * Type MIME attendu pour une extension donnée, ou null si l'extension n'est
 * pas au catalogue. Sert à vérifier qu'un corps de requête correspond bien à
 * la clé annoncée (un .mp4 ne reçoit pas du JPEG).
 */
export function typeMimeDepuisExtension(ext: string): string | null {
  switch (ext) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    default:
      return null;
  }
}
