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

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalide.");

export const nouveauMotDePasseSchema = z
  .object({
    motDePasse: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères.")
      .max(200),
    confirmation: z.string(),
  })
  .refine((v) => v.motDePasse === v.confirmation, {
    path: ["confirmation"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

/**
 * Édition du profil. L'email n'y figure pas : il sert d'identifiant
 * d'authentification et l'interface AuthProvider n'expose aucune opération de
 * changement d'email — le proposer serait un champ sans effet.
 */
export const profilSchema = z.object({
  nom: z.string().trim().min(2, "Le nom est trop court.").max(120),
  telephone: telephoneSchema,
});

/** Édition de la boutique par le vendeur lui-même. */
export const boutiqueSchema = z.object({
  nomBoutique: z
    .string()
    .trim()
    .min(2, "Le nom de la boutique est trop court.")
    .max(120),
  description: z
    .string()
    .trim()
    .max(1000, "La description ne peut pas dépasser 1000 caractères.")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/**
 * Coordonnées de reversement du vendeur : les numéros Mobile Money sur
 * lesquels NILE lui envoie ses gains. Les deux sont facultatifs, mais au
 * moins un doit être renseigné pour qu'un reversement soit possible.
 */
export const infosPaiementSchema = z
  .object({
    momoMtn: telephoneSchema.optional().or(z.literal("").transform(() => undefined)),
    momoOrange: telephoneSchema.optional().or(z.literal("").transform(() => undefined)),
    titulaire: z.string().trim().max(120).optional().transform((v) => (v ? v : undefined)),
  })
  .refine((v) => v.momoMtn || v.momoOrange, {
    path: ["momoMtn"],
    message: "Renseignez au moins un numéro MTN MoMo ou Orange Money.",
  });

export type InscriptionInput = z.infer<typeof inscriptionSchema>;
export type ConnexionInput = z.infer<typeof connexionSchema>;
export type ProfilInput = z.infer<typeof profilSchema>;
export type BoutiqueInput = z.infer<typeof boutiqueSchema>;
export type InfosPaiementInput = z.infer<typeof infosPaiementSchema>;
