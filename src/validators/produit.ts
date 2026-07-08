import { z } from "zod";

/**
 * Validation des entrées produit. Le prix est un ENTIER FCFA (jamais de décimale).
 */
export const produitSchema = z.object({
  titre: z.string().trim().min(3, "Le titre est trop court.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "La description est trop courte.")
    .max(5000),
  prix: z.coerce
    .number({ invalid_type_error: "Prix invalide." })
    .int("Le prix doit être un entier (FCFA).")
    .positive("Le prix doit être supérieur à 0."),
  stock: z.coerce
    .number({ invalid_type_error: "Stock invalide." })
    .int("Le stock doit être un entier.")
    .min(0, "Le stock ne peut pas être négatif."),
  categorieId: z.string().min(1, "Choisis une catégorie."),
});

export const statutPubliableSchema = z.enum([
  "BROUILLON",
  "ACTIF",
  "INACTIF",
]);

export type ProduitInput = z.infer<typeof produitSchema>;
