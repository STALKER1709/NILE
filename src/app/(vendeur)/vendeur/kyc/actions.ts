"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { soumissionKycFormSchema } from "@/validators/kyc";
import { soumettreKycVendeur } from "@/modules/kyc/kyc";
import type { FichierAEnregistrer } from "@/modules/stockage/StorageProvider";

const TAILLE_IMAGE_MAX = 2 * 1024 * 1024;
const TAILLE_PDF_MAX = 5 * 1024 * 1024;

async function fichierDepuisFile(
  valeur: FormDataEntryValue | null,
  autoriserPdf = false,
): Promise<FichierAEnregistrer | null> {
  if (!(valeur instanceof File) || valeur.size === 0) return null;
  const typesAutorises = autoriserPdf
    ? new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
    : new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!typesAutorises.has(valeur.type)) throw new Error("Format de fichier non autorisé.");
  const limite = valeur.type === "application/pdf" ? TAILLE_PDF_MAX : TAILLE_IMAGE_MAX;
  if (valeur.size > limite) throw new Error("Fichier trop volumineux.");
  const contenu = Buffer.from(await valeur.arrayBuffer());
  // Vérifie la signature binaire, pas seulement le MIME déclaré par le navigateur.
  const valide = valeur.type === "image/jpeg"
    ? contenu.length >= 3 && contenu[0] === 0xff && contenu[1] === 0xd8 && contenu[2] === 0xff
    : valeur.type === "image/png"
      ? contenu.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : valeur.type === "image/webp"
        ? contenu.length >= 12 && contenu.toString("ascii", 0, 4) === "RIFF" && contenu.toString("ascii", 8, 12) === "WEBP"
        : contenu.toString("ascii", 0, 5) === "%PDF-";
  if (!valide) throw new Error("Le contenu du fichier ne correspond pas au format déclaré.");
  return { nomOriginal: valeur.name, typeMime: valeur.type, contenu };
}

export async function soumettreKycAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();

  const parsed = soumissionKycFormSchema.safeParse({
    nomComplet: formData.get("nomComplet"),
    typePiece: formData.get("typePiece"),
    numeroPiece: formData.get("numeroPiece"),
    dateExpirationPiece: formData.get("dateExpirationPiece") ?? undefined,
    estEntreprise: formData.get("estEntreprise"),
    nomEntreprise: formData.get("nomEntreprise") ?? undefined,
    niu: formData.get("niu") ?? undefined,
    rccm: formData.get("rccm") ?? undefined,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/vendeur/kyc?erreur=${encodeURIComponent(msg)}`);
  }

  let pieceRecto: FichierAEnregistrer | null;
  let pieceVerso: FichierAEnregistrer | null;
  let selfie: FichierAEnregistrer | null;
  let registreCommerce: FichierAEnregistrer | null;
  try {
    pieceRecto = await fichierDepuisFile(formData.get("pieceRecto"));
    pieceVerso = await fichierDepuisFile(formData.get("pieceVerso"));
    selfie = await fichierDepuisFile(formData.get("selfie"));
    registreCommerce = await fichierDepuisFile(formData.get("registreCommerce"), true);
  } catch (erreur) {
    const msg = erreur instanceof Error ? erreur.message : "Fichier invalide.";
    redirect(`/vendeur/kyc?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await soumettreKycVendeur(vendeur.id, parsed.data, {
    pieceRecto,
    pieceVerso,
    selfie,
    registreCommerce,
  });

  if (!res.ok) {
    redirect(`/vendeur/kyc?erreur=${encodeURIComponent(res.message)}`);
  }

  redirect("/vendeur/kyc?ok=1");
}
