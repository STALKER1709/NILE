import { describe, it, expect } from "vitest";
import {
  calculerCommission,
  calculerSolde,
  verifierReversement,
} from "@/modules/reversement/reversement-core";

describe("calculerCommission", () => {
  it("applique le taux et arrondit au FCFA", () => {
    expect(calculerCommission(10000, 10, false)).toBe(1000);
    expect(calculerCommission(9999, 10, false)).toBe(1000); // 999,9 -> 1000
    expect(calculerCommission(105, 10, false)).toBe(11); // 10,5 -> 11
  });
  it("est nulle pour la boutique maison (exemptée)", () => {
    expect(calculerCommission(10000, 10, true)).toBe(0);
  });
  it("est nulle sans ventes", () => {
    expect(calculerCommission(0, 10, false)).toBe(0);
  });
});

describe("calculerSolde", () => {
  it("solde = brut - commission - déjà reversé", () => {
    const s = calculerSolde({
      brut: 100000,
      tauxPourcent: 10,
      dejaReverse: 30000,
      exempteCommission: false,
    });
    expect(s).toEqual({
      brut: 100000,
      commission: 10000,
      net: 90000,
      dejaReverse: 30000,
      solde: 60000,
    });
  });
  it("le solde ne devient jamais négatif", () => {
    const s = calculerSolde({
      brut: 1000,
      tauxPourcent: 10,
      dejaReverse: 5000,
      exempteCommission: false,
    });
    expect(s.solde).toBe(0);
  });
});

describe("verifierReversement", () => {
  it("accepte un montant entier positif dans la limite du solde", () => {
    expect(verifierReversement(5000, 5000)).toEqual({ ok: true });
  });
  it("refuse zéro, négatif ou non entier", () => {
    expect(verifierReversement(0, 5000).ok).toBe(false);
    expect(verifierReversement(-100, 5000).ok).toBe(false);
    expect(verifierReversement(10.5, 5000).ok).toBe(false);
  });
  it("refuse un montant supérieur au solde", () => {
    const r = verifierReversement(6000, 5000);
    expect(r).toEqual({ ok: false, code: "SOLDE_INSUFFISANT" });
  });
});
