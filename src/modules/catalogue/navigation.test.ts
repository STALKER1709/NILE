import { describe, it, expect } from "vitest";
import { navigationCategories } from "@/modules/catalogue/categories";

const cat = (
  id: string,
  nom: string,
  parentId: string | null = null,
  ordre = 0,
) => ({ id, nom, slug: nom.toLowerCase(), parentId, ordre });

const CATEGORIES = [
  cat("mode", "Mode", null, 1),
  cat("elec", "Electronique", null, 2),
  cat("tshirts", "Tshirts", "mode", 1),
  cat("chaussures", "Chaussures", "mode", 2),
  cat("phones", "Phones", "elec", 1),
];

describe("navigationCategories", () => {
  it("n'affiche que les rayons quand rien n'est choisi", () => {
    // Aplatir toute l'arborescence donnait une colonne interminable où
    // l'essentiel ne concernait pas l'acheteur.
    expect(navigationCategories(CATEGORIES).map((e) => e.nom)).toEqual([
      "Mode",
      "Electronique",
    ]);
  });

  it("déplie les sous-catégories du rayon choisi", () => {
    expect(navigationCategories(CATEGORIES, "mode").map((e) => e.nom)).toEqual([
      "Mode",
      "Tshirts",
      "Chaussures",
      "Electronique",
    ]);
  });

  it("laisse le rayon déplié quand une sous-catégorie est choisie", () => {
    // Sans cela, l'acheteur perdrait le contexte dans lequel il vient de
    // descendre et ne pourrait pas passer à une sœur sans remonter.
    const noms = navigationCategories(CATEGORIES, "chaussures").map((e) => e.nom);
    expect(noms).toEqual(["Mode", "Tshirts", "Chaussures", "Electronique"]);
  });

  it("ne déplie qu'une branche à la fois", () => {
    expect(navigationCategories(CATEGORIES, "phones").map((e) => e.nom)).toEqual([
      "Mode",
      "Electronique",
      "Phones",
    ]);
  });

  it("marque l'entrée active, et elle seule", () => {
    const actives = navigationCategories(CATEGORIES, "chaussures").filter((e) => e.actif);
    expect(actives.map((e) => e.nom)).toEqual(["Chaussures"]);
  });

  it("respecte l'ordre déclaré, puis l'alphabet", () => {
    const desordre = [cat("b", "Banane", null, 5), cat("a", "Avocat", null, 5), cat("z", "Zeste", null, 1)];
    expect(navigationCategories(desordre).map((e) => e.nom)).toEqual([
      "Zeste",
      "Avocat",
      "Banane",
    ]);
  });

  it("indique le niveau, pour l'indentation", () => {
    const nav = navigationCategories(CATEGORIES, "mode");
    expect(nav.map((e) => e.niveau)).toEqual([0, 1, 1, 0]);
  });

  it("ignore un slug inconnu sans rien déplier", () => {
    expect(navigationCategories(CATEGORIES, "inexistant").map((e) => e.nom)).toEqual([
      "Mode",
      "Electronique",
    ]);
  });
});
