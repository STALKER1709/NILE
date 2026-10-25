import { randomUUID } from "node:crypto";
import path from "node:path";
import { env } from "@/lib/env";
import { creerClientAdmin } from "@/modules/auth/supabase/serverClient";
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
 * Stockage Supabase Storage (production).
 *
 * Envoi direct (vidéos) : `createSignedUploadUrl` renvoie une URL signée que le
 * navigateur frappe en PUT (FormData : champ `cacheControl` + fichier), c'est
 * le protocole exact du SDK @supabase/storage-js v2.110 (vérifié dans sa
 * source, pas de mémoire). La confirmation relit les métadonnées de l'objet
 * (poids réel) via `list({ search })` avant de rendre l'URL publique.
 *
 * Note de vérification : le flux signé n'a pas été exécuté contre un vrai
 * projet Supabase dans cet environnement (pas de projet/credentials ici) —
 * il est calqué sur la source du SDK installé. À valider au branchement, comme
 * le reste du provider (voir la note historique ci-dessous).
 *
 * Médias publics : bucket nommé comme SUPABASE_STORAGE_BUCKET. Les pièces KYC
 * sont envoyées vers SUPABASE_KYC_BUCKET, séparé et privé.
 * Prérequis inchangé : bucket PUBLIC nommé comme SUPABASE_STORAGE_BUCKET,
 * avec une limite de taille de fichier ≥ 15 Mo (filet complémentaire côté
 * plateforme, la validation applicative restant le premier verrou).
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

  /** Stocke un justificatif KYC dans un bucket séparé, qui doit rester privé. */
  async enregistrerKyc(fichier: FichierAEnregistrer): Promise<FichierEnregistre> {
    const client = creerClientAdmin();
    const chemin = `${randomUUID()}.${extensionDepuisMime(fichier.typeMime)}`;
    const { error } = await client.storage.from(env.SUPABASE_KYC_BUCKET).upload(chemin, fichier.contenu, {
      contentType: fichier.typeMime,
      upsert: false,
    });
    if (error) throw new Error(`Échec de l'upload privé KYC : ${error.message}`);
    // Jamais d'URL publique : la base conserve un identifiant interne opaque.
    return { url: `kyc://${chemin}`, chemin };
  }

  /** URL signée à courte durée de vie, appelée uniquement après contrôle ADMIN. */
  async urlSigneeKyc(chemin: string): Promise<string> {
    const client = creerClientAdmin();
    const { data, error } = await client.storage.from(env.SUPABASE_KYC_BUCKET).createSignedUrl(chemin, 300);
    if (error || !data?.signedUrl) throw new Error(`Impossible de signer le document KYC : ${error?.message ?? "URL absente"}`);
    return data.signedUrl;
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

  async preparerUploadDirect(chemin: string): Promise<TicketUpload> {
    const client = creerClientAdmin();
    const { data, error } = await client.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUploadUrl(chemin);
    if (error || !data) {
      throw new Error(
        `Échec de la signature d'upload Supabase : ${error?.message ?? "aucune URL"}`,
      );
    }
    // signedUrl contient déjà le token (?token=…) : le navigateur n'a aucun
    // secret à connaître — c'est tout l'intérêt du ticket signé.
    return { url: data.signedUrl, methode: "PUT", chemin, mode: "signe" };
  }

  async confirmerUploadDirect(
    chemin: string,
    typeMime: string,
  ): Promise<FichierConfirme> {
    const client = creerClientAdmin();
    const bucket = env.SUPABASE_STORAGE_BUCKET;
    const dossier = chemin.includes("/")
      ? chemin.slice(0, chemin.lastIndexOf("/"))
      : "";
    const nom = chemin.slice(chemin.lastIndexOf("/") + 1);

    const { data, error } = await client.storage
      .from(bucket)
      .list(dossier, { search: nom, limit: 10 });
    if (error) {
      throw new Error(
        `Lecture du fichier Supabase impossible : ${error.message}`,
      );
    }
    const objet = data.find((f) => f.name === nom);
    if (!objet || !objet.metadata) {
      throw new ErreurStockage("ABSENT");
    }
    const taille = typeof objet.metadata.size === "number" ? objet.metadata.size : 0;
    if (taille > tailleMaxPourType(typeMime)) {
      throw new ErreurStockage("TROP_LOURDE");
    }
    const mimeObserve = objet.metadata.mimetype;
    const attendu = typeMimeDepuisExtension(
      path.extname(chemin).slice(1).toLowerCase(),
    );
    if (attendu !== typeMime || (mimeObserve && mimeObserve !== typeMime)) {
      throw new ErreurStockage("TYPE_INVALIDE");
    }
    const { data: publie } = client.storage.from(bucket).getPublicUrl(chemin);
    return { url: publie.publicUrl, chemin, tailleOctets: taille };
  }
}
