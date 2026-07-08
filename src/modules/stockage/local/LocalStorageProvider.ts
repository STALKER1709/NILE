import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import type {
  StorageProvider,
  FichierAEnregistrer,
  FichierEnregistre,
} from "@/modules/stockage/StorageProvider";
import { extensionDepuisMime } from "@/modules/stockage/StorageProvider";

/**
 * Stockage LOCAL — développement uniquement.
 * Écrit les fichiers dans public/uploads (servis par Next à /uploads/...).
 * En production, le système de fichiers de l'hébergeur est éphémère : on utilise
 * SupabaseStorageProvider.
 */
const DOSSIER_UPLOADS = path.join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  async enregistrer(
    fichier: FichierAEnregistrer,
  ): Promise<FichierEnregistre> {
    await mkdir(DOSSIER_UPLOADS, { recursive: true });
    const nom = `${randomUUID()}.${extensionDepuisMime(fichier.typeMime)}`;
    await writeFile(path.join(DOSSIER_UPLOADS, nom), fichier.contenu);
    return { url: `/uploads/${nom}`, chemin: nom };
  }

  async supprimer(chemin: string): Promise<void> {
    try {
      await unlink(path.join(DOSSIER_UPLOADS, chemin));
    } catch (erreur: unknown) {
      // Fichier déjà absent : on ignore ce cas précis, on relève le reste.
      const code =
        typeof erreur === "object" && erreur !== null && "code" in erreur
          ? (erreur as { code?: string }).code
          : undefined;
      if (code !== "ENOENT") throw erreur;
    }
  }
}
