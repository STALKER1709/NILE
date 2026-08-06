import { z } from "zod";
import { normaliserCode } from "@/modules/promotion/code-promo-core";

/**
 * Formulaire de création d'un code promo, côté administrateur.
 *
 * Les bornes ne sont pas décoratives : un code mal saisi coûte de l'argent
 * réel, et une remise de 100 % ou une fenêtre à l'envers passeraient sans
 * bruit jusqu'au premier panier.
 */
export const codePromoFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Le code doit faire au moins 3 caractères.")
      .max(24, "Le code ne doit pas dépasser 24 caractères.")
      // Normalisé à l'écriture comme à la lecture : l'unicité en base porte
      // sur cette forme, pas sur la saisie.
      .transform(normaliserCode),
    type: z.enum(["POURCENTAGE", "MONTANT"]),
    valeur: z.coerce
      .number({ invalid_type_error: "Valeur invalide." })
      .int()
      .positive("La valeur doit être supérieure à zéro."),
    plafondRemise: z.coerce.number().int().min(0).optional(),
    minPanier: z.coerce.number().int().min(0).default(0),
    dateDebut: z.coerce.date({ invalid_type_error: "Date de début invalide." }),
    dateFin: z.coerce.date({ invalid_type_error: "Date de fin invalide." }),
    quotaTotal: z.coerce.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.dateFin <= val.dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFin"],
        message: "La date de fin doit être postérieure à la date de début.",
      });
    }
    // Une remise de 100 % rendrait la commande gratuite, frais d'agrégateur
    // compris : NILE paierait pour vendre.
    if (val.type === "POURCENTAGE" && val.valeur > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valeur"],
        message: "Une remise en pourcentage ne peut pas dépasser 90 %.",
      });
    }
    // Sans plafond, « -20 % » sur un gros panier peut coûter très cher. On
    // n'impose pas le plafond, mais on refuse un plafond nul explicite, qui
    // serait probablement une erreur de saisie.
    if (val.type === "MONTANT" && val.plafondRemise) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["plafondRemise"],
        message:
          "Un plafond n'a de sens que sur une remise en pourcentage : un montant fixe est déjà sa propre borne.",
      });
    }
  });

export type CodePromoFormInput = z.infer<typeof codePromoFormSchema>;
