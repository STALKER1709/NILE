import { describe, expect, it } from "vitest";
import {
  bornesAffichage,
  entreesPagination,
} from "@/modules/catalogue/pagination";

describe("entreesPagination", () => {
  it("n'affiche rien s'il n'y a aucune page, et une seule entrée s'il n'y en a qu'une", () => {
    expect(entreesPagination(1, 0)).toEqual([]);
    expect(entreesPagination(1, 1)).toEqual([1]);
  });

  it("liste toutes les pages tant qu'il n'y a pas de trou", () => {
    expect(entreesPagination(1, 5)).toEqual([1, 2, "ellipse", 5]);
    expect(entreesPagination(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("place une ellipse de chaque côté quand la page courante est au milieu", () => {
    expect(entreesPagination(6, 12)).toEqual([1, "ellipse", 5, 6, 7, "ellipse", 12]);
  });

  it("comble un trou d'une seule page au lieu d'y mettre une ellipse", () => {
    // Sans cette règle on aurait [1, "ellipse", 3, 4, 5] alors que « 2 » tient
    // dans exactement la même largeur.
    expect(entreesPagination(4, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("borne une page courante hors limites", () => {
    expect(entreesPagination(99, 4)).toEqual(entreesPagination(4, 4));
    expect(entreesPagination(-3, 4)).toEqual(entreesPagination(1, 4));
  });

  it("respecte un nombre de voisins plus large", () => {
    expect(entreesPagination(6, 12, 2)).toEqual([1, "ellipse", 4, 5, 6, 7, 8, "ellipse", 12]);
  });
});

describe("bornesAffichage", () => {
  it("calcule les bornes d'une page pleine", () => {
    expect(bornesAffichage(1, 10, 124)).toEqual({ debut: 1, fin: 10 });
    expect(bornesAffichage(3, 10, 124)).toEqual({ debut: 21, fin: 30 });
  });

  it("tronque la dernière page incomplète", () => {
    expect(bornesAffichage(13, 10, 124)).toEqual({ debut: 121, fin: 124 });
  });

  it("renvoie 0 quand il n'y a aucun résultat", () => {
    expect(bornesAffichage(1, 10, 0)).toEqual({ debut: 0, fin: 0 });
  });
});
