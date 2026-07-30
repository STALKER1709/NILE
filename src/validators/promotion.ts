import { z } from "zod";

/**
 * Formulaire de création de promotion, côté vendeur. `produitId` vide =
 * promotion boutique entière. Les dates sont saisies en `datetime-local`
 * (chaîne locale sans fuseau) : converties en `Date` ici.
 */
export const promotionFormSchema = z
  .object({
    produitId: z.string().trim().optional(),
    type: z.enum(["POURCENTAGE", "MONTANT"]),
    valeur: z.coerce.number({ invalid_type_error: "Valeur invalide." }).int(),
    dateDebut: z.coerce.date({ invalid_type_error: "Date de début invalide." }),
    dateFin: z.coerce.date({ invalid_type_error: "Date de fin invalide." }),
  })
  .transform((val) => ({
    ...val,
    produitId: val.produitId && val.produitId.length > 0 ? val.produitId : null,
  }));

export type PromotionFormInput = z.infer<typeof promotionFormSchema>;
