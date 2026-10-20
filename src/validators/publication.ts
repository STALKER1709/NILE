import { z } from "zod";
import {
  MAX_MEDIAS_PAR_PUBLICATION,
  MAX_TAGS_PRODUITS,
  TEXTE_PUBLICATION_MAX,
} from "@/modules/reels/reels-core";

/**
 * Entrées du composeur de publications. Le poids et la durée des fichiers ne
 * sont pas dans ce schéma (ils vivent dans reels-core et sont vérifiés au
 * moment de l'envoi/confirmation du fichier lui-même) — ici, on valide la
 * FORME de ce qui vient du navigateur.
 */

/** Un média déjà téléversé, tel que le navigateur le décrit après confirmation. */
export const mediaPublicationSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]),
  // Clé de stockage retournée par la confirmation serveur. Le serveur la
  // revalide contre le préfixe `publications/<vendeur id>/` : le navigateur
  // ne peut pas désigner un fichier qui n'est pas le sien.
  chemin: z.string().min(1).max(300),
  posterChemin: z.string().min(1).max(300).nullable().optional(),
});

export const publicationSchema = z.object({
  texte: z
    .string()
    .trim()
    .max(
      TEXTE_PUBLICATION_MAX,
      `Légende trop longue (${TEXTE_PUBLICATION_MAX} caractères maximum).`,
    )
    .default(""),
  medias: z
    .array(mediaPublicationSchema)
    .min(1, "Ajoutez au moins une photo ou une vidéo.")
    .max(
      MAX_MEDIAS_PAR_PUBLICATION,
      `${MAX_MEDIAS_PAR_PUBLICATION} médias maximum par publication.`,
    ),
  produitIds: z
    .array(z.string().min(1))
    .max(
      MAX_TAGS_PRODUITS,
      `${MAX_TAGS_PRODUITS} produits maximum par publication.`,
    ),
});

export type PublicationInput = z.infer<typeof publicationSchema>;
export type MediaPublicationInput = z.infer<typeof mediaPublicationSchema>;
