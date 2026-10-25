import { SupabaseStorageProvider } from "@/modules/stockage/supabase/SupabaseStorageProvider";

/**
 * Résout les références KYC en URL signée courte durée.
 * À appeler exclusivement depuis une page/action serveur après autorisation ADMIN.
 * Les anciennes URL HTTP publiques sont conservées pour compatibilité et
 * nécessitent une migration opérationnelle vers le bucket privé.
 */
export async function resoudreUrlKyc(url: string | null | undefined, chemin: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!url.startsWith("kyc://")) return url;
  if (!chemin) throw new Error("Référence KYC privée sans chemin de stockage.");
  return new SupabaseStorageProvider().urlSigneeKyc(chemin);
}
