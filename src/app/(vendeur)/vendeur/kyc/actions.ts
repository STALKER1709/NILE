"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { soumissionKycFormSchema } from "@/validators/kyc";
import { soumettreKycVendeur } from "@/modules/kyc/kyc";
import type { FichierAEnregistrer } from "@/modules/stockage/StorageProvider";

async function fichierDepuisFile(
  valeur: FormDataEntryValue | null,
): Promise<FichierAEnregistrer | null> {
  if (!(valeur instanceof File) || valeur.size === 0) return null;
  const contenu = Buffer.from(await valeur.arrayBuffer());
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

  const pieceRecto = await fichierDepuisFile(formData.get("pieceRecto"));
  const pieceVerso = await fichierDepuisFile(formData.get("pieceVerso"));
  const selfie = await fichierDepuisFile(formData.get("selfie"));
  const registreCommerce = await fichierDepuisFile(formData.get("registreCommerce"));

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
