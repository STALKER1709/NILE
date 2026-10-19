import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/modules/stockage";
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
  return prisma.kycVendeur.findUnique({
    where: { vendeurId },
  });
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

  // Téléversement sécurisé des fichiers fournis
  let pieceRectoUrl = vendeur.kyc?.pieceRectoUrl ?? "";
  let pieceRectoChemin = vendeur.kyc?.pieceRectoChemin ?? null;
  if (fichiers.pieceRecto) {
    const res = await storage.enregistrer(fichiers.pieceRecto);
    pieceRectoUrl = res.url;
    pieceRectoChemin = res.chemin;
  }

  let pieceVersoUrl = vendeur.kyc?.pieceVersoUrl ?? "";
  let pieceVersoChemin = vendeur.kyc?.pieceVersoChemin ?? null;
  if (fichiers.pieceVerso) {
    const res = await storage.enregistrer(fichiers.pieceVerso);
    pieceVersoUrl = res.url;
    pieceVersoChemin = res.chemin;
  }

  let selfieUrl = vendeur.kyc?.selfieUrl ?? "";
  let selfieChemin = vendeur.kyc?.selfieChemin ?? null;
  if (fichiers.selfie) {
    const res = await storage.enregistrer(fichiers.selfie);
    selfieUrl = res.url;
    selfieChemin = res.chemin;
  }

  let registreCommerceUrl = vendeur.kyc?.registreCommerceUrl ?? null;
  let registreCommerceChemin = vendeur.kyc?.registreCommerceChemin ?? null;
  if (fichiers.registreCommerce) {
    const res = await storage.enregistrer(fichiers.registreCommerce);
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

  // Enregistrement dans la base de données
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

  // La boutique reste ou passe en EN_ATTENTE de validation admin
  await prisma.vendeur.update({
    where: { id: vendeurId },
    data: { statutValidation: "EN_ATTENTE" },
  });

  return { ok: true };
}

/**
 * Validation administrative d'un dossier KYC.
 * Active simultanément la boutique du vendeur (VALIDE).
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
    prisma.vendeur.update({
      where: { id: vendeurId },
      data: {
        statutValidation: "VALIDE",
      },
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
    prisma.vendeur.update({
      where: { id: vendeurId },
      data: {
        statutValidation: "REJETE",
      },
    }),
  ]);

  return { ok: true };
}
