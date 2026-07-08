import { describe, it, expect } from "vitest";
import { formaterXAF, estMontantXAFValide } from "@/lib/money";

describe("formaterXAF", () => {
  it("formate avec séparateurs de milliers", () => {
    expect(formaterXAF(150000)).toBe("150 000 FCFA");
    expect(formaterXAF(0)).toBe("0 FCFA");
    expect(formaterXAF(999)).toBe("999 FCFA");
    expect(formaterXAF(1000000)).toBe("1 000 000 FCFA");
  });

  it("gère les montants négatifs", () => {
    expect(formaterXAF(-2500)).toBe("-2 500 FCFA");
  });

  it("rejette les montants non entiers (bug à détecter tôt)", () => {
    expect(() => formaterXAF(100.5)).toThrow();
  });
});

describe("estMontantXAFValide", () => {
  it("accepte les entiers positifs et zéro", () => {
    expect(estMontantXAFValide(0)).toBe(true);
    expect(estMontantXAFValide(150000)).toBe(true);
  });

  it("refuse décimales et négatifs", () => {
    expect(estMontantXAFValide(100.5)).toBe(false);
    expect(estMontantXAFValide(-1)).toBe(false);
  });
});
