import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Logique PURE du module WhatsApp (testable sans I/O) : normalisation des
 * numéros camerounais et vérification de signature de webhook.
 */

/**
 * Normalise un numéro camerounais en E.164 sans "+" (format attendu par
 * l'API WhatsApp), ex. "670000000" ou "+237 670 000 000" -> "237670000000".
 * `null` si le numéro n'a pas la forme d'un numéro camerounais valide.
 */
export function normaliserTelephoneCM(telephone: string): string | null {
  const chiffres = telephone.replace(/\D/g, "");
  const local = chiffres.startsWith("237") ? chiffres.slice(3) : chiffres;
  if (!/^[26]\d{7,8}$/.test(local)) return null;
  return `237${local}`;
}

/**
 * Vérifie la signature X-Hub-Signature-256 d'un webhook Meta : HMAC-SHA256
 * du corps BRUT (avant tout parsing JSON) avec l'App Secret, comparé en
 * temps constant pour éviter les attaques par timing.
 */
export function verifierSignatureWebhook(
  appSecret: string,
  corpsBrut: string,
  enTeteSignature: string | null,
): boolean {
  if (!enTeteSignature?.startsWith("sha256=")) return false;
  const signatureRecue = enTeteSignature.slice("sha256=".length);
  const signatureAttendue = createHmac("sha256", appSecret)
    .update(corpsBrut)
    .digest("hex");

  const bufRecue = Buffer.from(signatureRecue, "hex");
  const bufAttendue = Buffer.from(signatureAttendue, "hex");
  if (bufRecue.length !== bufAttendue.length) return false;
  return timingSafeEqual(bufRecue, bufAttendue);
}

/** Durée de la fenêtre de service gratuite Meta après un message entrant. */
export const FENETRE_SERVICE_HEURES = 24;

export function calculerFinFenetreService(maintenant: Date): Date {
  return new Date(maintenant.getTime() + FENETRE_SERVICE_HEURES * 60 * 60 * 1000);
}

export function fenetreServiceOuverte(
  finFenetre: Date | null,
  maintenant: Date,
): boolean {
  return finFenetre !== null && finFenetre > maintenant;
}

export type StatutNotifiableWhatsApp =
  | "CONFIRMEE"
  | "EN_PREPARATION"
  | "EXPEDIEE"
  | "LIVREE";

const LIBELLES_STATUT: Record<StatutNotifiableWhatsApp, string> = {
  CONFIRMEE: "confirmée",
  EN_PREPARATION: "en préparation",
  EXPEDIEE: "expédiée",
  LIVREE: "livrée",
};

/** Structure minimale utile du payload webhook Meta (le reste est ignoré). */
interface ChargeWebhookWhatsApp {
  object?: string;
  entry?: {
    changes?: {
      value?: {
        messages?: { from?: string }[];
      };
    }[];
  }[];
}

/** Extrait les numéros expéditeurs des messages entrants d'un payload webhook. */
export function extraireExpediteurs(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) return [];
  const charge = payload as ChargeWebhookWhatsApp;
  if (charge.object !== "whatsapp_business_account") return [];

  const expediteurs: string[] = [];
  for (const entry of charge.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.from) expediteurs.push(message.from);
      }
    }
  }
  return expediteurs;
}

/** Texte libre (fenêtre de service gratuite) pour une mise à jour de statut. */
export function construireTexteStatut(
  numeroCommande: string,
  statut: StatutNotifiableWhatsApp,
  urlSite: string,
): string {
  return `NILE — Votre commande ${numeroCommande} est ${LIBELLES_STATUT[statut]}. Suivez-la sur ${urlSite}/commandes`;
}
