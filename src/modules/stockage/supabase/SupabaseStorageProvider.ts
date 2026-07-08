import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { creerClientAdmin } from "@/modules/auth/supabase/serverClient";
import type {
  StorageProvider,
  FichierAEnregistrer,
  FichierEnregistre,
} from "@/modules/stockage/StorageProvider";
import { extensionDepuisMime } from "@/modules/stockage/StorageProvider";

/**
 * Stockage Supabase Storage (production).
 *
 * Note de vérification : non exécuté contre un vrai projet Supabase dans cet
 * environnement (pas d'accès réseau au service ici). À valider au branchement.
 * Prérequis : créer un bucket PUBLIC nommé comme SUPABASE_STORAGE_BUCKET.
 */
export class SupabaseStorageProvider implements StorageProvider {
  async enregistrer(
    fichier: FichierAEnregistrer,
  ): Promise<FichierEnregistre> {
    const client = creerClientAdmin();
    const bucket = env.SUPABASE_STORAGE_BUCKET;
    const chemin = `${randomUUID()}.${extensionDepuisMime(fichier.typeMime)}`;

    const { error } = await client.storage
      .from(bucket)
      .upload(chemin, fichier.contenu, {
        contentType: fichier.typeMime,
        upsert: false,
      });
    if (error) {
      throw new Error(`Échec de l'upload Supabase Storage : ${error.message}`);
    }

    const { data } = client.storage.from(bucket).getPublicUrl(chemin);
    return { url: data.publicUrl, chemin };
  }

  async supprimer(chemin: string): Promise<void> {
    const client = creerClientAdmin();
    const { error } = await client.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove([chemin]);
    if (error) {
      throw new Error(`Échec de la suppression Supabase Storage : ${error.message}`);
    }
  }
}
