import { z } from "zod";

export const categorieSchema = z.object({
  nom: z.string().trim().min(2, "Le nom est trop court.").max(80),
  parentId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CategorieInput = z.infer<typeof categorieSchema>;
