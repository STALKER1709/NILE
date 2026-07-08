import { z } from "zod";

/**
 * Validation centralisée des variables d'environnement (côté serveur).
 * À NE PAS importer depuis un composant client : certaines variables
 * (DATABASE_URL, secrets) ne sont disponibles que côté serveur.
 *
 * L'échec de validation est volontairement fatal (fail-fast) : mieux vaut
 * planter au démarrage qu'avoir un comportement imprévisible en production.
 */
const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL manquant"),

    AUTH_PROVIDER: z.enum(["mock", "supabase"]).default("mock"),
    MOCK_AUTH_SECRET: z.string().optional(),

    NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    PAYMENT_PROVIDER: z.enum(["mock", "monetbil"]).default("mock"),
    MONETBIL_SERVICE_KEY: z.string().optional(),
    MONETBIL_SERVICE_SECRET: z.string().optional(),

    COD_PLAFOND_XAF: z.coerce.number().int().positive().default(150000),
    COD_MAX_COMMANDES_NON_ABOUTIES: z.coerce
      .number()
      .int()
      .positive()
      .default(3),

    // Échappatoire explicite pour autoriser le provider "mock" hors dev
    // (ex : environnement de démonstration). Jamais activé par défaut.
    ALLOW_MOCK_AUTH: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
  })
  .superRefine((val, ctx) => {
    if (val.AUTH_PROVIDER === "mock" && !val.MOCK_AUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MOCK_AUTH_SECRET"],
        message: 'MOCK_AUTH_SECRET requis quand AUTH_PROVIDER="mock".',
      });
    }
    if (
      val.MOCK_AUTH_SECRET !== undefined &&
      val.MOCK_AUTH_SECRET.length < 16
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MOCK_AUTH_SECRET"],
        message: "MOCK_AUTH_SECRET doit faire au moins 16 caractères.",
      });
    }
    if (val.AUTH_PROVIDER === "supabase") {
      if (!val.NEXT_PUBLIC_SUPABASE_URL || !val.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NEXT_PUBLIC_SUPABASE_URL"],
          message:
            'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis quand AUTH_PROVIDER="supabase".',
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Variables d'environnement invalides :\n${details}\n` +
      "Vérifie ton fichier .env (voir .env.example).",
  );
}

export const env = parsed.data;
export type Env = typeof env;
