import { describe, it, expect } from "vitest";
import {
  calculerTotal,
  stockSuffisant,
  evaluerCommandeCOD,
  codBloqueParDette,
} from "@/modules/commande/commande-core";

describe("calculerTotal", () => {
  it("somme prix × quantité", () => {
    expect(
      calculerTotal([
        { prix: 1000, quantite: 2 },
        { prix: 500, quantite: 3 },
      ]),
    ).toBe(3500);
  });
  it("panier vide -> 0", () => {
    expect(calculerTotal([])).toBe(0);
  });
});

describe("stockSuffisant", () => {
  it("vrai si le stock couvre la demande", () => {
    expect(stockSuffisant(5, 5)).toBe(true);
    expect(stockSuffisant(5, 3)).toBe(true);
  });
  it("faux si stock insuffisant ou demande invalide", () => {
    expect(stockSuffisant(2, 3)).toBe(false);
    expect(stockSuffisant(5, 0)).toBe(false);
    expect(stockSuffisant(5, -1)).toBe(false);
    expect(stockSuffisant(5, 2.5)).toBe(false);
  });
});

describe("evaluerCommandeCOD (garde-fous)", () => {
  const base = { total: 10000, plafond: 150000, compteurNonAbouti: 0, maxNonAbouti: 3 };

  it("autorise une commande normale", () => {
    expect(evaluerCommandeCOD(base)).toBe("OK");
  });
  it("refuse si le total dépasse le plafond COD", () => {
    expect(evaluerCommandeCOD({ ...base, total: 200000 })).toBe("PLAFOND_DEPASSE");
  });
  it("refuse si trop de commandes non abouties", () => {
    expect(evaluerCommandeCOD({ ...base, compteurNonAbouti: 3 })).toBe(
      "TROP_COMMANDES_NON_ABOUTIES",
    );
  });
  it("priorise le blocage anti-fraude sur le plafond", () => {
    expect(
      evaluerCommandeCOD({ ...base, total: 999999, compteurNonAbouti: 5 }),
    ).toBe("TROP_COMMANDES_NON_ABOUTIES");
  });
});

describe("codBloqueParDette", () => {
  it("coupe le COD une fois le seuil atteint", () => {
    expect(codBloqueParDette(25000, 25000)).toBe(true);
    expect(codBloqueParDette(30000, 25000)).toBe(true);
  });

  it("laisse passer en dessous du seuil", () => {
    expect(codBloqueParDette(24999, 25000)).toBe(false);
    expect(codBloqueParDette(0, 25000)).toBe(false);
  });

  it("est désactivé par un seuil nul ou négatif", () => {
    // Sans cette échappatoire, une configuration à zéro couperait le COD à
    // tout le monde, y compris aux vendeurs sans la moindre dette.
    expect(codBloqueParDette(50000, 0)).toBe(false);
    expect(codBloqueParDette(0, 0)).toBe(false);
    expect(codBloqueParDette(50000, -1)).toBe(false);
  });
});
