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
      brutCOD: 0,
      commission: 10000,
      net: 90000,
      dejaReverse: 30000,
      enAttente: 0,
      restantDu: 60000,
      dette: 0,
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

describe("commission des ventes à la livraison", () => {
  it("compte le cash dans l'assiette, jamais dans le reversable", () => {
    // 100 000 encaissés par NILE, 50 000 encaissés en espèces par le vendeur.
    // Commission due sur les 150 000, retenue sur les seuls 100 000 détenus.
    const s = calculerSolde({
      brut: 100000,
      brutCOD: 50000,
      tauxPourcent: 12,
      dejaReverse: 0,
      exempteCommission: false,
    });
    expect(s.commission).toBe(18000);
    expect(s.net).toBe(82000);
    expect(s.solde).toBe(82000);
    expect(s.dette).toBe(0);
  });

  it("laisse apparaître une créance quand le cash domine", () => {
    // Presque tout en espèces : la commission dépasse ce que NILE détient.
    // Le vendeur doit la différence — masquer ce cas ferait disparaître une
    // créance de la plateforme.
    const s = calculerSolde({
      brut: 10000,
      brutCOD: 200000,
      tauxPourcent: 12,
      dejaReverse: 0,
      exempteCommission: false,
    });
    expect(s.commission).toBe(25200);
    expect(s.net).toBe(-15200);
    expect(s.dette).toBe(15200);
    // Rien à demander : on ne verse pas un solde négatif.
    expect(s.solde).toBe(0);
    expect(s.restantDu).toBe(0);
  });

  it("n'invente aucune commission pour la boutique maison", () => {
    const s = calculerSolde({
      brut: 100000,
      brutCOD: 50000,
      tauxPourcent: 12,
      dejaReverse: 0,
      exempteCommission: true,
    });
    expect(s.commission).toBe(0);
    expect(s.net).toBe(100000);
    expect(s.dette).toBe(0);
  });

  it("se comporte comme avant quand il n'y a aucune vente en espèces", () => {
    const avec = calculerSolde({
      brut: 100000,
      brutCOD: 0,
      tauxPourcent: 12,
      dejaReverse: 0,
      exempteCommission: false,
    });
    const sans = calculerSolde({
      brut: 100000,
      tauxPourcent: 12,
      dejaReverse: 0,
      exempteCommission: false,
    });
    expect(avec).toEqual(sans);
  });

  it("compte comme dette un reversement déjà payé au-delà du net", () => {
    // Le vendeur a été payé avant d'accumuler des ventes en espèces : ce qui
    // a été versé en trop reste dû à NILE.
    const s = calculerSolde({
      brut: 100000,
      brutCOD: 100000,
      tauxPourcent: 12,
      dejaReverse: 90000,
      exempteCommission: false,
    });
    expect(s.commission).toBe(24000);
    expect(s.net).toBe(76000);
    expect(s.dette).toBe(14000);
    expect(s.solde).toBe(0);
  });
});
