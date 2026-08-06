import { z } from "zod";

const telephoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+?237)?\s?[26]\d{7,8}$/,
    "Numéro de téléphone camerounais invalide (ex : 6XX XXX XXX).",
  );

/** Adresse de livraison — adressage informel camerounais (repères libres). */
export const adresseLivraisonSchema = z.object({
  destNom: z.string().trim().min(2, "Nom du destinataire requis.").max(120),
  destTelephone: telephoneSchema,
  ville: z.string().trim().min(2, "Ville requise.").max(80),
  quartier: z.string().trim().min(2, "Quartier requis.").max(120),
  reperes: z.string().trim().max(500).optional(),
});

export const ajoutPanierSchema = z.object({
  /** Déclinaison visée : c'est elle, et non le produit, qui entre au panier. */
  varianteId: z.string().min(1),
  quantite: z.coerce
    .number({ invalid_type_error: "Quantité invalide." })
    .int("Quantité invalide.")
    .positive("La quantité doit être d'au moins 1.")
    .max(1000, "Quantité trop élevée."),
});

export const majQuantiteSchema = z.object({
  ligneId: z.string().min(1),
  quantite: z.coerce.number().int().min(0).max(1000),
});

export type AdresseLivraisonInput = z.infer<typeof adresseLivraisonSchema>;
