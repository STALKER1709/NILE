import { describe, it, expect } from "vitest";
import {
  normaliserMarque,
  cleMarque,
  regrouperMarques,
} from "@/modules/catalogue/marque-core";

describe("normaliserMarque", () => {
  it("coupe les extrémités et réduit les espaces", () => {
    expect(normaliserMarque("  Yves   Saint  Laurent ")).toBe("Yves Saint Laurent");
  });

  it("corrige une saisie entièrement en minuscules", () => {
    expect(normaliserMarque("gucci")).toBe("Gucci");
    expect(normaliserMarque("yves saint laurent")).toBe("Yves Saint Laurent");
  });

  it("respecte les marques dont la casse est signifiante", () => {
    // Les passer en capitale initiale leur ferait perdre leur identité.
    expect(normaliserMarque("LG")).toBe("LG");
    expect(normaliserMarque("ASOS")).toBe("ASOS");
    expect(normaliserMarque("iPhone")).toBe("iPhone");
  });

  it("préserve les séparateurs internes", () => {
    expect(normaliserMarque("h&m")).toBe("H&M");
    expect(normaliserMarque("dolce&gabbana")).toBe("Dolce&Gabbana");
  });

  it("renvoie une chaîne vide pour une saisie vide", () => {
    expect(normaliserMarque("   ")).toBe("");
  });
});

describe("cleMarque", () => {
  it("ignore la casse et les accents", () => {
    // « Lacoste » et « lacôste » ne doivent pas former deux entrées de filtre.
    expect(cleMarque("Lacoste")).toBe(cleMarque("lacôste"));
  });

  it("ignore les espaces superflus", () => {
    expect(cleMarque(" Calvin  Klein ")).toBe(cleMarque("calvin klein"));
  });
});

describe("regrouperMarques", () => {
  it("retient la forme la plus fréquente", () => {
    // Dix « Nike » contre un « NIKE » : c'est le premier qui s'affiche.
    expect(regrouperMarques(["Nike", "Nike", "NIKE"])).toEqual(["Nike"]);
  });

  it("regroupe malgré la casse et les accents", () => {
    expect(regrouperMarques(["Lacoste", "lacôste", "LACOSTE"]).length).toBe(1);
  });

  it("trie le résultat par ordre alphabétique français", () => {
    expect(regrouperMarques(["Puma", "Adidas", "Élan"])).toEqual([
      "Adidas",
      "Élan",
      "Puma",
    ]);
  });

  it("ignore les valeurs vides", () => {
    expect(regrouperMarques(["", "   ", "Nike"])).toEqual(["Nike"]);
  });

  it("reste stable à égalité de fréquence", () => {
    // La première rencontrée gagne : le résultat ne doit pas changer d'un
    // affichage à l'autre.
    expect(regrouperMarques(["Nike", "NIKE"])).toEqual(["Nike"]);
    expect(regrouperMarques(["NIKE", "Nike"])).toEqual(["NIKE"]);
  });
});
