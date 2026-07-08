import { z } from "zod";

export const avisSchema = z.object({
  produitId: z.string().min(1),
  note: z.coerce
    .number({ invalid_type_error: "Note invalide." })
    .int()
    .min(1, "La note va de 1 à 5.")
    .max(5, "La note va de 1 à 5."),
  commentaire: z.string().trim().max(1000).optional(),
});

export type AvisInput = z.infer<typeof avisSchema>;
