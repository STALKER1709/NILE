import { randomUUID } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type {
  StorageProvider,
  FichierAEnregistrer,
  FichierEnregistre,
  FichierConfirme,
  TicketUpload,
} from "@/modules/stockage/StorageProvider";
import {
  ErreurStockage,
  extensionDepuisMime,
  tailleMaxPourType,
  typeMimeDepuisExtension,
} from "@/modules/stockage/StorageProvider";

/**
 * Stockage LOCAL — développement uniquement.
 * Écrit les fichiers dans public/uploads (servis par Next à /uploads/...).
 * En production, le système de fichiers de l'hébergeur est éphémère : on utilise
 * SupabaseStorageProvider.
 *
 * L'envoi direct (vidéos) passe par la route `/api/stockage/upload`, qui écrit
 * via `ecrireUploadDirect` — même vérification de poids que le signé Supabase.
 */
const DOSSIER_UPLOADS = path.join(process.cwd(), "public", "uploads");

/** Résout une clé relative dans le dossier uploads, sans traversée possible. */
function cheminAbsolut(chemin: string): string {
  const abs = path.resolve(DOSSIER_UPLOADS, chemin);
  if (abs !== DOSSIER_UPLOADS && !abs.startsWith(DOSSIER_UPLOADS + path.sep)) {
    throw new ErreurStockage("INACCESSIBLE", `Clé hors du dossier uploads : ${chemin}`);
  }
  return abs;
}

/** Clé → URL publique servie par Next. */
export function urlLocale(chemin: string): string {
  return `/uploads/${chemin}`;
}

/**
 * Écrit un corps streamé dans le dossier uploads en refusant tout dépassement
 * de la limite correspondant au type MIME. Le fichier partiel est supprimé en
 * cas de dépassement : aucun demi-fichier à refiler à un acheteur.
 *
 * Appelé par la route `/api/stockage/upload` (dev local uniquement).
 */
export async function ecrireUploadDirect(
  chemin: string,
  corps: ReadableStream<Uint8Array>,
  typeMime: string,
): Promise<number> {
  const abs = cheminAbsolut(chemin);
  await mkdir(path.dirname(abs), { recursive: true });
  const limite = tailleMaxPourType(typeMime);
  let octets = 0;
  const compteur = new Transform({
    transform(
      chunk: Buffer,
      _enc: BufferEncoding,
      cb: (error?: Error | null, data?: Buffer) => void,
    ) {
      octets += chunk.length;
      if (octets > limite) {
        cb(new ErreurStockage("TROP_LOURDE"));
        return;
      }
      cb(null, chunk);
    },
  });
  try {
    await pipeline(
      Readable.fromWeb(corps as Parameters<typeof Readable.fromWeb>[0]),
      compteur,
      createWriteStream(abs),
    );
  } catch (erreur) {
    // Nettoyage : pas de fichier tronqué laissé sur le disque.
    await unlink(abs).catch(() => undefined);
    if (erreur instanceof ErreurStockage) throw erreur;
    throw erreur;
  }
  return octets;
}

/**
 * Supprime un fichier écrit par `ecrireUploadDirect` (fichier tronqué, vidéo
 * annulée…). Un fichier déjà absent n'est pas une erreur de suppression.
 */
export async function supprimerUploadDirect(chemin: string): Promise<void> {
  try {
    await unlink(cheminAbsolut(chemin));
  } catch (erreur: unknown) {
    const code =
      typeof erreur === "object" && erreur !== null && "code" in erreur
        ? (erreur as { code?: string }).code
        : undefined;
    if (code !== "ENOENT") throw erreur;
  }
}

export class LocalStorageProvider implements StorageProvider {
  async enregistrer(
    fichier: FichierAEnregistrer,
  ): Promise<FichierEnregistre> {
    await mkdir(DOSSIER_UPLOADS, { recursive: true });
    const nom = `${randomUUID()}.${extensionDepuisMime(fichier.typeMime)}`;
    await writeFile(path.join(DOSSIER_UPLOADS, nom), fichier.contenu);
    return { url: urlLocale(nom), chemin: nom };
  }

  async supprimer(chemin: string): Promise<void> {
    return supprimerUploadDirect(chemin);
  }

  async preparerUploadDirect(chemin: string): Promise<TicketUpload> {
    // En local, pas d'URL signée : la route écoute en same-origin et repère le
    // vendeur par sa session (cookie), la clé est validée contre son préfixe.
    return { url: "/api/stockage/upload", methode: "PUT", chemin, mode: "local" };
  }

  async confirmerUploadDirect(
    chemin: string,
    typeMime: string,
  ): Promise<FichierConfirme> {
    const abs = cheminAbsolut(chemin);
    let infos;
    try {
      infos = await stat(abs);
    } catch {
      throw new ErreurStockage("ABSENT");
    }
    if (!infos.isFile()) throw new ErreurStockage("ABSENT");
    const attendu = typeMimeDepuisExtension(
      path.extname(chemin).slice(1).toLowerCase(),
    );
    if (attendu !== typeMime) {
      throw new ErreurStockage(
        "TYPE_INVALIDE",
        `Extension ${path.extname(chemin)} ≠ type ${typeMime}`,
      );
    }
    if (infos.size > tailleMaxPourType(typeMime)) {
      throw new ErreurStockage("TROP_LOURDE");
    }
    return { url: urlLocale(chemin), chemin, tailleOctets: infos.size };
  }
}
