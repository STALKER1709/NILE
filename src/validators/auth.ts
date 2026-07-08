import { z } from "zod";

/**
 * Schémas de validation des entrées d'authentification.
 * Toute donnée venant d'un formulaire passe par ici avant d'atteindre la logique.
 */

// Téléphone camerounais : optionnellement +237, puis 8 à 12 chiffres.
// Volontairement permissif (formats variés) mais non vide.
const telephoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+?237)?\s?[26]\d{7,8}$/,
    "Numéro de téléphone camerounais invalide (ex : 6XX XXX XXX).",
  );

export const roleInscriptionSchema = z.enum(["ACHETEUR", "VENDEUR"]);

export const inscriptionSchema = z
  .object({
    nom: z.string().trim().min(2, "Le nom est trop court.").max(120),
    email: z.string().trim().toLowerCase().email("Email invalide."),
    telephone: telephoneSchema,
    motDePasse: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères.")
      .max(200),
    role: roleInscriptionSchema,
    nomBoutique: z.string().trim().max(120).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === "VENDEUR") {
      if (!val.nomBoutique || val.nomBoutique.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nomBoutique"],
          message: "Le nom de la boutique est requis pour un vendeur.",
        });
      }
    }
  });

export const connexionSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide."),
  motDePasse: z.string().min(1, "Mot de passe requis."),
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;
export type ConnexionInput = z.infer<typeof connexionSchema>;
