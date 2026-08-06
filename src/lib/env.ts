import { z } from "zod";
// Depuis `hrskills-cles` et non `hrskills-core` : ce fichier est chargé par le
// middleware (runtime Edge), où une dépendance à `node:crypto` casse le build.
import { clesCoherentes } from "@/modules/paiement/hrskills/hrskills-cles";

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

    // URL publique du site (SEO : liens absolus des sitemap/Open Graph).
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url()
      .default("https://nile-beige.vercel.app"),

    // Notifications push (Web Push / VAPID). Génère la paire de clés avec :
    //   npx web-push generate-vapid-keys
    // Les deux clés doivent être présentes pour activer le push.
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),

    // Contact / support client (affichés seulement si renseignés).
    // WhatsApp : numéro international SANS + ni espaces (ex. 2376XXXXXXXX).
    CONTACT_WHATSAPP: z.string().regex(/^\d{8,15}$/).optional(),
    CONTACT_EMAIL: z.string().email().optional(),
    // Délai de livraison affiché aux acheteurs (ex. "24-72 h à Douala et
    // Yaoundé, 2 à 5 jours ailleurs"). Vide = non affiché.
    DELAI_LIVRAISON_TEXTE: z.string().optional(),

    PAYMENT_PROVIDER: z.enum(["mock", "monetbil", "hrskills"]).default("mock"),
    MONETBIL_SERVICE_KEY: z.string().optional(),
    MONETBIL_SERVICE_SECRET: z.string().optional(),

    // HR-Skills Pay (MTN MoMo + Orange Money, 16 pays africains).
    // Clé A (en-tête Authorization: Bearer) et Clé B (échangée contre un token
    // de transaction, et renvoyée dans X-API-Secret). Aucune des deux ne doit
    // atteindre le navigateur. Dashboard > Développeurs. Requises quand
    // PAYMENT_PROVIDER="hrskills", et toutes deux du même environnement.
    HRSKILLS_CLE_A: z.string().optional(),
    HRSKILLS_CLE_B: z.string().optional(),
    // Secret de signature des webhooks (Dashboard > Paramètres > Webhooks).
    HRSKILLS_WEBHOOK_SECRET: z.string().optional(),
    // URL de base de l'API. Sandbox et production partagent la même URL :
    // c'est le préfixe des clés (test/live) qui détermine l'environnement.
    HRSKILLS_BASE_URL: z.string().url().default("https://api.hrskills-pay.com"),
    // Secret utilisé par le fournisseur de paiement "mock" pour signer les
    // notifications simulées (dev/tests uniquement).
    MOCK_PAYMENT_SECRET: z.string().default("dev-payment-secret"),

    // Stockage des images produit :
    //   "local"    -> dossier public/uploads (développement).
    //   "supabase" -> bucket Supabase Storage (production).
    STORAGE_PROVIDER: z.enum(["local", "supabase"]).default("local"),
    SUPABASE_STORAGE_BUCKET: z.string().default("produits"),

    // Email transactionnel (confirmations de commande) :
    //   "mock"  -> journalise seulement (développement).
    //   "brevo" -> envoi réel via Brevo (production).
    EMAIL_PROVIDER: z.enum(["mock", "brevo"]).default("mock"),
    BREVO_API_KEY: z.string().optional(),
    // Adresse expéditrice validée dans Brevo (Senders & IP > Senders).
    EMAIL_EXPEDITEUR: z.string().email().optional(),
    EMAIL_EXPEDITEUR_NOM: z.string().default("NILE Marketplace"),

    // Notifications de commande par WhatsApp (WhatsApp Cloud API, Meta) :
    //   "mock" -> journalise seulement (développement).
    //   "meta" -> envoi réel via l'API Cloud de Meta (production).
    WHATSAPP_PROVIDER: z.enum(["mock", "meta"]).default("mock"),
    // Identifiant Graph API du numéro expéditeur (WhatsApp Manager > numéro).
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    // Token permanent (Business Settings > System Users > générer un token).
    WHATSAPP_TOKEN: z.string().optional(),
    // App Secret (App Dashboard > Settings > Basic) : signe les webhooks.
    WHATSAPP_APP_SECRET: z.string().optional(),
    // Chaîne arbitraire choisie par toi, à recopier dans la config du webhook
    // Meta (WhatsApp Manager > Configuration > Webhook > Verify token).
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    // Version de l'API Graph utilisée. Meta déprécie une version tous les ~2
    // ans : si les envois échouent un jour avec "Unsupported API version",
    // c'est probablement ici qu'il faut regarder en premier.
    WHATSAPP_API_VERSION: z.string().default("v21.0"),
    // Nom du template "utility" approuvé par Meta pour les mises à jour de
    // statut, hors fenêtre gratuite de 24h. Vide = ces envois sont ignorés
    // (journalisés) tant qu'aucun template n'est validé.
    WHATSAPP_TEMPLATE_STATUT: z.string().optional(),

    // Secret partagé protégeant les routes déclenchées par un planificateur
    // externe (GitHub Actions) : rappels de confirmation de réception.
    // Vide = ces routes répondent 503 (fonction inactive), jamais ouvertes.
    CRON_SECRET: z.string().min(16).optional(),

    COD_PLAFOND_XAF: z.coerce.number().int().positive().default(150000),
    // Commission NILE (%) sur les ventes des vendeurs tiers (reversements).
    //
    // Ce taux n'est PAS la marge : il doit d'abord couvrir les 2 % prélevés par
    // l'agrégateur Mobile Money, que NILE supporte seule puisque le vendeur est
    // payé sur le montant affiché à l'acheteur et non sur le montant reçu. Sur
    // 10 000 FCFA, NILE encaisse 9 800, doit 8 800 au vendeur, et garde 1 000 —
    // soit 10 % nets pour 12 % affichés. Le ramener à 10 % ferait retomber la
    // marge réelle à 8 %.
    //
    // Surchargeable en base (clé `commission_pourcent` de la table
    // Configuration), qui l'emporte alors sur cette variable — voir
    // `modules/commande/config.ts`.
    COMMISSION_POURCENT: z.coerce.number().min(0).max(100).default(12),
    // Dette de commission (FCFA) au-delà de laquelle un vendeur ne peut plus
    // vendre en paiement à la livraison — ses produits restent en vente, mais
    // en Mobile Money seulement. Auto-correcteur : ses ventes suivantes
    // transitent par NILE, la commission se prélève d'elle-même et la dette
    // s'éteint. 0 désactive le garde-fou.
    COD_DETTE_PLAFOND_XAF: z.coerce.number().int().min(0).default(25000),
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
    if (val.PAYMENT_PROVIDER === "monetbil") {
      if (!val.MONETBIL_SERVICE_KEY || !val.MONETBIL_SERVICE_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MONETBIL_SERVICE_KEY"],
          message:
            'MONETBIL_SERVICE_KEY et MONETBIL_SERVICE_SECRET requis quand PAYMENT_PROVIDER="monetbil".',
        });
      }
    }
    if (val.PAYMENT_PROVIDER === "hrskills") {
      if (!val.HRSKILLS_CLE_A || !val.HRSKILLS_CLE_B) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HRSKILLS_CLE_A"],
          message:
            'HRSKILLS_CLE_A et HRSKILLS_CLE_B requis quand PAYMENT_PROVIDER="hrskills".',
        });
      } else if (!clesCoherentes(val.HRSKILLS_CLE_A, val.HRSKILLS_CLE_B)) {
        // Les deux clés sont copiées séparément depuis le tableau de bord.
        // Mélanger un environnement avec l'autre — ou poser une clé sans
        // marqueur lisible — enverrait des appels de production authentifiés
        // par un secret de test, ou l'inverse. On refuse de démarrer.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HRSKILLS_CLE_A"],
          message:
            "HRSKILLS_CLE_A et HRSKILLS_CLE_B doivent porter le même environnement : soit les deux en _test_, soit les deux en _live_ (ex. hrsk_pk_live_… avec hrsk_sk_live_…).",
        });
      }
      if (!val.HRSKILLS_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HRSKILLS_WEBHOOK_SECRET"],
          message:
            "HRSKILLS_WEBHOOK_SECRET requis : sans lui, la signature des webhooks ne peut pas être vérifiée et n'importe qui pourrait déclarer une commande payée.",
        });
      }
    }
    if (val.EMAIL_PROVIDER === "brevo") {
      if (!val.BREVO_API_KEY || !val.EMAIL_EXPEDITEUR) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["BREVO_API_KEY"],
          message:
            'BREVO_API_KEY et EMAIL_EXPEDITEUR requis quand EMAIL_PROVIDER="brevo".',
        });
      }
    }
    if (val.WHATSAPP_PROVIDER === "meta") {
      if (
        !val.WHATSAPP_PHONE_NUMBER_ID ||
        !val.WHATSAPP_TOKEN ||
        !val.WHATSAPP_APP_SECRET ||
        !val.WHATSAPP_VERIFY_TOKEN
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["WHATSAPP_PHONE_NUMBER_ID"],
          message:
            'WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TOKEN, WHATSAPP_APP_SECRET et WHATSAPP_VERIFY_TOKEN requis quand WHATSAPP_PROVIDER="meta".',
        });
      }
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

/**
 * Retire les guillemets qui entourent une valeur.
 *
 * Dans un fichier `.env`, dotenv retire lui-même les guillemets : on écrit
 * donc `PAYMENT_PROVIDER="hrskills"`. L'interface de Vercel, elle, enregistre
 * la valeur littéralement — recopier la ligne telle quelle y produit la chaîne
 * `"hrskills"`, guillemets compris.
 *
 * Sur une énumération l'erreur est bruyante, donc bénigne. Sur une clé d'API
 * elle est silencieuse et bien plus coûteuse : la clé part avec ses
 * guillemets, le fournisseur répond « clé invalide », et on cherche le
 * problème du mauvais côté. On normalise donc à l'entrée.
 *
 * Une valeur légitime commençant ET finissant par un guillemet serait altérée ;
 * le cas ne se rencontre pas parmi les variables déclarées ici (identifiants,
 * URL, énumérations, nombres).
 */
function sansGuillemets(valeur: string): string {
  const t = valeur.trim();
  if (t.length >= 2) {
    const debut = t[0];
    if ((debut === '"' || debut === "'") && t[t.length - 1] === debut) {
      return t.slice(1, -1);
    }
  }
  return t;
}

const brut: Record<string, string> = {};
for (const [cle, valeur] of Object.entries(process.env)) {
  if (typeof valeur === "string") brut[cle] = sansGuillemets(valeur);
}

const parsed = schema.safeParse(brut);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  // Journalisé séparément : lors d'un build hébergé (Vercel), l'erreur levée
  // est ré-emballée et seule sa première ligne apparaît dans les logs, ce qui
  // masquerait justement le nom des variables fautives.
  console.error(
    `[env] Variables d'environnement invalides :\n${details}\n` +
      "Renseigne-les dans .env en local, ou dans Vercel > Settings > " +
      "Environment Variables en production (voir .env.example).",
  );
  throw new Error(
    `Variables d'environnement invalides :\n${details}\n` +
      "Vérifie ton .env en local, ou les Environment Variables du projet Vercel " +
      "(voir .env.example).",
  );
}

export const env = parsed.data;
export type Env = typeof env;
