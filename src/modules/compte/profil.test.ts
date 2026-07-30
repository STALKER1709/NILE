import { describe, expect, it } from "vitest";
import {
  aDesInfosPaiement,
  lireInfosPaiement,
} from "@/modules/compte/profil";
import {
  boutiqueSchema,
  infosPaiementSchema,
  profilSchema,
} from "@/validators/auth";

describe("lireInfosPaiement", () => {
  it("lit les numéros présents", () => {
    expect(
      lireInfosPaiement({ momoMtn: "677123456", momoOrange: "699123456", titulaire: "Awa" }),
    ).toEqual({ momoMtn: "677123456", momoOrange: "699123456", titulaire: "Awa" });
  });

  it("tolère un JSON absent, nul ou d'un autre type", () => {
    for (const brut of [null, undefined, 42, "texte", [], true]) {
      expect(lireInfosPaiement(brut)).toEqual({});
    }
  });

  it("ignore les champs vides ou d'un mauvais type", () => {
    expect(lireInfosPaiement({ momoMtn: "   ", momoOrange: 12345, titulaire: null })).toEqual({
      momoMtn: undefined,
      momoOrange: undefined,
      titulaire: undefined,
    });
  });

  it("conserve un seul numéro si l'autre manque", () => {
    expect(lireInfosPaiement({ momoOrange: "699000111" }).momoOrange).toBe("699000111");
    expect(lireInfosPaiement({ momoOrange: "699000111" }).momoMtn).toBeUndefined();
  });
});

describe("aDesInfosPaiement", () => {
  it("exige au moins un numéro", () => {
    expect(aDesInfosPaiement({})).toBe(false);
    expect(aDesInfosPaiement({ titulaire: "Awa" })).toBe(false);
    expect(aDesInfosPaiement({ momoMtn: "677123456" })).toBe(true);
    expect(aDesInfosPaiement({ momoOrange: "699123456" })).toBe(true);
  });
});

describe("profilSchema", () => {
  it("accepte un nom et un téléphone valides", () => {
    const r = profilSchema.safeParse({ nom: "Awa Ngono", telephone: "677123456" });
    expect(r.success).toBe(true);
  });

  it("refuse un nom trop court et un téléphone hors format camerounais", () => {
    expect(profilSchema.safeParse({ nom: "A", telephone: "677123456" }).success).toBe(false);
    expect(profilSchema.safeParse({ nom: "Awa Ngono", telephone: "12345" }).success).toBe(false);
  });

  it("n'expose aucun champ email (l'email n'est pas modifiable ici)", () => {
    const r = profilSchema.safeParse({
      nom: "Awa Ngono",
      telephone: "677123456",
      email: "pirate@exemple.cm",
    });
    expect(r.success).toBe(true);
    expect(r.success && "email" in r.data).toBe(false);
  });
});

describe("boutiqueSchema", () => {
  it("accepte un nom seul, description facultative", () => {
    const r = boutiqueSchema.safeParse({ nomBoutique: "Chez Awa" });
    expect(r.success).toBe(true);
    expect(r.success && r.data.description).toBeUndefined();
  });

  it("refuse un nom trop court", () => {
    expect(boutiqueSchema.safeParse({ nomBoutique: "A" }).success).toBe(false);
  });

  it("refuse une description trop longue", () => {
    const r = boutiqueSchema.safeParse({
      nomBoutique: "Chez Awa",
      description: "x".repeat(1001),
    });
    expect(r.success).toBe(false);
  });
});

describe("infosPaiementSchema", () => {
  it("accepte un seul opérateur", () => {
    expect(infosPaiementSchema.safeParse({ momoMtn: "677123456" }).success).toBe(true);
    expect(infosPaiementSchema.safeParse({ momoOrange: "699123456" }).success).toBe(true);
  });

  it("refuse de n'avoir aucun numéro : sans numéro, aucun reversement n'est possible", () => {
    expect(infosPaiementSchema.safeParse({}).success).toBe(false);
    expect(infosPaiementSchema.safeParse({ momoMtn: "", momoOrange: "" }).success).toBe(false);
    expect(infosPaiementSchema.safeParse({ titulaire: "Awa" }).success).toBe(false);
  });

  it("refuse un numéro mal formé", () => {
    expect(infosPaiementSchema.safeParse({ momoMtn: "abc" }).success).toBe(false);
  });
});
