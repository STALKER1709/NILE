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
      enAttente: 0,
      restantDu: 60000,
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

  it("une demande en attente est réservée : elle sort du disponible sans compter comme payée", () => {
    const s = calculerSolde({
      brut: 100000,
      tauxPourcent: 10,
      dejaReverse: 30000,
      enAttente: 20000,
      exempteCommission: false,
    });
    // Le dû total ne bouge pas : l'argent n'est pas encore parti.
    expect(s.restantDu).toBe(60000);
    expect(s.dejaReverse).toBe(30000);
    // Mais le vendeur ne peut plus demander que le reste.
    expect(s.enAttente).toBe(20000);
    expect(s.solde).toBe(40000);
  });

  it("une demande couvrant tout le dû ramène le disponible à zéro (pas de double demande)", () => {
    const s = calculerSolde({
      brut: 100000,
      tauxPourcent: 10,
      dejaReverse: 0,
      enAttente: 90000,
      exempteCommission: false,
    });
    expect(s.solde).toBe(0);
    expect(s.restantDu).toBe(90000);
  });

  it("des demandes supérieures au dû ne rendent pas le solde négatif", () => {
    const s = calculerSolde({
      brut: 10000,
      tauxPourcent: 10,
      dejaReverse: 0,
      enAttente: 999999,
      exempteCommission: false,
    });
    expect(s.solde).toBe(0);
  });

  it("un montant négatif d'attente est ramené à zéro", () => {
    const s = calculerSolde({
      brut: 100000,
      tauxPourcent: 10,
      dejaReverse: 0,
      enAttente: -5000,
      exempteCommission: false,
    });
    expect(s.enAttente).toBe(0);
    expect(s.solde).toBe(90000);
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
