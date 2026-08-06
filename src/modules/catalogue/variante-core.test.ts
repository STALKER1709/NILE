import { describe, it, expect } from "vitest";
import {
  trierTailles,
  varianteDisponible,
  aDesDeclinaisons,
  stockTotal,
  optionsDeclinaison,
  trouverVariante,
  couleursPourTaille,
  evaluerAjoutPanier,
  libelleVariante,
  type Variante,
} from "@/modules/catalogue/variante-core";

function v(
  id: string,
  taille: string,
  couleur: string,
  stock: number,
  actif = true,
): Variante {
  return { id, taille, couleur, stock, actif };
}

describe("trierTailles", () => {
  it("suit l'ordre des vêtements, pas l'alphabet", () => {
    // Trié alphabétiquement, on obtiendrait « L, M, S, XL ».
    expect(trierTailles(["XL", "M", "S", "L"])).toEqual(["S", "M", "L", "XL"]);
  });

  it("rejette les tailles hors barème à la fin", () => {
    expect(trierTailles(["42", "M", "XS"])).toEqual(["XS", "M", "42"]);
  });

  it("est insensible à la casse et aux espaces", () => {
    expect(trierTailles([" xl ", "s"])).toEqual(["s", " xl "]);
  });
});

describe("aDesDeclinaisons", () => {
  it("reconnaît un produit sans taille ni couleur", () => {
    // Sa variante unique porte deux chaînes vides : aucun sélecteur à afficher.
    expect(aDesDeclinaisons([v("1", "", "", 5)])).toBe(false);
  });

  it("reconnaît un produit décliné sur un seul axe", () => {
    expect(aDesDeclinaisons([v("1", "M", "", 5), v("2", "L", "", 3)])).toBe(true);
  });
});

describe("stockTotal", () => {
  it("additionne les variantes actives", () => {
    expect(stockTotal([v("1", "M", "Bleu", 2), v("2", "L", "Bleu", 3)])).toBe(5);
  });

  it("ignore les variantes retirées de la vente", () => {
    expect(stockTotal([v("1", "M", "Bleu", 2), v("2", "L", "Bleu", 9, false)])).toBe(2);
  });

  it("ne compte jamais un stock négatif", () => {
    expect(stockTotal([v("1", "M", "Bleu", -3)])).toBe(0);
  });
});

describe("optionsDeclinaison", () => {
  const variantes = [
    v("1", "L", "Rouge", 0),
    v("2", "M", "Bleu", 4),
    v("3", "M", "Rouge", 2),
    v("4", "XL", "Bleu", 1, false),
  ];

  it("liste les tailles dans l'ordre des vêtements", () => {
    expect(optionsDeclinaison(variantes).tailles).toEqual(["M", "L"]);
  });

  it("garde les tailles épuisées", () => {
    // La taille L est en rupture, mais elle doit rester visible et grisée :
    // la faire disparaître donne à l'acheteur l'impression d'un bug.
    expect(optionsDeclinaison(variantes).tailles).toContain("L");
  });

  it("exclut les variantes retirées de la vente", () => {
    expect(optionsDeclinaison(variantes).tailles).not.toContain("XL");
  });

  it("liste les couleurs sans doublon", () => {
    expect(optionsDeclinaison(variantes).couleurs).toEqual(["Bleu", "Rouge"]);
  });
});

describe("couleursPourTaille", () => {
  const variantes = [
    v("1", "M", "Bleu", 3),
    v("2", "M", "Rouge", 2),
    v("3", "L", "Bleu", 1),
    v("4", "L", "Rouge", 0),
  ];

  it("ne propose que les couleurs réellement disponibles dans cette taille", () => {
    // Le rouge existe en L, mais il est épuisé : le proposer conduirait à un
    // refus au panier après coup.
    expect(couleursPourTaille(variantes, "L")).toEqual(["Bleu"]);
    expect(couleursPourTaille(variantes, "M")).toEqual(["Bleu", "Rouge"]);
  });
});

describe("trouverVariante", () => {
  const variantes = [v("1", "M", "Bleu", 3), v("2", "", "", 7)];

  it("retrouve une combinaison exacte", () => {
    expect(trouverVariante(variantes, { taille: "M", couleur: "Bleu" })?.id).toBe("1");
  });

  it("retrouve la variante d'un produit sans déclinaison", () => {
    expect(trouverVariante([variantes[1]!], {})?.id).toBe("2");
  });

  it("renvoie null sur une combinaison inexistante", () => {
    expect(trouverVariante(variantes, { taille: "XL", couleur: "Bleu" })).toBeNull();
  });
});

describe("evaluerAjoutPanier", () => {
  it("accepte dans la limite du stock", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "M", "Bleu", 3), quantiteDemandee: 3 }),
    ).toBe("OK");
  });

  it("refuse au-delà du stock", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "M", "Bleu", 3), quantiteDemandee: 4 }),
    ).toBe("STOCK_INSUFFISANT");
  });

  it("compte ce qui est déjà dans SON panier", () => {
    // Sans cela, l'acheteur empilerait cinq fois le dernier article.
    expect(
      evaluerAjoutPanier({
        variante: v("1", "M", "Bleu", 3),
        quantiteDemandee: 2,
        quantiteDejaAuPanier: 2,
      }),
    ).toBe("STOCK_INSUFFISANT");
  });

  it("refuse une déclinaison retirée de la vente", () => {
    expect(
      evaluerAjoutPanier({
        variante: v("1", "M", "Bleu", 9, false),
        quantiteDemandee: 1,
      }),
    ).toBe("INDISPONIBLE");
  });

  it("refuse un choix qui ne correspond à rien", () => {
    expect(evaluerAjoutPanier({ variante: null, quantiteDemandee: 1 })).toBe(
      "INTROUVABLE",
    );
  });

  it("refuse une quantité nulle ou négative", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "M", "Bleu", 3), quantiteDemandee: 0 }),
    ).toBe("STOCK_INSUFFISANT");
  });
});

describe("libelleVariante", () => {
  it("assemble les axes renseignés", () => {
    expect(libelleVariante({ taille: "XL", couleur: "Bleu" })).toBe("XL · Bleu");
    expect(libelleVariante({ taille: "XL", couleur: "" })).toBe("XL");
  });

  it("ne laisse pas de séparateur orphelin sans déclinaison", () => {
    expect(libelleVariante({ taille: "", couleur: "" })).toBe("");
  });
});
