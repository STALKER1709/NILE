import { z } from "zod";

export const annonceSchema = z.object({
  titre: z.string().trim().min(3, "Titre trop court.").max(150),
  contenu: z.string().trim().min(3, "Contenu trop court.").max(4000),
  epinglee: z.coerce.boolean().optional().default(false),
});

export type AnnonceInput = z.infer<typeof annonceSchema>;
