import { describe, it, expect } from "vitest";
import { serieParJour, debutDuMois } from "@/modules/stats/stats-core";

describe("serieParJour", () => {
  const maintenant = new Date(2026, 6, 11, 15, 0); // samedi 11 juillet 2026

  it("produit une série complète avec jours vides à zéro", () => {
    const serie = serieParJour([], 7, maintenant);
    expect(serie).toHaveLength(7);
    expect(serie.every((p) => p.valeur === 0)).toBe(true);
    expect(serie[6]?.label).toBe("sam"); // aujourd'hui en dernier
    expect(serie[0]?.label).toBe("dim"); // il y a 6 jours
  });

  it("agrège les valeurs du même jour et ignore hors fenêtre", () => {
    const serie = serieParJour(
      [
        { date: new Date(2026, 6, 11, 9, 0), valeur: 100 },
        { date: new Date(2026, 6, 11, 18, 0), valeur: 50 },
        { date: new Date(2026, 6, 9, 12, 0), valeur: 30 },
        { date: new Date(2026, 5, 1), valeur: 999 }, // hors fenêtre
      ],
      7,
      maintenant,
    );
    expect(serie[6]?.valeur).toBe(150); // aujourd'hui
    expect(serie[4]?.valeur).toBe(30); // avant-hier
    expect(serie.reduce((s, p) => s + p.valeur, 0)).toBe(180);
  });
});

describe("debutDuMois", () => {
  it("renvoie le 1er du mois à minuit", () => {
    const d = debutDuMois(new Date(2026, 6, 11, 15, 30));
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(6);
    expect(d.getHours()).toBe(0);
  });
});
