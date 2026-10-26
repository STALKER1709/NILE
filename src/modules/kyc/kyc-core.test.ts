import { describe, it, expect } from "vitest";
import {
  peutSoumettreKyc,
  peutValiderKyc,
  peutRejeterKyc,
  validerCompletudeKyc,
  libelleStatutKyc,
  badgeTonKyc,
  messageEtatBoutiqueApresKyc,
  type DonneesSoumissionKyc,
} from "./kyc-core";

describe("KYC Vendeur — kyc-core", () => {
  describe("Transitions d'état (peutSoumettreKyc)", () => {
    it("autorise la soumission si NON_SOUMIS ou REJETE", () => {
      expect(peutSoumettreKyc("NON_SOUMIS")).toBe(true);
      expect(peutSoumettreKyc("REJETE")).toBe(true);
    });

    it("interdit la re-soumission si EN_REVUE ou déjà VALIDE", () => {
      expect(peutSoumettreKyc("EN_REVUE")).toBe(false);
      expect(peutSoumettreKyc("VALIDE")).toBe(false);
    });
  });

  describe("Validation administrative (peutValiderKyc)", () => {
    it("autorise la validation uniquement si le dossier est EN_REVUE", () => {
      expect(peutValiderKyc("EN_REVUE")).toBe(true);
      expect(peutValiderKyc("NON_SOUMIS")).toBe(false);
      expect(peutValiderKyc("VALIDE")).toBe(false);
      expect(peutValiderKyc("REJETE")).toBe(false);
    });
  });

  describe("Rejet administratif (peutRejeterKyc)", () => {
    it("autorise le rejet avec un motif explicite d'au moins 5 caractères", () => {
      const res = peutRejeterKyc("EN_REVUE", "Photo de CNI floue et illisible");
      expect(res.valide).toBe(true);
      expect(res.erreur).toBeUndefined();
    });

    it("refuse le rejet si le dossier n'est pas EN_REVUE", () => {
      const res = peutRejeterKyc("VALIDE", "Motif quelconque");
      expect(res.valide).toBe(false);
      expect(res.erreur).toContain("en cours de revue");
    });

    it("refuse le rejet si le motif est trop court ou vide", () => {
      const res1 = peutRejeterKyc("EN_REVUE", "    ");
      expect(res1.valide).toBe(false);
      expect(res1.erreur).toContain("au moins 5 caractères");

      const res2 = peutRejeterKyc("EN_REVUE", "non");
      expect(res2.valide).toBe(false);
    });
  });

  describe("Validation de la complétude du dossier (validerCompletudeKyc)", () => {
    const baseValide: DonneesSoumissionKyc = {
      estEntreprise: false,
      nomComplet: "Samuel Eto'o",
      typePiece: "CNI",
      numeroPiece: "102938475",
      pieceRectoUrl: "https://stockage.nile.cm/cni-recto.jpg",
      pieceVersoUrl: "https://stockage.nile.cm/cni-verso.jpg",
      selfieUrl: "https://stockage.nile.cm/selfie-vendeur.jpg",
    };

    it("valide un dossier particulier complet avec selfie", () => {
      const res = validerCompletudeKyc(baseValide);
      expect(res.valide).toBe(true);
      expect(res.erreurs).toHaveLength(0);
    });

    it("REFUSE catégoriquement si le selfie est absent (règle obligatoire)", () => {
      const sansSelfie = { ...baseValide, selfieUrl: "" };
      const res = validerCompletudeKyc(sansSelfie);
      expect(res.valide).toBe(false);
      expect(res.erreurs).toContain(
        "Le selfie de vérification est obligatoire pour confirmer l'appartenance de votre pièce d'identité.",
      );
    });

    it("exige le verso pour une CNI ou un récépissé", () => {
      const cniSansVerso = { ...baseValide, typePiece: "CNI" as const, pieceVersoUrl: "" };
      const res = validerCompletudeKyc(cniSansVerso);
      expect(res.valide).toBe(false);
      expect(res.erreurs).toContain(
        "La photo du verso de votre pièce d'identité est obligatoire pour une CNI ou un récépissé.",
      );
    });

    it("n'exige PAS de verso pour un passeport", () => {
      const passeport = {
        ...baseValide,
        typePiece: "PASSEPORT" as const,
        pieceVersoUrl: null,
      };
      const res = validerCompletudeKyc(passeport);
      expect(res.valide).toBe(true);
      expect(res.erreurs).toHaveLength(0);
    });

    it("exige nom de l'entreprise, NIU et RCCM si estEntreprise est vrai", () => {
      const entrepriseIncomplete: DonneesSoumissionKyc = {
        ...baseValide,
        estEntreprise: true,
        nomEntreprise: "",
        niu: "",
        rccm: "",
      };
      const res = validerCompletudeKyc(entrepriseIncomplete);
      expect(res.valide).toBe(false);
      expect(res.erreurs.some((e) => e.includes("entreprise"))).toBe(true);
      expect(res.erreurs.some((e) => e.includes("NIU"))).toBe(true);
      expect(res.erreurs.some((e) => e.includes("RCCM"))).toBe(true);
    });

    it("valide une entreprise si tous les documents et champs légaux sont fournis", () => {
      const entrepriseValide: DonneesSoumissionKyc = {
        ...baseValide,
        estEntreprise: true,
        nomEntreprise: "Kemit Distribution SARL",
        niu: "M051812345678A",
        rccm: "RC/DLA/2021/B/1234",
      };
      const res = validerCompletudeKyc(entrepriseValide);
      expect(res.valide).toBe(true);
      expect(res.erreurs).toHaveLength(0);
    });
  });

  describe("Affichage & UI helpers", () => {
    it("fournit les libellés corrects pour chaque statut", () => {
      expect(libelleStatutKyc("NON_SOUMIS")).toBe("Non soumis");
      expect(libelleStatutKyc("EN_REVUE")).toBe("En cours de vérification");
      expect(libelleStatutKyc("VALIDE")).toBe("Identité vérifiée");
      expect(libelleStatutKyc("REJETE")).toBe("Dossier refusé");
    });

    it("fournit le ton de badge adapté", () => {
      expect(badgeTonKyc("VALIDE")).toBe("vert");
      expect(badgeTonKyc("EN_REVUE")).toBe("ambre");
      expect(badgeTonKyc("REJETE")).toBe("rouge");
      expect(badgeTonKyc("NON_SOUMIS")).toBe("neutre");
    });
  });
  describe("État de boutique après validation KYC", () => {
    it("ne confond pas identité validée et boutique encore en attente", () => {
      expect(messageEtatBoutiqueApresKyc("EN_ATTENTE")).toContain("en attente de validation administrative");
      expect(messageEtatBoutiqueApresKyc("EN_ATTENTE")).toContain("pas encore autorisée");
    });

    it("confirme la vente uniquement si la boutique est VALIDE", () => {
      expect(messageEtatBoutiqueApresKyc("VALIDE")).toContain("autorisée à vendre");
      expect(messageEtatBoutiqueApresKyc("REJETE")).toContain("rejetée");
      expect(messageEtatBoutiqueApresKyc("SUSPENDU")).toContain("suspendue");
    });
  });
});
