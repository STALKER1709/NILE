import { getStorageProvider } from "@/modules/stockage";

/**
 * Résout une référence KYC en URL de consultation protégée.
 * Les anciennes URL publiques ne sont volontairement jamais restituées :
 * elles doivent être migrées vers le stockage privé avant consultation.
 * À appeler exclusivement depuis une page serveur après autorisation ADMIN.
 */
export async function resoudreUrlKyc(url: string | null | undefined, chemin: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!url.startsWith("kyc://")) return null;
  if (!chemin) throw new Error("Référence KYC privée sans chemin de stockage.");
  return getStorageProvider().urlSigneeKyc(chemin);
}
