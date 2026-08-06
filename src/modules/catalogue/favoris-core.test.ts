import { describe, it, expect } from "vitest";
import {
  etatFavori,
  messageEtatFavori,
  actionFavori,
} from "@/modules/catalogue/favoris-core";

describe("etatFavori", () => {
  it("reconnaît un article achetable", () => {
    expect(etatFavori({ achetable: true, stock: 3 })).toBe("DISPONIBLE");
  });

  it("distingue l'épuisé du retiré", () => {
    expect(etatFavori({ achetable: true, stock: 0 })).toBe("EPUISE");
    expect(etatFavori({ achetable: false, stock: 0 })).toBe("RETIRE");
  });

  it("dit « retiré » avant « épuisé »", () => {
    // Un article retiré de la vente est à zéro de stock aussi ; annoncer
    // « épuisé » laisserait espérer un réassort qui ne viendra pas.
    expect(etatFavori({ achetable: false, stock: 12 })).toBe("RETIRE");
  });
});

describe("messageEtatFavori", () => {
  it("ne dit rien quand tout va bien", () => {
    // Une pastille « Disponible » sur chaque ligne noierait les deux qui
    // demandent une décision.
    expect(messageEtatFavori("DISPONIBLE")).toBeNull();
  });

  it("nomme les deux situations qui bloquent l'achat", () => {
    expect(messageEtatFavori("EPUISE")).toMatch(/pui/i);
    expect(messageEtatFavori("RETIRE")).toMatch(/disponible/i);
  });
});

describe("actionFavori", () => {
  it("propose l'ajout direct pour un article non décliné", () => {
    expect(actionFavori({ achetable: true, stock: 2, varianteId: "v1" })).toBe(
      "AJOUTER",
    );
  });

  it("renvoie à la fiche pour un article décliné", () => {
    // Personne ne peut choisir la taille à la place de l'acheteur depuis une
    // liste de souhaits.
    expect(actionFavori({ achetable: true, stock: 2, varianteId: null })).toBe(
      "CHOISIR",
    );
  });

  it("ne propose rien sur un article indisponible", () => {
    expect(actionFavori({ achetable: true, stock: 0, varianteId: "v1" })).toBe(
      "AUCUNE",
    );
    expect(actionFavori({ achetable: false, stock: 5, varianteId: "v1" })).toBe(
      "AUCUNE",
    );
  });
});
