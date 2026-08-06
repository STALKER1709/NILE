import { describe, it, expect } from "vitest";
import { decisionRemiseCash, ancienneteJours } from "@/modules/paiement/cash-core";

describe("decisionRemiseCash", () => {
  it("autorise la remise quand le livreur détient l'argent", () => {
    expect(
      decisionRemiseCash({ modePaiement: "COD", statutCash: "COLLECTE" }),
    ).toBe("OK");
  });

  it("refuse une seconde remise", () => {
    // Réenregistrer fausserait les totaux, et pourra payer un vendeur deux
    // fois une fois les reversements branchés dessus.
    expect(
      decisionRemiseCash({ modePaiement: "COD", statutCash: "REVERSE" }),
    ).toBe("DEJA_REMIS");
  });

  it("refuse tant que rien n'a été encaissé", () => {
    expect(
      decisionRemiseCash({ modePaiement: "COD", statutCash: "NON_COLLECTE" }),
    ).toBe("PAS_ENCAISSE");
    expect(
      decisionRemiseCash({ modePaiement: "COD", statutCash: "NON_APPLICABLE" }),
    ).toBe("PAS_ENCAISSE");
  });

  it("ignore les commandes réglées par Mobile Money", () => {
    // Aucun cash n'a circulé : il n'y a rien à remettre.
    expect(
      decisionRemiseCash({ modePaiement: "MONETBIL", statutCash: "COLLECTE" }),
    ).toBe("SANS_OBJET");
  });
});

describe("ancienneteJours", () => {
  const maintenant = new Date("2026-08-06T12:00:00Z");

  it("compte les jours pleins écoulés", () => {
    expect(ancienneteJours(new Date("2026-08-03T12:00:00Z"), maintenant)).toBe(3);
    expect(ancienneteJours(new Date("2026-08-06T00:00:00Z"), maintenant)).toBe(0);
  });

  it("n'invente pas d'ancienneté sans date de livraison", () => {
    expect(ancienneteJours(null, maintenant)).toBe(0);
    expect(ancienneteJours(undefined, maintenant)).toBe(0);
  });

  it("ne renvoie jamais de valeur négative", () => {
    // Horloges désynchronisées : une date de livraison dans le futur ne doit
    // pas produire une ancienneté négative affichée à l'écran.
    expect(ancienneteJours(new Date("2026-08-09T12:00:00Z"), maintenant)).toBe(0);
  });
});
