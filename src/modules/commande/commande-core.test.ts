import { describe, it, expect } from "vitest";
import {
  calculerTotal,
  stockSuffisant,
  evaluerCommandeCOD,
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
