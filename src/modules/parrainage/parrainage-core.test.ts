import { describe, it, expect } from "vitest";
import {
  calculerPartsParrainage,
  evaluerParrainage,
  recompenseDue,
} from "@/modules/parrainage/parrainage-core";

describe("calculerPartsParrainage", () => {
  it("partage 5 % du panier en deux parts égales", () => {
    // 5 % de 10 000 = 500, soit 250 de chaque côté.
    expect(calculerPartsParrainage({ totalPanier: 10000 })).toEqual({
      filleul: 250,
      parrain: 250,
    });
  });

  it("donne le FCFA impair au filleul", () => {
    // 5 % de 10 100 = 505 : 253 au filleul (remise visible), 252 au parrain.
    expect(calculerPartsParrainage({ totalPanier: 10100 })).toEqual({
      filleul: 253,
      parrain: 252,
    });
  });

  it("plafonne CHAQUE part, pas le total", () => {
    // 5 % de 200 000 = 10 000, soit 5 000 par part : sans plafond, un gros
    // panier ferait exploser le coût d'acquisition.
    expect(
      calculerPartsParrainage({ totalPanier: 200000, plafondParPart: 1000 }),
    ).toEqual({ filleul: 1000, parrain: 1000 });
  });

  it("respecte un plafond désactivé", () => {
    expect(
      calculerPartsParrainage({ totalPanier: 200000, plafondParPart: 0 }),
    ).toEqual({ filleul: 5000, parrain: 5000 });
  });

  it("ne remise jamais plus que le panier", () => {
    expect(
      calculerPartsParrainage({
        totalPanier: 100,
        tauxPourcent: 100,
        plafondParPart: 0,
      }).filleul,
    ).toBeLessThanOrEqual(100);
  });

  it("ne donne rien sur un panier vide ou un taux nul", () => {
    expect(calculerPartsParrainage({ totalPanier: 0 })).toEqual({
      filleul: 0,
      parrain: 0,
    });
    expect(calculerPartsParrainage({ totalPanier: 10000, tauxPourcent: 0 })).toEqual({
      filleul: 0,
      parrain: 0,
    });
  });

  it("laisse le taux configurable", () => {
    expect(
      calculerPartsParrainage({ totalPanier: 10000, tauxPourcent: 10 }),
    ).toEqual({ filleul: 500, parrain: 500 });
  });
});

describe("evaluerParrainage", () => {
  const base = {
    parrainId: "parrain-1",
    filleulId: "filleul-1",
    telephoneParrain: "237655500393",
    telephoneFilleul: "237699000000",
    filleulDejaParraine: false,
  };

  it("accepte un rattachement normal", () => {
    expect(evaluerParrainage(base)).toBe("OK");
  });

  it("refuse un code inconnu", () => {
    expect(evaluerParrainage({ ...base, parrainId: null })).toBe("INTROUVABLE");
  });

  it("refuse l'auto-parrainage", () => {
    expect(evaluerParrainage({ ...base, parrainId: "filleul-1" })).toBe(
      "AUTO_PARRAINAGE",
    );
  });

  it("refuse un second compte au même numéro", () => {
    // Sans ce contrôle, il suffit de se réinscrire pour toucher les deux parts
    // sur ses propres achats.
    expect(
      evaluerParrainage({ ...base, telephoneFilleul: "237655500393" }),
    ).toBe("MEME_TELEPHONE");
  });

  it("refuse de changer un parrainage existant", () => {
    expect(evaluerParrainage({ ...base, filleulDejaParraine: true })).toBe(
      "DEJA_PARRAINE",
    );
  });

  it("signale d'abord le parrainage existant, avant le numéro", () => {
    // Un filleul déjà rattaché n'a pas à savoir quoi que ce soit du compte
    // qu'il tente de saisir.
    expect(
      evaluerParrainage({
        ...base,
        filleulDejaParraine: true,
        telephoneFilleul: "237655500393",
      }),
    ).toBe("DEJA_PARRAINE");
  });
});

describe("recompenseDue", () => {
  const livreePayee = {
    statutCommande: "LIVREE",
    statutPaiement: "PAYE",
    modePaiement: "MONETBIL",
    dejaRecompense: false,
  };

  it("est due sur une commande livrée et payée en Mobile Money", () => {
    expect(recompenseDue(livreePayee)).toBe(true);
  });

  it("n'est pas due avant la livraison", () => {
    // Sinon : commander, toucher la récompense, annuler.
    expect(
      recompenseDue({ ...livreePayee, statutCommande: "CONFIRMEE" }),
    ).toBe(false);
    expect(recompenseDue({ ...livreePayee, statutPaiement: "EN_ATTENTE" })).toBe(
      false,
    );
  });

  it("n'est pas due sur une commande payée à la livraison", () => {
    // L'argent ne transite pas par NILE : aucune marge d'où tirer la part.
    expect(recompenseDue({ ...livreePayee, modePaiement: "COD" })).toBe(false);
  });

  it("n'est jamais versée deux fois", () => {
    expect(recompenseDue({ ...livreePayee, dejaRecompense: true })).toBe(false);
  });
});
