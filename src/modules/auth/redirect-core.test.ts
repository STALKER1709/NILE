import { describe, it, expect } from "vitest";
import { cheminInterneSecurise } from "./redirect-core";

describe("cheminInterneSecurise", () => {
  it("conserve les destinations internes avec leurs paramètres", () => {
    expect(cheminInterneSecurise("/vendeur/produits?filtre=actif")).toBe("/vendeur/produits?filtre=actif");
  });

  it("refuse les URL externes et les formes ambiguës", () => {
    expect(cheminInterneSecurise("https://example.com")).toBeNull();
    expect(cheminInterneSecurise("//example.com")).toBeNull();
    expect(cheminInterneSecurise("/\\\\example.com")).toBeNull();
    expect(cheminInterneSecurise("")).toBeNull();
  });
});
