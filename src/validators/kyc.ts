import { z } from "zod";

export const typePieceIdentiteSchema = z.enum(["CNI", "PASSEPORT"]);

const dateExpirationSchema = z
  .string()
  .optional()
  .transform((val) => {
    const value = val?.trim();
    if (!value) return null;
    // Les formulaires date HTML transmettent YYYY-MM-DD. Vérifier le format
    // et la date calendaire avant de construire une Date persistable.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(Number.NaN);
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      return new Date(Number.NaN);
    }
    return parsed;
  })
  .refine((date) => {
    if (date === null) return true;
    if (!Number.isFinite(date.getTime())) return false;
    const todayUtc = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    return date.getTime() >= todayUtc.getTime();
  }, "La date d'expiration doit être une date valide et ne pas être dépassée.");

export const soumissionKycFormSchema = z.object({
  nomComplet: z
    .string()
    .trim()
    .min(2, "Le nom complet doit comporter au moins 2 caractères.")
    .max(150, "Le nom est trop long."),
  typePiece: typePieceIdentiteSchema.default("CNI"),
  numeroPiece: z
    .string()
    .trim()
    .min(4, "Le numéro de pièce d'identité doit comporter au moins 4 caractères.")
    .max(60, "Le numéro de pièce est trop long."),
  dateExpirationPiece: dateExpirationSchema,
  estEntreprise: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true" || val === "on" || val === "1"),
  nomEntreprise: z
    .string()
    .trim()
    .max(150, "Le nom de l'entreprise est trop long.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  niu: z
    .string()
    .trim()
    .max(60, "Le NIU est trop long.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  rccm: z
    .string()
    .trim()
    .max(60, "Le RCCM est trop long.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const rejetKycSchema = z.object({
  vendeurId: z.string().min(1, "Identifiant vendeur requis."),
  motif: z
    .string()
    .trim()
    .min(5, "Le motif du rejet doit comporter au moins 5 caractères.")
    .max(500, "Le motif est trop long (500 caractères max)."),
});

export type SoumissionKycFormInput = z.infer<typeof soumissionKycFormSchema>;
export type RejetKycInput = z.infer<typeof rejetKycSchema>;
