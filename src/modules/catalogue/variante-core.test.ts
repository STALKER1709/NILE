import { describe, it, expect } from "vitest";
import {
  resoudreAxes,
  trierSelonAxe,
  varianteDisponible,
  aDesDeclinaisons,
  stockTotal,
  valeursProposees,
  valeur2Pour,
  conserverValeur2,
  trouverVariante,
  evaluerAjoutPanier,
  libelleVariante,
  verifierCombinaison,
  type Variante,
  type AxeDeclinaison,
} from "@/modules/catalogue/variante-core";

function v(
  id: string,
  valeur1: string,
  valeur2: string,
  stock: number,
  actif = true,
): Variante {
  return { id, valeur1, valeur2, stock, actif };
}

const TAILLES: AxeDeclinaison = {
  rang: 1,
  libelle: "Taille",
  valeurs: ["XS", "S", "M", "L", "XL", "XXL"],
};
const POINTURES: AxeDeclinaison = {
  rang: 1,
  libelle: "Pointure",
  valeurs: ["36", "38", "40", "42", "44", "46"],
};
const COULEURS: AxeDeclinaison = {
  rang: 2,
  libelle: "Couleur",
  valeurs: ["Noir", "Blanc", "Bleu", "Rouge"],
};

describe("resoudreAxes", () => {
  it("prend les axes de la catégorie elle-même", () => {
    expect(resoudreAxes([{ axes: [TAILLES] }, { axes: [POINTURES] }])).toEqual([
      TAILLES,
    ]);
  });

  it("hérite du parent quand la catégorie n'en déclare aucun", () => {
    // « Vêtements > T-shirts » n'a pas à redéclarer les tailles : elles
    // finiraient par diverger de celles du parent.
    expect(resoudreAxes([{ axes: [] }, { axes: [TAILLES, COULEURS] }])).toEqual([
      TAILLES,
      COULEURS,
    ]);
  });

  it("ne fusionne jamais deux niveaux", () => {
    // Le premier niveau qui déclare gagne ENTIÈREMENT : un héritage partiel
    // produirait des combinaisons que personne n'a voulues.
    expect(resoudreAxes([{ axes: [POINTURES] }, { axes: [TAILLES, COULEURS] }])).toEqual(
      [POINTURES],
    );
  });

  it("renvoie une liste vide pour une catégorie sans déclinaison", () => {
    // Un téléviseur : aucun axe, donc aucun sélecteur, sans règle en dur.
    expect(resoudreAxes([{ axes: [] }, { axes: [] }])).toEqual([]);
  });

  it("ordonne les axes par rang", () => {
    expect(resoudreAxes([{ axes: [COULEURS, TAILLES] }])).toEqual([TAILLES, COULEURS]);
  });
});

describe("trierSelonAxe", () => {
  it("suit l'ordre du référentiel, pas l'alphabet", () => {
    // Alphabétiquement on obtiendrait « L, M, S, XL ».
    expect(trierSelonAxe(["XL", "M", "S", "L"], TAILLES)).toEqual([
      "S",
      "M",
      "L",
      "XL",
    ]);
  });

  it("classe correctement des pointures numériques", () => {
    expect(trierSelonAxe(["42", "36", "40"], POINTURES)).toEqual(["36", "40", "42"]);
  });

  it("rejette à la fin ce qui est absent du référentiel", () => {
    expect(trierSelonAxe(["48", "M", "XS"], TAILLES)).toEqual(["XS", "M", "48"]);
  });

  it("trie naturellement les valeurs hors référentiel", () => {
    // Sans tri naturel, « 10 » passerait avant « 8 ».
    expect(trierSelonAxe(["10", "8"], TAILLES)).toEqual(["8", "10"]);
  });

  it("reste utilisable sans référentiel du tout", () => {
    expect(trierSelonAxe(["Bleu", "Amande"])).toEqual(["Amande", "Bleu"]);
  });
});

describe("aDesDeclinaisons", () => {
  it("reconnaît un article sans déclinaison", () => {
    expect(aDesDeclinaisons([v("1", "", "", 5)])).toBe(false);
  });
  it("reconnaît un article décliné sur un seul axe", () => {
    expect(aDesDeclinaisons([v("1", "40", "", 5), v("2", "42", "", 3)])).toBe(true);
  });
});

describe("stockTotal", () => {
  it("additionne les déclinaisons actives", () => {
    expect(stockTotal([v("1", "40", "Noir", 2), v("2", "42", "Noir", 3)])).toBe(5);
  });
  it("ignore celles retirées de la vente", () => {
    expect(stockTotal([v("1", "40", "Noir", 2), v("2", "42", "Noir", 9, false)])).toBe(2);
  });
  it("ne compte jamais un stock négatif", () => {
    expect(stockTotal([v("1", "40", "Noir", -3)])).toBe(0);
  });
});

describe("valeursProposees", () => {
  const chaussures = [
    v("1", "42", "Noir", 0),
    v("2", "38", "Noir", 4),
    v("3", "38", "Blanc", 2),
    v("4", "46", "Noir", 1, false),
  ];

  it("ordonne selon le référentiel de l'axe", () => {
    expect(valeursProposees(chaussures, 1, POINTURES)).toEqual(["38", "42"]);
  });

  it("garde les valeurs épuisées", () => {
    // Le 42 est en rupture : le faire disparaître donne l'impression d'un bug.
    expect(valeursProposees(chaussures, 1, POINTURES)).toContain("42");
  });

  it("exclut les déclinaisons retirées de la vente", () => {
    expect(valeursProposees(chaussures, 1, POINTURES)).not.toContain("46");
  });

  it("lit le second axe", () => {
    expect(valeursProposees(chaussures, 2, COULEURS)).toEqual(["Noir", "Blanc"]);
  });
});

describe("valeur2Pour", () => {
  const chaussures = [
    v("1", "40", "Noir", 3),
    v("2", "40", "Blanc", 2),
    v("3", "42", "Noir", 1),
    v("4", "42", "Blanc", 0),
  ];

  it("ne propose que ce qui est réellement disponible dans cette valeur", () => {
    // Le blanc existe en 42 mais il est épuisé : le proposer conduirait à un
    // refus au panier après coup.
    expect(valeur2Pour(chaussures, "42", COULEURS)).toEqual(["Noir"]);
    expect(valeur2Pour(chaussures, "40", COULEURS)).toEqual(["Noir", "Blanc"]);
  });
});

describe("conserverValeur2", () => {
  const chaussures = [
    v("1", "40", "Noir", 3),
    v("2", "40", "Blanc", 2),
    v("3", "42", "Noir", 1),
  ];

  it("garde la couleur quand elle existe dans la nouvelle taille", () => {
    // La reperdre à chaque essai de taille rendrait le sélecteur épuisant.
    expect(conserverValeur2(chaussures, "42", "Noir")).toBe("Noir");
  });

  it("efface la couleur que la nouvelle taille ne propose pas", () => {
    // Garder « Blanc » en 42 afficherait une combinaison inexistante, et
    // l'ajout au panier serait refusé sans que rien ne l'ait laissé prévoir.
    expect(conserverValeur2(chaussures, "42", "Blanc")).toBe("");
  });

  it("efface aussi une couleur devenue épuisée", () => {
    const epuise = [v("1", "42", "Noir", 0), v("2", "40", "Noir", 5)];
    expect(conserverValeur2(epuise, "42", "Noir")).toBe("");
  });

  it("ne renvoie rien quand rien n'était choisi", () => {
    expect(conserverValeur2(chaussures, "40", "")).toBe("");
  });
});

describe("trouverVariante", () => {
  const variantes = [v("1", "42", "Noir", 3), v("2", "", "", 7)];

  it("retrouve une combinaison exacte", () => {
    expect(trouverVariante(variantes, { valeur1: "42", valeur2: "Noir" })?.id).toBe("1");
  });
  it("retrouve la déclinaison d'un article qui n'en a pas", () => {
    expect(trouverVariante([variantes[1]!], {})?.id).toBe("2");
  });
  it("renvoie null sur une combinaison inexistante", () => {
    expect(trouverVariante(variantes, { valeur1: "44", valeur2: "Noir" })).toBeNull();
  });
});

describe("evaluerAjoutPanier", () => {
  it("accepte dans la limite du stock", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "42", "Noir", 3), quantiteDemandee: 3 }),
    ).toBe("OK");
  });
  it("refuse au-delà du stock", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "42", "Noir", 3), quantiteDemandee: 4 }),
    ).toBe("STOCK_INSUFFISANT");
  });
  it("compte ce qui est déjà dans SON panier", () => {
    expect(
      evaluerAjoutPanier({
        variante: v("1", "42", "Noir", 3),
        quantiteDemandee: 2,
        quantiteDejaAuPanier: 2,
      }),
    ).toBe("STOCK_INSUFFISANT");
  });
  it("refuse une déclinaison retirée de la vente", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "42", "Noir", 9, false), quantiteDemandee: 1 }),
    ).toBe("INDISPONIBLE");
  });
  it("refuse un choix qui ne correspond à rien", () => {
    expect(evaluerAjoutPanier({ variante: null, quantiteDemandee: 1 })).toBe(
      "INTROUVABLE",
    );
  });
  it("refuse une quantité nulle ou négative", () => {
    expect(
      evaluerAjoutPanier({ variante: v("1", "42", "Noir", 3), quantiteDemandee: 0 }),
    ).toBe("STOCK_INSUFFISANT");
  });
});

describe("libelleVariante", () => {
  it("nomme l'axe, car une valeur seule ne se comprend pas", () => {
    // « 42 » peut être une pointure, une capacité, un tour de taille.
    expect(
      libelleVariante({ valeur1: "42", valeur2: "Noir" }, [POINTURES, COULEURS]),
    ).toBe("Pointure 42 · Couleur Noir");
  });

  it("s'adapte à la catégorie sans rien coder en dur", () => {
    expect(libelleVariante({ valeur1: "XL", valeur2: "" }, [TAILLES])).toBe("Taille XL");
  });

  it("se rabat sur la valeur seule quand l'axe est inconnu", () => {
    // Mieux vaut « 42 » qu'un préfixe inventé.
    expect(libelleVariante({ valeur1: "42", valeur2: "" })).toBe("42");
  });

  it("ne laisse pas de séparateur orphelin sans déclinaison", () => {
    expect(libelleVariante({ valeur1: "", valeur2: "" }, [TAILLES, COULEURS])).toBe("");
  });
});

describe("verifierCombinaison", () => {
  const axes = [POINTURES, COULEURS];

  it("accepte une combinaison conforme", () => {
    expect(verifierCombinaison(axes, "42", "Noir")).toBe("OK");
  });

  it("refuse une valeur absente du référentiel", () => {
    // Une liste déroulante ne protège de rien : un formulaire forgé pourrait
    // créer une chaussure « taille XXL ».
    expect(verifierCombinaison(axes, "XXL", "Noir")).toBe("VALEUR_INCONNUE");
    expect(verifierCombinaison(axes, "42", "Turquoise")).toBe("VALEUR_INCONNUE");
  });

  it("exige que tous les axes déclarés soient renseignés", () => {
    // Une déclinaison à moitié remplie entrerait en collision avec la
    // déclinaison par défaut.
    expect(verifierCombinaison(axes, "42", "")).toBe("AXE_MANQUANT");
    expect(verifierCombinaison(axes, "", "Noir")).toBe("AXE_MANQUANT");
  });

  it("refuse une valeur sur un axe que la catégorie ne déclare pas", () => {
    expect(verifierCombinaison([POINTURES], "42", "Noir")).toBe("AXE_INEXISTANT");
  });

  it("accepte le vide quand la catégorie ne déclare aucun axe", () => {
    // C'est la déclinaison par défaut d'un article non décliné.
    expect(verifierCombinaison([], "", "")).toBe("OK");
  });
});
