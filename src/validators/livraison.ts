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

/**
 * Remise contre code de réception. Le code est nettoyé de ses espaces et
 * tirets : le livreur saisit souvent « 123 456 » en recopiant l'écran.
 */
export const codeRemiseSchema = z.object({
  commandeId: z.string().min(1),
  code: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 6, "Le code doit comporter 6 chiffres."),
  mode: z.enum(["SCAN", "MANUEL"]),
  /** Numéro de commande lu dans le QR, pour refuser un colis qui n'est pas le bon. */
  numeroAttendu: z.string().trim().min(1).optional(),
});

/** Forçage administrateur d'une livraison, sans code : motif obligatoire. */
export const forcageLivraisonSchema = z.object({
  commandeId: z.string().min(1),
  motif: z
    .string()
    .trim()
    .min(5, "Indiquez pourquoi la livraison est validée sans code.")
    .max(300),
});
