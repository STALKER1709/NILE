import { z } from "zod";

export const affectationSchema = z.object({
  commandeId: z.string().min(1),
  transporteur: z
    .string()
    .trim()
    .min(2, "Nom du transporteur requis.")
    .max(120),
});

export type AffectationInput = z.infer<typeof affectationSchema>;
