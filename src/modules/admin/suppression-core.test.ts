import { describe, it, expect } from "vitest";
import {
  modeSuppressionProduit,
  modeSuppressionUtilisateur,
  verifierSuppressionCompte,
  donneesAnonymisation,
  phraseConfirmationValide,
  PHRASE_PURGE,
  PHRASE_REINITIALISATION,
} from "@/modules/admin/suppression-core";

describe("modeSuppressionProduit", () => {
  it("efface un produit jamais commandé", () => {
    expect(modeSuppressionProduit(0)).toBe("DEFINITIVE");
  });
  it("met en corbeille dès qu'une commande le référence", () => {
    expect(modeSuppressionProduit(1)).toBe("CORBEILLE");
    expect(modeSuppressionProduit(42)).toBe("CORBEILLE");
  });
});

describe("modeSuppressionUtilisateur", () => {
  const vierge = { nbCommandes: 0, nbAvis: 0, nbLignesVendues: 0, nbReversements: 0 };

  it("efface un compte sans aucun historique", () => {
    expect(modeSuppressionUtilisateur(vierge)).toBe("DEFINITIVE");
  });

  it("anonymise dès qu'il existe une trace, quelle qu'elle soit", () => {
    expect(modeSuppressionUtilisateur({ ...vierge, nbCommandes: 1 })).toBe("ANONYMISATION");
    expect(modeSuppressionUtilisateur({ ...vierge, nbAvis: 1 })).toBe("ANONYMISATION");
    expect(modeSuppressionUtilisateur({ ...vierge, nbLignesVendues: 1 })).toBe("ANONYMISATION");
    expect(modeSuppressionUtilisateur({ ...vierge, nbReversements: 1 })).toBe("ANONYMISATION");
  });
});

describe("verifierSuppressionCompte", () => {
  it("autorise la suppression d'un autre compte", () => {
    expect(
      verifierSuppressionCompte({
        adminId: "a1", cibleId: "u1", cibleEstAdmin: false, nbAdmins: 1,
      }),
    ).toEqual({ ok: true });
  });

  it("refuse qu'un admin se supprime lui-même", () => {
    expect(
      verifierSuppressionCompte({
        adminId: "a1", cibleId: "a1", cibleEstAdmin: true, nbAdmins: 3,
      }),
    ).toEqual({ ok: false, code: "SOI_MEME" });
  });

  it("refuse de retirer le dernier administrateur", () => {
    expect(
      verifierSuppressionCompte({
        adminId: "a1", cibleId: "a2", cibleEstAdmin: true, nbAdmins: 1,
      }),
    ).toEqual({ ok: false, code: "DERNIER_ADMIN" });
  });

  it("autorise le retrait d'un admin s'il en reste d'autres", () => {
    expect(
      verifierSuppressionCompte({
        adminId: "a1", cibleId: "a2", cibleEstAdmin: true, nbAdmins: 2,
      }),
    ).toEqual({ ok: true });
  });
});

describe("donneesAnonymisation", () => {
  it("produit un email unique et non routable", () => {
    const a = donneesAnonymisation("u1");
    const b = donneesAnonymisation("u2");
    expect(a.email).not.toBe(b.email);
    // Domaine réservé : aucun message ne partira jamais vers cette adresse.
    expect(a.email.endsWith("@nile.invalid")).toBe(true);
  });
  it("efface les données personnelles", () => {
    const d = donneesAnonymisation("u1");
    expect(d.nom).toBe("Compte supprimé");
    expect(d.telephone).toBe("");
  });
});

describe("phraseConfirmationValide", () => {
  it("accepte la phrase exacte", () => {
    expect(phraseConfirmationValide(PHRASE_PURGE, PHRASE_PURGE)).toBe(true);
  });
  it("tolère la casse et les espaces superflus", () => {
    expect(phraseConfirmationValide("  vider les  donnees ", PHRASE_PURGE)).toBe(true);
  });
  it("refuse une phrase approchante", () => {
    expect(phraseConfirmationValide("VIDER LES DONNEE", PHRASE_PURGE)).toBe(false);
    expect(phraseConfirmationValide("", PHRASE_PURGE)).toBe(false);
    expect(phraseConfirmationValide("oui", PHRASE_PURGE)).toBe(false);
  });
  it("ne confond pas les deux phrases", () => {
    expect(phraseConfirmationValide(PHRASE_PURGE, PHRASE_REINITIALISATION)).toBe(false);
    expect(phraseConfirmationValide(PHRASE_REINITIALISATION, PHRASE_PURGE)).toBe(false);
  });
});
