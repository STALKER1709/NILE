import { describe, it, expect } from "vitest";
import {
  chargeNouvelleCommandeVendeur,
  chargeNouvelleCommandeAdmin,
  vendeursAvecTotaux,
} from "@/modules/push/push-core";

describe("vendeursAvecTotaux", () => {
  it("agrège articles et totaux par vendeur", () => {
    const map = vendeursAvecTotaux([
      { vendeurId: "v1", quantite: 2, sousTotal: 20000 },
      { vendeurId: "v2", quantite: 1, sousTotal: 5000 },
      { vendeurId: "v1", quantite: 1, sousTotal: 7000 },
    ]);
    expect(map.get("v1")).toEqual({ nbArticles: 3, totalVendeur: 27000 });
    expect(map.get("v2")).toEqual({ nbArticles: 1, totalVendeur: 5000 });
  });
});

describe("chargeNouvelleCommandeVendeur", () => {
  it("COD : mentionne le paiement à la livraison et ouvre les commandes vendeur", () => {
    const c = chargeNouvelleCommandeVendeur({
      numero: "NILE-2026-AAAA1111",
      nbArticles: 3,
      totalVendeur: 27000,
      modePaiement: "COD",
    });
    expect(c.titre).toContain("NILE-2026-AAAA1111");
    expect(c.corps).toContain("3 articles");
    expect(c.corps).toContain("27 000");
    expect(c.corps).toContain("livraison");
    expect(c.url).toBe("/vendeur/commandes");
  });

  it("Mobile Money : indique déjà payée, singulier correct", () => {
    const c = chargeNouvelleCommandeVendeur({
      numero: "NILE-2026-AAAA1111",
      nbArticles: 1,
      totalVendeur: 5000,
      modePaiement: "MONETBIL",
    });
    expect(c.corps).toContain("1 article ");
    expect(c.corps).toContain("déjà payée");
  });
});

describe("chargeNouvelleCommandeAdmin", () => {
  it("résume la commande et ouvre l'admin", () => {
    const c = chargeNouvelleCommandeAdmin({
      numero: "NILE-2026-BBBB2222",
      total: 15000,
      modePaiement: "COD",
    });
    expect(c.titre).toContain("NILE-2026-BBBB2222");
    expect(c.corps).toContain("15 000");
    expect(c.url).toBe("/admin/commandes");
  });
});
