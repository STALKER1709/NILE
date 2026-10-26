import { describe, it, expect } from "vitest";
import { roleInitialInscription } from "./registration-core";

describe("roleInitialInscription", () => {
  it("préselectionne VENDEUR depuis un parcours vendeur", () => {
    expect(roleInitialInscription("VENDEUR")).toBe("VENDEUR");
    expect(roleInitialInscription("vendeur")).toBe("VENDEUR");
  });

  it("conserve ACHETEUR par défaut pour les autres valeurs", () => {
    expect(roleInitialInscription(undefined)).toBe("ACHETEUR");
    expect(roleInitialInscription(null)).toBe("ACHETEUR");
    expect(roleInitialInscription("ADMIN")).toBe("ACHETEUR");
    expect(roleInitialInscription("")).toBe("ACHETEUR");
  });
});
