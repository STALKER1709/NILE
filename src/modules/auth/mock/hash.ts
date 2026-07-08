import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hachage de mot de passe pour le fournisseur MOCK (dev/tests uniquement).
 * Isolé ici (aucune dépendance Next) pour être réutilisable par le seed.
 * N'est JAMAIS utilisé en production (Supabase gère les identifiants réels).
 */

export function hasherMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16);
  const cle = scryptSync(motDePasse, sel, 64);
  return `${sel.toString("hex")}:${cle.toString("hex")}`;
}

export function verifierMotDePasse(motDePasse: string, stocke: string): boolean {
  const [selHex, cleHex] = stocke.split(":");
  if (!selHex || !cleHex) return false;
  const sel = Buffer.from(selHex, "hex");
  const cleAttendue = Buffer.from(cleHex, "hex");
  const cleCalculee = scryptSync(motDePasse, sel, cleAttendue.length);
  return (
    cleAttendue.length === cleCalculee.length &&
    timingSafeEqual(cleAttendue, cleCalculee)
  );
}
