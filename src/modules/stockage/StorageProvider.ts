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

export interface StorageProvider {
  enregistrer(fichier: FichierAEnregistrer): Promise<FichierEnregistre>;
  supprimer(chemin: string): Promise<void>;
}

/** Types d'images acceptés et taille maximale (pages légères). */
export const TYPES_IMAGE_ACCEPTES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const TAILLE_IMAGE_MAX_OCTETS = 2 * 1024 * 1024; // 2 Mo

export function extensionDepuisMime(typeMime: string): string {
  switch (typeMime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
