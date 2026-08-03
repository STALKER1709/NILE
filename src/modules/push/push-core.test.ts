import { describe, it, expect } from "vitest";
import {
  chargeNouvelleCommandeVendeur,
  chargeNouvelleCommandeAdmin,
  chargeStatutAcheteur,
  chargeRappelConfirmation,
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

describe("chargeStatutAcheteur", () => {
  const base = {
    numero: "NILE-2026-CCCC3333",
    commandeId: "cmd-1",
    total: 15000,
  } as const;

  it("ouvre toujours la commande concernée", () => {
    for (const statut of ["CONFIRMEE", "EXPEDIEE", "LIVREE"] as const) {
      const c = chargeStatutAcheteur({ ...base, statut, modePaiement: "COD" });
      expect(c.url).toBe("/commandes/cmd-1");
      expect(c.titre).toContain("NILE-2026-CCCC3333");
    }
  });

  it("COD confirmée : annonce le montant à régler à la livraison", () => {
    const c = chargeStatutAcheteur({ ...base, statut: "CONFIRMEE", modePaiement: "COD" });
    expect(c.corps).toContain("15 000");
    expect(c.corps).toContain("livraison");
  });

  it("Mobile Money confirmée : indique que c'est déjà payé", () => {
    const c = chargeStatutAcheteur({ ...base, statut: "CONFIRMEE", modePaiement: "MONETBIL" });
    expect(c.corps).toContain("payés");
    expect(c.corps).not.toContain("à régler");
  });

  it("COD expédiée : rappelle de préparer l'argent avant de payer", () => {
    const c = chargeStatutAcheteur({ ...base, statut: "EXPEDIEE", modePaiement: "COD" });
    expect(c.corps).toContain("15 000");
    expect(c.corps).toContain("espèces");
    expect(c.corps).toContain("avant de payer");
  });

  it("Mobile Money expédiée : ne réclame aucun paiement", () => {
    const c = chargeStatutAcheteur({ ...base, statut: "EXPEDIEE", modePaiement: "MONETBIL" });
    expect(c.corps).not.toContain("espèces");
    expect(c.corps).not.toContain("Préparez");
  });

  it("livrée : invite à confirmer la réception", () => {
    const c = chargeStatutAcheteur({ ...base, statut: "LIVREE", modePaiement: "COD" });
    expect(c.corps).toContain("Confirmez");
  });

  it("en préparation : annonce la préparation sans réclamer d'argent", () => {
    const c = chargeStatutAcheteur({ ...base, statut: "EN_PREPARATION", modePaiement: "COD" });
    expect(c.titre).toContain("préparation");
    expect(c.corps).not.toContain("espèces");
  });

  it("les quatre étapes produisent des titres distincts", () => {
    const titres = (["CONFIRMEE", "EN_PREPARATION", "EXPEDIEE", "LIVREE"] as const).map(
      (statut) => chargeStatutAcheteur({ ...base, statut, modePaiement: "COD" }).titre,
    );
    expect(new Set(titres).size).toBe(4);
  });
});

describe("chargeRappelConfirmation", () => {
  it("ouvre la commande à confirmer", () => {
    const c = chargeRappelConfirmation({ numero: "NILE-2026-DDDD4444", commandeId: "cmd-9" });
    expect(c.corps).toContain("NILE-2026-DDDD4444");
    expect(c.url).toBe("/commandes/cmd-9");
  });
});
