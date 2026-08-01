import { describe, it, expect } from "vitest";
import {
  planifierRachat,
  messageProblemesRachat,
  type EtatProduitRachat,
  type LigneARacheter,
} from "@/modules/commande/rachat-core";

function etats(...liste: EtatProduitRachat[]): Map<string, EtatProduitRachat> {
  return new Map(liste.map((e) => [e.produitId, e]));
}

const ligne = (produitId: string, quantite: number, titreProduit = produitId): LigneARacheter => ({
  produitId,
  titreProduit,
  quantite,
});

describe("planifierRachat", () => {
  it("ajoute tout quand le stock suffit", () => {
    const plan = planifierRachat(
      [ligne("p1", 2)],
      etats({ produitId: "p1", achetable: true, stock: 10, dejaEnPanier: 0 }),
    );
    expect(plan.aAjouter).toEqual([
      { produitId: "p1", titreProduit: "p1", quantiteVoulue: 2, quantiteAjoutee: 2 },
    ]);
    expect(plan.problemes).toEqual([]);
  });

  it("signale un produit retiré du catalogue sans rien ajouter", () => {
    const plan = planifierRachat(
      [ligne("p1", 2)],
      etats({ produitId: "p1", achetable: false, stock: 10, dejaEnPanier: 0 }),
    );
    expect(plan.aAjouter).toEqual([]);
    expect(plan.problemes[0]?.motif).toBe("INDISPONIBLE");
    expect(plan.problemes[0]?.quantiteAjoutee).toBe(0);
  });

  it("signale un produit absent de la carte d'états (supprimé)", () => {
    const plan = planifierRachat([ligne("inconnu", 1)], etats());
    expect(plan.aAjouter).toEqual([]);
    expect(plan.problemes[0]?.motif).toBe("INDISPONIBLE");
  });

  it("signale une rupture de stock", () => {
    const plan = planifierRachat(
      [ligne("p1", 2)],
      etats({ produitId: "p1", achetable: true, stock: 0, dejaEnPanier: 0 }),
    );
    expect(plan.aAjouter).toEqual([]);
    expect(plan.problemes[0]?.motif).toBe("RUPTURE");
  });

  it("ajoute partiellement et le signale quand le stock est insuffisant", () => {
    const plan = planifierRachat(
      [ligne("p1", 5)],
      etats({ produitId: "p1", achetable: true, stock: 3, dejaEnPanier: 0 }),
    );
    expect(plan.aAjouter[0]?.quantiteAjoutee).toBe(3);
    expect(plan.problemes[0]?.motif).toBe("PARTIEL");
    expect(plan.problemes[0]?.quantiteVoulue).toBe(5);
  });

  it("tient compte de ce qui est DÉJÀ dans le panier", () => {
    // Stock 4, déjà 3 en panier -> une seule unité ajoutable sur les 2 voulues.
    const plan = planifierRachat(
      [ligne("p1", 2)],
      etats({ produitId: "p1", achetable: true, stock: 4, dejaEnPanier: 3 }),
    );
    expect(plan.aAjouter[0]?.quantiteAjoutee).toBe(1);
    expect(plan.problemes[0]?.motif).toBe("PARTIEL");
  });

  it("traite en rupture un produit dont le panier occupe déjà tout le stock", () => {
    const plan = planifierRachat(
      [ligne("p1", 2)],
      etats({ produitId: "p1", achetable: true, stock: 3, dejaEnPanier: 3 }),
    );
    expect(plan.aAjouter).toEqual([]);
    expect(plan.problemes[0]?.motif).toBe("RUPTURE");
  });

  it("ne devient jamais négatif si le panier dépasse le stock", () => {
    const plan = planifierRachat(
      [ligne("p1", 1)],
      etats({ produitId: "p1", achetable: true, stock: 2, dejaEnPanier: 5 }),
    );
    expect(plan.aAjouter).toEqual([]);
    expect(plan.problemes[0]?.motif).toBe("RUPTURE");
  });

  it("traite plusieurs lignes indépendamment", () => {
    const plan = planifierRachat(
      [ligne("ok", 2), ligne("retire", 1), ligne("partiel", 5)],
      etats(
        { produitId: "ok", achetable: true, stock: 10, dejaEnPanier: 0 },
        { produitId: "retire", achetable: false, stock: 0, dejaEnPanier: 0 },
        { produitId: "partiel", achetable: true, stock: 2, dejaEnPanier: 0 },
      ),
    );
    expect(plan.aAjouter.map((l) => l.produitId)).toEqual(["ok", "partiel"]);
    expect(plan.problemes.map((l) => l.motif)).toEqual(["INDISPONIBLE", "PARTIEL"]);
  });

  it("renvoie un plan vide pour une commande sans ligne", () => {
    expect(planifierRachat([], etats())).toEqual({ aAjouter: [], problemes: [] });
  });
});

describe("messageProblemesRachat", () => {
  it("ne dit rien quand tout va bien", () => {
    expect(messageProblemesRachat([])).toBeNull();
  });

  it("décrit chaque motif de façon lisible", () => {
    const message = messageProblemesRachat([
      { produitId: "a", titreProduit: "Savon", quantiteVoulue: 5, quantiteAjoutee: 2, motif: "PARTIEL" },
      { produitId: "b", titreProduit: "Riz", quantiteVoulue: 1, quantiteAjoutee: 0, motif: "RUPTURE" },
      { produitId: "c", titreProduit: "Huile", quantiteVoulue: 1, quantiteAjoutee: 0, motif: "INDISPONIBLE" },
    ]);
    expect(message).toContain("Savon (2 sur 5 seulement)");
    expect(message).toContain("Riz (en rupture)");
    expect(message).toContain("Huile (retiré de la vente)");
  });
});
