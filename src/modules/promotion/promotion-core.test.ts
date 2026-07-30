import { describe, it, expect } from "vitest";
import {
  estPromotionActive,
  calculerPrixPromotionnel,
  validerPromotion,
  periodesChevauchent,
  promotionChevaucheExistantes,
  resoudreAffichagePrix,
  type PromotionActive,
} from "@/modules/promotion/promotion-core";

const J = (n: number) => new Date(`2026-07-${String(n).padStart(2, "0")}T00:00:00Z`);

function promo(overrides: Partial<PromotionActive> = {}): PromotionActive {
  return {
    id: "p1",
    produitId: null,
    type: "POURCENTAGE",
    valeur: 20,
    dateDebut: J(1),
    dateFin: J(10),
    annulee: false,
    ...overrides,
  };
}

describe("estPromotionActive", () => {
  it("active dans la période, non annulée", () => {
    expect(estPromotionActive(promo(), J(5))).toBe(true);
  });
  it("inactive avant la date de début", () => {
    expect(estPromotionActive(promo(), J(0))).toBe(false);
  });
  it("inactive après la date de fin", () => {
    expect(estPromotionActive(promo(), J(11))).toBe(false);
  });
  it("inactive si annulée, même dans la période", () => {
    expect(estPromotionActive(promo({ annulee: true }), J(5))).toBe(false);
  });
  it("bornes incluses", () => {
    expect(estPromotionActive(promo(), J(1))).toBe(true);
    expect(estPromotionActive(promo(), J(10))).toBe(true);
  });
});

describe("calculerPrixPromotionnel", () => {
  it("pourcentage : arrondit la réduction", () => {
    expect(calculerPrixPromotionnel(1000, "POURCENTAGE", 20)).toBe(800);
    expect(calculerPrixPromotionnel(999, "POURCENTAGE", 10)).toBe(899); // 99,9 -> 100
  });
  it("montant : déduit directement", () => {
    expect(calculerPrixPromotionnel(1000, "MONTANT", 300)).toBe(700);
  });
  it("plancher à 1 FCFA, jamais gratuit ni négatif", () => {
    expect(calculerPrixPromotionnel(500, "MONTANT", 500)).toBe(1);
    expect(calculerPrixPromotionnel(500, "MONTANT", 9000)).toBe(1);
    expect(calculerPrixPromotionnel(100, "POURCENTAGE", 90)).toBe(10);
  });
});

describe("validerPromotion", () => {
  const base = { dateDebut: J(5), dateFin: J(10), maintenant: J(1) };

  it("accepte un pourcentage dans les bornes", () => {
    expect(validerPromotion({ ...base, type: "POURCENTAGE", valeur: 50 })).toEqual({ ok: true });
  });
  it("rejette un pourcentage hors bornes", () => {
    expect(validerPromotion({ ...base, type: "POURCENTAGE", valeur: 0 }).ok).toBe(false);
    expect(validerPromotion({ ...base, type: "POURCENTAGE", valeur: 91 }).ok).toBe(false);
  });
  it("rejette une valeur non entière ou négative", () => {
    expect(validerPromotion({ ...base, type: "MONTANT", valeur: -5 }).ok).toBe(false);
    expect(validerPromotion({ ...base, type: "MONTANT", valeur: 1.5 }).ok).toBe(false);
  });
  it("rejette une période inversée ou déjà terminée", () => {
    expect(
      validerPromotion({ ...base, type: "MONTANT", valeur: 100, dateDebut: J(10), dateFin: J(5) })
        .ok,
    ).toBe(false);
    expect(
      validerPromotion({ ...base, type: "MONTANT", valeur: 100, maintenant: J(20) }).ok,
    ).toBe(false);
  });
  it("rejette un montant supérieur ou égal au prix du produit", () => {
    const res = validerPromotion({ ...base, type: "MONTANT", valeur: 1000, prixReference: 1000 });
    expect(res).toEqual({ ok: false, code: "PRIX_INSUFFISANT" });
  });
  it("accepte un montant strictement inférieur au prix", () => {
    expect(
      validerPromotion({ ...base, type: "MONTANT", valeur: 999, prixReference: 1000 }),
    ).toEqual({ ok: true });
  });
});

describe("periodesChevauchent / promotionChevaucheExistantes", () => {
  it("détecte un chevauchement partiel", () => {
    expect(periodesChevauchent(J(1), J(10), J(5), J(15))).toBe(true);
  });
  it("détecte une période incluse dans une autre", () => {
    expect(periodesChevauchent(J(1), J(20), J(5), J(10))).toBe(true);
  });
  it("ne détecte pas deux périodes disjointes", () => {
    expect(periodesChevauchent(J(1), J(5), J(6), J(10))).toBe(false);
  });
  it("bornes qui se touchent = chevauchement", () => {
    expect(periodesChevauchent(J(1), J(5), J(5), J(10))).toBe(true);
  });
  it("promotionChevaucheExistantes agrège sur la liste", () => {
    const existantes = [{ dateDebut: J(1), dateFin: J(5) }, { dateDebut: J(20), dateFin: J(25) }];
    expect(promotionChevaucheExistantes({ dateDebut: J(3), dateFin: J(8) }, existantes)).toBe(
      true,
    );
    expect(promotionChevaucheExistantes({ dateDebut: J(10), dateFin: J(15) }, existantes)).toBe(
      false,
    );
  });
});

describe("resoudreAffichagePrix", () => {
  it("aucune promotion active -> prix original seul", () => {
    const res = resoudreAffichagePrix(1000, null, null, J(5));
    expect(res).toEqual({
      prixOriginal: 1000,
      prixPromo: null,
      pourcentageReduction: null,
      promotionId: null,
    });
  });
  it("applique la promotion boutique quand seule active", () => {
    const res = resoudreAffichagePrix(1000, null, promo({ id: "boutique", valeur: 10 }), J(5));
    expect(res.prixPromo).toBe(900);
    expect(res.pourcentageReduction).toBe(10);
    expect(res.promotionId).toBe("boutique");
  });
  it("la promotion PRODUIT l'emporte sur la promotion BOUTIQUE", () => {
    const produitPromo = promo({ id: "produit", produitId: "prod1", valeur: 50 });
    const boutiquePromo = promo({ id: "boutique", valeur: 10 });
    const res = resoudreAffichagePrix(1000, produitPromo, boutiquePromo, J(5));
    expect(res.promotionId).toBe("produit");
    expect(res.prixPromo).toBe(500);
  });
  it("ignore une promotion produit expirée et retombe sur la boutique", () => {
    const produitPromo = promo({ id: "produit", produitId: "prod1", valeur: 50, dateFin: J(2) });
    const boutiquePromo = promo({ id: "boutique", valeur: 10 });
    const res = resoudreAffichagePrix(1000, produitPromo, boutiquePromo, J(5));
    expect(res.promotionId).toBe("boutique");
  });
  it("ignore une promotion annulée", () => {
    const res = resoudreAffichagePrix(1000, promo({ annulee: true }), null, J(5));
    expect(res.prixPromo).toBeNull();
  });
});
