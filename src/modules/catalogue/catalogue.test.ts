import { describe, it, expect } from "vitest";
import { slugifier } from "@/modules/catalogue/slug";
import {
  construireWhereProduits,
  normaliserParamsRecherche,
  parseEntierPositif,
} from "@/modules/catalogue/recherche";
import { collecterIdsCategorieEtDescendants } from "@/modules/catalogue/categories";

describe("slugifier", () => {
  it("retire accents, ponctuation et espaces", () => {
    expect(slugifier("Téléphone Samsung A54 !")).toBe("telephone-samsung-a54");
    expect(slugifier("  Éléphant   d'Afrique ")).toBe("elephant-d-afrique");
  });
});

describe("construireWhereProduits (règle de visibilité)", () => {
  it("n'expose QUE les produits ACTIF de boutiques VALIDÉES", () => {
    const where = construireWhereProduits({});
    expect(where.statut).toBe("ACTIF");
    expect(where.vendeur).toEqual({ is: { statutValidation: "VALIDE" } });
  });

  it("ajoute la recherche texte sur titre et description", () => {
    const where = construireWhereProduits({ q: "samsung" });
    expect(where.OR).toEqual([
      { titre: { contains: "samsung", mode: "insensitive" } },
      { description: { contains: "samsung", mode: "insensitive" } },
    ]);
  });

  it("filtre par catégories et par fourchette de prix", () => {
    const where = construireWhereProduits({
      categorieIds: ["a", "b"],
      prixMin: 1000,
      prixMax: 5000,
    });
    expect(where.categorieId).toEqual({ in: ["a", "b"] });
    expect(where.prix).toEqual({ gte: 1000, lte: 5000 });
  });
});

describe("normaliserParamsRecherche", () => {
  it("échange prixMin et prixMax s'ils sont incohérents", () => {
    const r = normaliserParamsRecherche({ prixMin: "5000", prixMax: "1000" });
    expect(r.prixMin).toBe(1000);
    expect(r.prixMax).toBe(5000);
  });

  it("ignore les prix invalides et applique un tri par défaut", () => {
    const r = normaliserParamsRecherche({ prixMin: "abc", tri: "n'importe" });
    expect(r.prixMin).toBeUndefined();
    expect(r.tri).toBe("recent");
  });
});

describe("parseEntierPositif", () => {
  it("accepte les entiers positifs, rejette le reste", () => {
    expect(parseEntierPositif("1500")).toBe(1500);
    expect(parseEntierPositif("0")).toBe(0);
    expect(parseEntierPositif("-5")).toBeUndefined();
    expect(parseEntierPositif("12.5")).toBeUndefined();
    expect(parseEntierPositif("")).toBeUndefined();
  });
});

describe("collecterIdsCategorieEtDescendants", () => {
  const cats = [
    { id: "electronique", parentId: null },
    { id: "telephones", parentId: "electronique" },
    { id: "accessoires", parentId: "electronique" },
    { id: "chargeurs", parentId: "accessoires" },
    { id: "maison", parentId: null },
  ];

  it("inclut la catégorie et toute sa descendance", () => {
    const ids = collecterIdsCategorieEtDescendants("electronique", cats).sort();
    expect(ids).toEqual(
      ["accessoires", "chargeurs", "electronique", "telephones"].sort(),
    );
  });

  it("renvoie juste la catégorie si elle n'a pas d'enfant", () => {
    expect(collecterIdsCategorieEtDescendants("maison", cats)).toEqual([
      "maison",
    ]);
  });
});
