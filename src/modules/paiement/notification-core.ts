import { createHash } from "node:crypto";

/**
 * Logique PURE de vérification des notifications de paiement.
 * La signature reproduit l'algorithme officiel Monetbil (monetbil-php) :
 *   sign = md5( service_secret + concat(valeurs des paramètres triés par clé) )
 * Le même schéma est utilisé par le fournisseur mock (avec un secret de dev),
 * ce qui permet de tester tout le flux de callback sans service externe.
 */

export function calculerSign(
  secret: string,
  params: Record<string, string>,
): string {
  const cles = Object.keys(params).sort();
  const concat = cles.map((c) => params[c]).join("");
  return createHash("md5").update(secret + concat).digest("hex");
}

/** Vérifie le champ `sign` d'une notification (comme checkSign de Monetbil). */
export function verifierSign(
  secret: string,
  corps: Record<string, string>,
): boolean {
  const sign = corps["sign"];
  if (!sign) return false;
  const sansSign: Record<string, string> = {};
  for (const [k, v] of Object.entries(corps)) {
    if (k !== "sign") sansSign[k] = v;
  }
  return calculerSign(secret, sansSign) === sign;
}

export type StatutPaiementNotifie = "PAYE" | "ECHOUE";

/**
 * Statuts Monetbil : 1 = succès, 0 = échec, -1 = annulé
 * (7/8/9 = équivalents en mode test). Tout ce qui n'est pas un succès = échec.
 */
export function mapperStatutMonetbil(status: number): StatutPaiementNotifie {
  return status === 1 || status === 7 ? "PAYE" : "ECHOUE";
}
