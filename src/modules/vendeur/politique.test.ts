import { describe, expect, it } from "vitest";
import {
  montantRespecteMinimumReversement,
  POLITIQUE_VENDEUR,
} from "@/modules/vendeur/politique";

describe("politique vendeur NILE", () => {
  it("applique le minimum de reversement de 10 000 FCFA", () => {
    expect(montantRespecteMinimumReversement(9_999)).toBe(false);
    expect(montantRespecteMinimumReversement(10_000)).toBe(true);
    expect(montantRespecteMinimumReversement(10_001)).toBe(true);
  });

  it("refuse les montants non entiers ou non sûrs", () => {
    expect(montantRespecteMinimumReversement(10_000.5)).toBe(false);
    expect(montantRespecteMinimumReversement(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });

  it("conserve les décisions approuvées", () => {
    expect(POLITIQUE_VENDEUR.commissionPourcent).toBe(12);
    expect(POLITIQUE_VENDEUR.reversement.fraisSupplementaires).toBe(0);
    expect(POLITIQUE_VENDEUR.reversement.frequence).toBe("HEBDOMADAIRE");
    expect(POLITIQUE_VENDEUR.verification.delaiCibleHeuresOuvrees).toBe(48);
  });
});
