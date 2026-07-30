import { describe, expect, it } from "vitest";
import {
  VILLES_CAMEROUN,
  VILLE_AUTRE,
  estVilleConnue,
  listerVilles,
  resoudreVille,
} from "@/modules/commande/villes";

describe("VILLES_CAMEROUN", () => {
  it("couvre les dix régions du Cameroun", () => {
    expect(VILLES_CAMEROUN).toHaveLength(10);
  });

  it("ne contient aucun doublon de ville", () => {
    const villes = listerVilles();
    expect(new Set(villes).size).toBe(villes.length);
  });

  it("propose au moins une ville par région", () => {
    for (const r of VILLES_CAMEROUN) {
      expect(r.villes.length, r.region).toBeGreaterThan(0);
    }
  });

  it("contient les deux plus grandes villes du pays", () => {
    expect(estVilleConnue("Douala")).toBe(true);
    expect(estVilleConnue("Yaoundé")).toBe(true);
  });

  it("ne reconnaît pas une ville absente de la liste", () => {
    expect(estVilleConnue("Tombouctou")).toBe(false);
  });
});

describe("resoudreVille", () => {
  it("retient la ville choisie dans la liste", () => {
    expect(resoudreVille("Douala", "")).toBe("Douala");
  });

  it("retient le champ libre quand « Autre ville » est choisi", () => {
    expect(resoudreVille(VILLE_AUTRE, "  Mbouda-Village ")).toBe("Mbouda-Village");
  });

  it("ignore le champ libre si une ville de la liste est choisie", () => {
    expect(resoudreVille("Kribi", "Autre chose")).toBe("Kribi");
  });

  it("renvoie une chaîne vide si rien n'est utilisable (rejeté ensuite par la validation)", () => {
    expect(resoudreVille(VILLE_AUTRE, "   ")).toBe("");
    expect(resoudreVille(null, null)).toBe("");
    expect(resoudreVille("", undefined)).toBe("");
  });
});
