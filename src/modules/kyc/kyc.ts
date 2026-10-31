import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/modules/stockage";
import { SupabaseStorageProvider } from "@/modules/stockage/supabase/SupabaseStorageProvider";
import type { FichierAEnregistrer } from "@/modules/stockage/StorageProvider";
import {
  peutSoumettreKyc,
  peutValiderKyc,
  peutRejeterKyc,
  validerCompletudeKyc,
  type StatutKyc,
  type TypePieceIdentite,
} from "./kyc-core";
import type { SoumissionKycFormInput } from "@/validators/kyc";

export interface FichiersKycSoumission {
  pieceRecto: FichierAEnregistrer | null;
  pieceVerso: FichierAEnregistrer | null;
  selfie: FichierAEnregistrer | null;
  registreCommerce?: FichierAEnregistrer | null;
}

export type ResultatKyc =
  | { ok: true }
  | { ok: false; code: string; message: string; erreurs?: string[] };

/** Récupère le dossier KYC d'un vendeur. */
export async function getKycVendeur(vendeurId: string) {
  const dossier = await prisma.kycVendeur.findUnique({ where: { vendeurId } });
  if (!dossier) return null;
  // Une ancienne URL publique ne compte plus comme pièce KYC exploitable :
  // le vendeur doit téléverser à nouveau ses justificatifs dans le stockage privé.
  const privee = (url: string | null) => url?.startsWith("kyc://") ? url : null;
  return {
    ...dossier,
    pieceRectoUrl: privee(dossier.pieceRectoUrl),
    pieceVersoUrl: privee(dossier.pieceVersoUrl),
    selfieUrl: privee(dossier.selfieUrl),
    registreCommerceUrl: privee(dossier.registreCommerceUrl),
  };
}

/**
 * Soumet ou re-soumet le dossier KYC d'un vendeur avec selfie obligatoire.
 */
export async function soumettreKycVendeur(
  vendeurId: string,
  donnees: SoumissionKycFormInput,
  fichiers: FichiersKycSoumission,
): Promise<ResultatKyc> {
  const vendeur = await prisma.vendeur.findUnique({
    where: { id: vendeurId },
    include: { kyc: true },
  });

  if (!vendeur) {
    return { ok: false, code: "VENDEUR_INTROUVABLE", message: "Boutique introuvable." };
  }

  const statutActuel: StatutKyc = (vendeur.kyc?.statut as StatutKyc) ?? "NON_SOUMIS";
  if (!peutSoumettreKyc(statutActuel)) {
    return {
      ok: false,
      code: "STATUT_INVALIDE",
      message:
        statutActuel === "VALIDE"
          ? "Votre identité est déjà validée."
          : "Votre dossier est déjà en cours d'examen par notre équipe.",
    };
  }

  const storage = getStorageProvider();
  // En production, le stockage local est interdit : les pièces doivent rester
  // dans le bucket Supabase privé dédié au KYC.
  if (env.NODE_ENV === "production" && !(storage instanceof SupabaseStorageProvider)) {
    return {
      ok: false,
      code: "STOCKAGE_KYC_INDISPONIBLE",
      message: "Le stockage privé des justificatifs n'est pas configuré. Veuillez réessayer ultérieurement.",
    };
  }
  const enregistrerKyc = (fichier: FichierAEnregistrer) => storage.enregistrerKyc(fichier);
  // Une ancienne URL publique ne peut jamais être réutilisée comme preuve privée.
  const referencePrivee = (url: string | null | undefined) => url?.startsWith("kyc://") ? url : "";

  // Téléversement sécurisé des fichiers fournis
  let pieceRectoUrl = referencePrivee(vendeur.kyc?.pieceRectoUrl);
  let pieceRectoChemin = pieceRectoUrl ? vendeur.kyc?.pieceRectoChemin ?? null : null;
  if (fichiers.pieceRecto) {
    const res = await enregistrerKyc(fichiers.pieceRecto);
    pieceRectoUrl = res.url;
    pieceRectoChemin = res.chemin;
  }

  let pieceVersoUrl = referencePrivee(vendeur.kyc?.pieceVersoUrl);
  let pieceVersoChemin = pieceVersoUrl ? vendeur.kyc?.pieceVersoChemin ?? null : null;
  if (fichiers.pieceVerso) {
    const res = await enregistrerKyc(fichiers.pieceVerso);
    pieceVersoUrl = res.url;
    pieceVersoChemin = res.chemin;
  }

  let selfieUrl = referencePrivee(vendeur.kyc?.selfieUrl);
  let selfieChemin = selfieUrl ? vendeur.kyc?.selfieChemin ?? null : null;
  if (fichiers.selfie) {
    const res = await enregistrerKyc(fichiers.selfie);
    selfieUrl = res.url;
    selfieChemin = res.chemin;
  }

  let registreCommerceUrl = referencePrivee(vendeur.kyc?.registreCommerceUrl) || null;
  let registreCommerceChemin = registreCommerceUrl ? vendeur.kyc?.registreCommerceChemin ?? null : null;
  if (fichiers.registreCommerce) {
    const res = await enregistrerKyc(fichiers.registreCommerce);
    registreCommerceUrl = res.url;
    registreCommerceChemin = res.chemin;
  }

  // Vérification de complétude stricte (avec selfie obligatoire)
  const validation = validerCompletudeKyc({
    estEntreprise: donnees.estEntreprise,
    nomEntreprise: donnees.nomEntreprise,
    niu: donnees.niu,
    rccm: donnees.rccm,
    registreCommerceUrl,
    nomComplet: donnees.nomComplet,
    typePiece: donnees.typePiece as TypePieceIdentite,
    numeroPiece: donnees.numeroPiece,
    dateExpirationPiece: donnees.dateExpirationPiece,
    pieceRectoUrl,
    pieceVersoUrl,
    selfieUrl,
  });

  if (!validation.valide) {
    return {
      ok: false,
      code: "DOSSIER_INCOMPLET",
      message: validation.erreurs[0] ?? "Dossier incomplet.",
      erreurs: validation.erreurs,
    };
  }

  // Enregistrement du dossier. Le statut KYC et celui de la boutique sont distincts :
  // une soumission ne doit jamais lever une suspension administrative.
  await prisma.kycVendeur.upsert({
    where: { vendeurId },
    create: {
      vendeurId,
      statut: "EN_REVUE",
      estEntreprise: donnees.estEntreprise,
      nomEntreprise: donnees.nomEntreprise,
      niu: donnees.niu,
      rccm: donnees.rccm,
      registreCommerceUrl,
      registreCommerceChemin,
      nomComplet: donnees.nomComplet,
      typePiece: donnees.typePiece as TypePieceIdentite,
      numeroPiece: donnees.numeroPiece,
      dateExpirationPiece: donnees.dateExpirationPiece,
      pieceRectoUrl,
      pieceRectoChemin,
      pieceVersoUrl,
      pieceVersoChemin,
      selfieUrl,
      selfieChemin,
      motifRejet: null,
      dateSoumission: new Date(),
    },
    update: {
      statut: "EN_REVUE",
      estEntreprise: donnees.estEntreprise,
      nomEntreprise: donnees.nomEntreprise,
      niu: donnees.niu,
      rccm: donnees.rccm,
      registreCommerceUrl,
      registreCommerceChemin,
      nomComplet: donnees.nomComplet,
      typePiece: donnees.typePiece as TypePieceIdentite,
      numeroPiece: donnees.numeroPiece,
      dateExpirationPiece: donnees.dateExpirationPiece,
      pieceRectoUrl,
      pieceRectoChemin,
      pieceVersoUrl,
      pieceVersoChemin,
      selfieUrl,
      selfieChemin,
      motifRejet: null,
      dateSoumission: new Date(),
    },
  });

  await prisma.vendeur.updateMany({
    where: { id: vendeurId, statutValidation: { not: "SUSPENDU" } },
    data: { statutValidation: "EN_ATTENTE" },
  });

  return { ok: true };
}

/**
 * Validation administrative d'un dossier KYC.
 * Valide le dossier d'identité mais ne lève jamais une suspension de boutique.
 */
export async function validerKycAdmin(vendeurId: string): Promise<ResultatKyc> {
  const kyc = await prisma.kycVendeur.findUnique({
    where: { vendeurId },
  });

  if (!kyc) {
    return { ok: false, code: "KYC_INTROUVABLE", message: "Dossier KYC introuvable." };
  }

  const statutActuel = kyc.statut as StatutKyc;
  if (!peutValiderKyc(statutActuel)) {
    return {
      ok: false,
      code: "STATUT_INVALIDE",
      message: "Seul un dossier en attente d'examen peut être validé.",
    };
  }

  await prisma.$transaction([
    prisma.kycVendeur.update({
      where: { vendeurId },
      data: {
        statut: "VALIDE",
        dateValidation: new Date(),
        motifRejet: null,
      },
    }),
    prisma.vendeur.updateMany({
      where: { id: vendeurId, statutValidation: { not: "SUSPENDU" } },
      data: { statutValidation: "VALIDE" },
    }),
  ]);

  return { ok: true };
}

/**
 * Rejet administratif d'un dossier KYC avec motif obligatoire.
 * Passe la boutique en REJETE pour bloquer la mise en vente.
 */
export async function rejeterKycAdmin(
  vendeurId: string,
  motif: string,
): Promise<ResultatKyc> {
  const kyc = await prisma.kycVendeur.findUnique({
    where: { vendeurId },
  });

  if (!kyc) {
    return { ok: false, code: "KYC_INTROUVABLE", message: "Dossier KYC introuvable." };
  }

  const check = peutRejeterKyc(kyc.statut as StatutKyc, motif);
  if (!check.valide) {
    return {
      ok: false,
      code: "MOTIF_INVALIDE",
      message: check.erreur ?? "Motif invalide.",
    };
  }

  await prisma.$transaction([
    prisma.kycVendeur.update({
      where: { vendeurId },
      data: {
        statut: "REJETE",
        motifRejet: motif.trim(),
      },
    }),
    prisma.vendeur.updateMany({
      where: { id: vendeurId, statutValidation: { not: "SUSPENDU" } },
      data: { statutValidation: "REJETE" },
    }),
  ]);

  return { ok: true };
}
