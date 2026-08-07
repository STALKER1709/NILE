import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { StatutPaiementNotifie } from "@/modules/paiement/notification-core";

/**
 * Logique PURE de l'intégration HR-Skills Pay (testable sans réseau).
 *
 * Écrit d'après la documentation « HR-Skills Pay API v1 » fournie. Trois
 * points n'y sont PAS spécifiés et sont donc traités défensivement plutôt
 * que devinés — voir les commentaires à chaque endroit concerné :
 *   1. la casse attendue du champ `operator` (le tableau des paramètres et
 *      l'exemple cURL se contredisent) ;
 *   2. la structure exacte du corps des webhooks (seule la vérification de
 *      signature est documentée) ;
 *   3. le nom exact de l'en-tête de signature (« X-Hub-Signature » au §12).
 */

/* ------------------------------ Environnements ------------------------------- */

// Ces helpers vivent dans `hrskills-cles`, qui ne dépend pas de `node:crypto` :
// `@/lib/env` en a besoin et est chargé par le middleware (runtime Edge). Ils
// sont ré-exportés ici pour que les appelants n'aient qu'un module à connaître.
export {
  environnementCle,
  estCleDeTest,
  clesCoherentes,
  racineHrSkills,
} from "@/modules/paiement/hrskills/hrskills-cles";
export type { EnvironnementHrSkills } from "@/modules/paiement/hrskills/hrskills-cles";

/* ------------------------------- Idempotence --------------------------------- */

const RE_UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function estUuidV4(valeur: string): boolean {
  return RE_UUID_V4.test(valeur);
}

/**
 * Clé d'idempotence d'un encaissement, DÉTERMINISTE : deux tentatives portant
 * sur le même paiement produisent la même clé.
 *
 * C'est tout l'intérêt de l'en-tête. Une clé tirée au hasard à chaque appel
 * n'empêche rien : elle protège seulement des rejeux à l'intérieur d'un même
 * appel, alors que le vrai risque de double débit est ailleurs — l'acheteur
 * relance un paiement resté en attente (`reprendrePaiement`) après une réponse
 * perdue, et sans clé stable l'API y voit un second encaissement.
 *
 * La référence passée est l'id du `Paiement`, déjà un UUID v4 : on l'utilise
 * tel quel. Si elle ne l'était pas (changement de format d'id), on en dérive
 * une empreinte SHA-256 mise à la forme d'un UUID v4 — la doc annonce ce
 * format, on le respecte sans supposer que l'API accepte autre chose. La
 * dérivation reste déterministe, c'est la seule propriété qui compte ici.
 */
export function cleIdempotence(reference: string): string {
  if (estUuidV4(reference)) return reference.toLowerCase();

  const empreinte = createHash("sha256")
    .update(`nile:hrskills:${reference}`)
    .digest("hex");
  const chiffres = empreinte.slice(0, 32).split("");
  // Version 4 et variante RFC 4122, pour que la chaîne soit un UUID v4 valide.
  chiffres[12] = "4";
  chiffres[16] = "89ab".charAt(parseInt(empreinte.charAt(16), 16) % 4);
  const s = chiffres.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

/* --------------------------------- Opérateurs -------------------------------- */

/** Opérateurs Mobile Money disponibles au Cameroun (§13 de la doc). */
export const OPERATEURS_CM = ["mtn", "orange"] as const;
export type OperateurHrSkills = (typeof OPERATEURS_CM)[number];

export function estOperateurValide(valeur: string): valeur is OperateurHrSkills {
  return (OPERATEURS_CM as readonly string[]).includes(valeur.toLowerCase());
}

/**
 * Normalise l'opérateur en minuscules.
 *
 * La doc se contredit : le tableau des paramètres du Cash-In liste
 * « mtn · orange · … » en minuscules, tandis que l'exemple cURL de la même
 * section envoie « ORANGE ». La section Airtime précise « insensible à la
 * casse », ce qui laisse penser que l'API normalise elle-même. On s'aligne
 * sur le tableau des paramètres, qui est la partie normative.
 */
export function normaliserOperateur(valeur: string): string {
  return valeur.trim().toLowerCase();
}

/**
 * Numéro au format attendu : indicatif pays inclus, sans « + » ni espaces
 * (ex. 237655500393). Renvoie null si le numéro n'est pas exploitable.
 */
export function normaliserNumeroHrSkills(
  telephone: string,
  indicatif = "237",
): string | null {
  const chiffres = telephone.replace(/\D/g, "");
  if (chiffres.length < 8) return null;
  return chiffres.startsWith(indicatif) ? chiffres : `${indicatif}${chiffres}`;
}

/* ---------------------------------- Statuts ---------------------------------- */

/**
 * Statuts renvoyés par l'API (§5). `HOLD` signifie « bloqué par contrôle AML,
 * en révision manuelle » : ce n'est ni un succès ni un échec définitif, on le
 * laisse donc en attente plutôt que de libérer la commande à tort.
 */
export function mapperStatutHrSkills(statut: string): StatutPaiementNotifie | null {
  switch (statut.trim().toUpperCase()) {
    case "SUCCESS":
      return "PAYE";
    case "FAILED":
      return "ECHOUE";
    case "PENDING":
    case "HOLD":
      // Rien de définitif : on n'écrit pas de statut final.
      return null;
    case "REFUNDED":
      // Remboursement : traité comme un échec du point de vue de la commande.
      return "ECHOUE";
    default:
      return null;
  }
}

/* -------------------------------- Signature ---------------------------------- */

/**
 * Vérifie la signature d'un webhook : HMAC-SHA256 du corps BRUT avec le
 * secret de webhook, comparé en temps constant (§12).
 *
 * La doc nomme l'en-tête « X-Hub-Signature ». Comme la convention Meta la
 * plus répandue est « X-Hub-Signature-256 » et que la doc ne montre aucun
 * échantillon de requête, l'appelant passe les deux valeurs possibles et on
 * accepte la première qui correspond.
 */
export function verifierSignatureHrSkills(
  secret: string,
  corpsBrut: string,
  signatures: (string | null)[],
): boolean {
  const attendu = createHmac("sha256", secret).update(corpsBrut).digest("hex");
  const attenduBuf = Buffer.from(`sha256=${attendu}`);

  let valide = false;
  for (const signature of signatures) {
    if (!signature) continue;
    const fourni = Buffer.from(signature.trim());
    // Pas de court-circuit : toutes les variantes sont comparées à chaque
    // appel pour que la durée ne révèle pas laquelle a correspondu.
    if (fourni.length === attenduBuf.length && timingSafeEqual(fourni, attenduBuf)) {
      valide = true;
    }
  }
  return valide;
}

/* ----------------------------- Lecture du webhook ---------------------------- */

export interface WebhookHrSkills {
  /** Référence HR-Skills (« ref_… ») de la transaction concernée. */
  reference: string;
  /** Statut annoncé, s'il est présent. Jamais utilisé tel quel — voir plus bas. */
  statutAnnonce: string | null;
  /** Notre propre référence, si elle nous revient via `metadata`. */
  referenceInterne: string | null;
}

type Json = Record<string, unknown>;

function texte(valeur: unknown): string | null {
  return typeof valeur === "string" && valeur.length > 0 ? valeur : null;
}

/**
 * Extrait ce qui nous est utile d'un corps de webhook.
 *
 * La doc ne publie AUCUN exemple de charge utile : on ne connaît ni le nom
 * exact des champs, ni leur imbrication. La lecture est donc tolérante — on
 * cherche la référence à la racine comme sous `data` — et le statut annoncé
 * n'est jamais cru sur parole : l'appelant reconfirme systématiquement via
 * GET /v1/payments/:reference, qui fait foi.
 */
/**
 * Squelette d'une charge JSON : ses CLÉS, jamais ses valeurs.
 *
 * Le fournisseur ne publie aucun exemple de webhook. Quand la lecture échoue,
 * c'est qu'il nomme ou imbrique ses champs autrement que prévu — et sans voir
 * la structure reçue, on en est réduit à deviner, ce qu'on ne fait pas sur une
 * API de paiement.
 *
 * Seules les clés sont restituées : un corps de webhook transporte un numéro
 * de téléphone et un montant, et un journal se relit, se copie et se colle. La
 * structure suffit à corriger la lecture ; les valeurs n'y ajouteraient rien.
 */
export function structureJson(valeur: unknown, profondeur = 3): string {
  if (valeur === null) return "null";
  if (Array.isArray(valeur)) {
    if (valeur.length === 0) return "[]";
    if (profondeur <= 0) return "[…]";
    return `[${valeur.length}× ${structureJson(valeur[0], profondeur - 1)}]`;
  }
  if (typeof valeur !== "object") return typeof valeur;
  if (profondeur <= 0) return "{…}";
  const entrees = Object.entries(valeur as Json).map(([cle, v]) => {
    const estComposite = v !== null && typeof v === "object";
    return estComposite ? `${cle}: ${structureJson(v, profondeur - 1)}` : cle;
  });
  return `{${entrees.join(", ")}}`;
}

export function lireWebhookHrSkills(charge: unknown): WebhookHrSkills | null {
  if (typeof charge !== "object" || charge === null) return null;
  const racine = charge as Json;
  const data = (typeof racine.data === "object" && racine.data !== null
    ? racine.data
    : {}) as Json;

  const reference =
    texte(data.reference) ??
    texte(racine.reference) ??
    texte(data.transaction_reference) ??
    texte(racine.transaction_reference);
  if (!reference) return null;

  const metadata = (typeof data.metadata === "object" && data.metadata !== null
    ? data.metadata
    : typeof racine.metadata === "object" && racine.metadata !== null
      ? racine.metadata
      : {}) as Json;

  return {
    reference,
    statutAnnonce: texte(data.status) ?? texte(racine.status),
    referenceInterne:
      texte(metadata.reference_interne) ?? texte(metadata.reference) ?? null,
  };
}
