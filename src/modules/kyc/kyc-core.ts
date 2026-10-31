/**
 * Logique métier pure du KYC (Know Your Customer) vendeur sur NILE Marketplace.
 *
 * Règles :
 * - Aucune dépendance réseau ni base de données.
 * - Tout vendeur tiers doit faire valider son identité pour que sa boutique soit
 *   autorisée à publier des produits.
 * - Le selfie est OBLIGATOIRE pour tous les vendeurs pour attester de l'appartenance
 *   de la pièce d'identité fournie.
 */

export type StatutKyc = "NON_SOUMIS" | "EN_REVUE" | "VALIDE" | "REJETE";

export type TypePieceIdentite = "CNI" | "PASSEPORT";

export interface DonneesSoumissionKyc {
  estEntreprise: boolean;
  nomEntreprise?: string | null;
  niu?: string | null;
  rccm?: string | null;
  registreCommerceUrl?: string | null;

  nomComplet: string;
  typePiece: TypePieceIdentite;
  numeroPiece: string;
  dateExpirationPiece?: Date | string | null;

  pieceRectoUrl: string;
  pieceVersoUrl?: string | null;
  selfieUrl: string;
}

/** Indique si un vendeur dans ce statut peut soumettre (ou re-soumettre) son KYC. */
export function peutSoumettreKyc(statut: StatutKyc): boolean {
  return statut === "NON_SOUMIS" || statut === "REJETE";
}

/** Indique si un administrateur peut valider ce dossier KYC. */
export function peutValiderKyc(statut: StatutKyc): boolean {
  return statut === "EN_REVUE";
}

/**
 * Valide le rejet administratif : seul un dossier en revue peut être rejeté
 * et le motif doit expliquer la décision.
 */
export function peutRejeterKyc(
  statut: StatutKyc,
  motif: string,
): { valide: boolean; erreur?: string } {
  if (statut !== "EN_REVUE") {
    return {
      valide: false,
      erreur: "Seul un dossier en cours de revue peut être rejeté.",
    };
  }
  const motifNettoye = motif.trim();
  if (motifNettoye.length < 5) {
    return {
      valide: false,
      erreur: "Veuillez fournir un motif explicite d'au moins 5 caractères.",
    };
  }
  return { valide: true };
}

/** Vérifie l'intégrité et la complétude des pièces d'un dossier KYC. */
export function validerCompletudeKyc(donnees: DonneesSoumissionKyc): {
  valide: boolean;
  erreurs: string[];
} {
  const erreurs: string[] = [];

  const nom = donnees.nomComplet?.trim() ?? "";
  if (nom.length < 2) {
    erreurs.push("Le nom complet est obligatoire (au moins 2 caractères).");
  }

  const numero = donnees.numeroPiece?.trim() ?? "";
  if (numero.length < 4) {
    erreurs.push("Le numéro de la pièce d'identité est invalide.");
  }

  if (!donnees.pieceRectoUrl || donnees.pieceRectoUrl.trim() === "") {
    erreurs.push("La photo du recto de votre pièce d'identité est obligatoire.");
  }

  if (donnees.typePiece === "CNI") {
    if (!donnees.pieceVersoUrl || donnees.pieceVersoUrl.trim() === "") {
      erreurs.push("La photo du verso de votre pièce d'identité est obligatoire pour une CNI.");
    }
  }

  if (!donnees.selfieUrl || donnees.selfieUrl.trim() === "") {
    erreurs.push("Le selfie de vérification est obligatoire pour confirmer l'appartenance de votre pièce d'identité.");
  }

  if (donnees.dateExpirationPiece != null) {
    const expiration = donnees.dateExpirationPiece instanceof Date
      ? donnees.dateExpirationPiece
      : new Date(donnees.dateExpirationPiece);
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    if (!Number.isFinite(expiration.getTime()) || expiration.getTime() < todayUtc.getTime()) {
      erreurs.push("La date d'expiration de la pièce d'identité est invalide ou dépassée.");
    }
  }

  if (donnees.estEntreprise) {
    const entreprise = donnees.nomEntreprise?.trim() ?? "";
    if (entreprise.length < 2) {
      erreurs.push("Le nom de l'entreprise ou raison sociale est obligatoire.");
    }
    const niu = donnees.niu?.trim() ?? "";
    if (niu.length < 5) {
      erreurs.push("Le Numéro d'Identification Unique (NIU) est obligatoire pour une entreprise.");
    }
    const rccm = donnees.rccm?.trim() ?? "";
    if (rccm.length < 5) {
      erreurs.push("Le Registre du Commerce (RCCM) est obligatoire pour une entreprise.");
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}

export function libelleStatutKyc(statut: StatutKyc): string {
  switch (statut) {
    case "NON_SOUMIS": return "Non soumis";
    case "EN_REVUE": return "En cours de vérification";
    case "VALIDE": return "Identité vérifiée";
    case "REJETE": return "Dossier refusé";
  }
}

export function badgeTonKyc(statut: StatutKyc): "vert" | "ambre" | "rouge" | "neutre" {
  switch (statut) {
    case "VALIDE": return "vert";
    case "EN_REVUE": return "ambre";
    case "REJETE": return "rouge";
    case "NON_SOUMIS": return "neutre";
  }
}

export type StatutValidationBoutique = "EN_ATTENTE" | "VALIDE" | "REJETE" | "SUSPENDU";

export function messageEtatBoutiqueApresKyc(statutBoutique: StatutValidationBoutique): string {
  switch (statutBoutique) {
    case "VALIDE":
      return "Votre identité est validée et votre boutique est autorisée à vendre.";
    case "EN_ATTENTE":
      return "Votre identité est validée. Votre boutique reste en attente de validation administrative et n'est pas encore autorisée à vendre.";
    case "REJETE":
      return "Votre identité est validée, mais votre boutique a été rejetée. Consultez les informations de votre espace vendeur ou contactez l'assistance.";
    case "SUSPENDU":
      return "Votre identité est validée, mais votre boutique est suspendue et ne peut pas vendre pour le moment.";
  }
}
