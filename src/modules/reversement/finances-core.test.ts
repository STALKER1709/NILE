import { describe, expect, it } from "vitest";
import {
  etatVente,
  fusionnerTransactions,
  hauteursRelatives,
  type TransactionVendeur,
} from "@/modules/reversement/finances-core";
import {
  bornesMoisPrecedent,
  calculerVariationPourcent,
  debutDuMois,
} from "@/modules/stats/stats-core";

const vente = (id: string, iso: string): TransactionVendeur => ({
  id,
  date: new Date(iso),
  type: "VENTE",
  libelle: `Vente ${id}`,
  reference: `NILE-${id}`,
  montant: 1000,
  etat: "REGLEE",
});

const reversement = (id: string, iso: string): TransactionVendeur => ({
  id,
  date: new Date(iso),
  type: "REVERSEMENT",
  libelle: "Reversement",
  reference: id,
  montant: 500,
  etat: "VERSE",
});

describe("etatVente", () => {
  it("ne règle une vente que si la commande est livrée ET payée", () => {
    expect(etatVente("LIVREE", "PAYE")).toBe("REGLEE");
    expect(etatVente("LIVREE", "EN_ATTENTE")).toBe("EN_ATTENTE");
    expect(etatVente("EXPEDIEE", "PAYE")).toBe("EN_ATTENTE");
  });

  it("marque annulée une commande annulée ou refusée, même payée", () => {
    expect(etatVente("ANNULEE", "PAYE")).toBe("ANNULEE");
    expect(etatVente("REFUSEE", "REMBOURSE")).toBe("ANNULEE");
  });
});

describe("fusionnerTransactions", () => {
  it("trie du plus récent au plus ancien, tous types confondus", () => {
    const res = fusionnerTransactions(
      [vente("a", "2026-05-01T10:00:00Z"), vente("c", "2026-05-03T10:00:00Z")],
      [reversement("b", "2026-05-02T10:00:00Z")],
    );
    expect(res.map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("tronque à la limite demandée", () => {
    const ventes = Array.from({ length: 30 }, (_, i) =>
      vente(String(i), `2026-05-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`),
    );
    expect(fusionnerTransactions(ventes, [], 5)).toHaveLength(5);
  });

  it("accepte des listes vides", () => {
    expect(fusionnerTransactions([], [])).toEqual([]);
  });
});

describe("hauteursRelatives", () => {
  it("met la plus grande valeur à 100 et proportionne le reste", () => {
    expect(hauteursRelatives([500, 1000, 250])).toEqual([50, 100, 25]);
  });

  it("rend des barres nulles quand toute la série est à zéro", () => {
    expect(hauteursRelatives([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("gère une série vide sans planter", () => {
    expect(hauteursRelatives([])).toEqual([]);
  });
});

describe("calculerVariationPourcent", () => {
  it("calcule une hausse et une baisse", () => {
    expect(calculerVariationPourcent(112, 100)).toBe(12);
    expect(calculerVariationPourcent(80, 100)).toBe(-20);
  });

  it("renvoie null si le mois de référence est vide (pas de % sur zéro)", () => {
    expect(calculerVariationPourcent(5000, 0)).toBeNull();
  });
});

describe("bornesMoisPrecedent", () => {
  it("borne le mois précédent sans chevaucher le mois en cours", () => {
    const { debut, fin } = bornesMoisPrecedent(new Date(2026, 4, 15));
    expect(debut).toEqual(new Date(2026, 3, 1));
    expect(fin).toEqual(new Date(2026, 4, 1));
    expect(fin).toEqual(debutDuMois(new Date(2026, 4, 15)));
  });

  it("passe correctement à l'année précédente en janvier", () => {
    const { debut, fin } = bornesMoisPrecedent(new Date(2026, 0, 10));
    expect(debut).toEqual(new Date(2025, 11, 1));
    expect(fin).toEqual(new Date(2026, 0, 1));
  });
});
