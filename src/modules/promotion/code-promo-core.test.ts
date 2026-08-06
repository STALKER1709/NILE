import { describe, it, expect } from "vitest";
import {
  normaliserCode,
  calculerRemise,
  evaluerCodePromo,
  type EtatCodePromo,
} from "@/modules/promotion/code-promo-core";

describe("normaliserCode", () => {
  it("met en majuscules et retire les séparateurs", () => {
    expect(normaliserCode("bienvenue 10")).toBe("BIENVENUE10");
    expect(normaliserCode("Bienvenue-10")).toBe("BIENVENUE10");
    expect(normaliserCode("bienvenue_10")).toBe("BIENVENUE10");
  });
  it("laisse un code déjà normalisé inchangé", () => {
    expect(normaliserCode("BIENVENUE10")).toBe("BIENVENUE10");
  });
});

describe("calculerRemise", () => {
  it("applique un pourcentage et arrondit au FCFA", () => {
    expect(calculerRemise({ type: "POURCENTAGE", valeur: 10, totalPanier: 10000 })).toBe(1000);
    expect(calculerRemise({ type: "POURCENTAGE", valeur: 10, totalPanier: 1005 })).toBe(101);
  });

  it("applique un montant fixe", () => {
    expect(calculerRemise({ type: "MONTANT", valeur: 2000, totalPanier: 10000 })).toBe(2000);
  });

  it("respecte le plafond sur un pourcentage", () => {
    // Sans plafond, -20 % sur 500 000 coûterait 100 000 à la plateforme.
    expect(
      calculerRemise({
        type: "POURCENTAGE",
        valeur: 20,
        plafondRemise: 5000,
        totalPanier: 500000,
      }),
    ).toBe(5000);
  });

  it("ne plafonne pas un montant fixe", () => {
    // Le plafond n'a de sens que sur un pourcentage : un montant fixe est déjà
    // sa propre borne.
    expect(
      calculerRemise({
        type: "MONTANT",
        valeur: 3000,
        plafondRemise: 1000,
        totalPanier: 10000,
      }),
    ).toBe(3000);
  });

  it("ne dépasse jamais le panier", () => {
    // Un total négatif se propagerait jusqu'au montant envoyé à l'agrégateur.
    expect(calculerRemise({ type: "MONTANT", valeur: 50000, totalPanier: 3000 })).toBe(3000);
    expect(calculerRemise({ type: "POURCENTAGE", valeur: 100, totalPanier: 3000 })).toBe(3000);
  });

  it("ne remise rien sur un panier vide ou une valeur nulle", () => {
    expect(calculerRemise({ type: "MONTANT", valeur: 2000, totalPanier: 0 })).toBe(0);
    expect(calculerRemise({ type: "POURCENTAGE", valeur: 0, totalPanier: 10000 })).toBe(0);
  });
});

describe("evaluerCodePromo", () => {
  const maintenant = new Date("2026-08-06T12:00:00Z");
  const valide: EtatCodePromo = {
    actif: true,
    dateDebut: new Date("2026-08-01T00:00:00Z"),
    dateFin: new Date("2026-08-31T23:59:59Z"),
    quotaTotal: 100,
    nbUtilisations: 10,
    minPanier: 5000,
    dejaUtiliseParAcheteur: false,
  };
  const base = { totalPanier: 10000, modePaiement: "MONETBIL", maintenant };

  it("accepte un code valide", () => {
    expect(evaluerCodePromo({ ...base, etat: valide })).toBe("OK");
  });

  it("traite un code désactivé comme inexistant", () => {
    // Distinguer les deux permettrait de deviner quels codes existent en les
    // essayant au hasard.
    expect(evaluerCodePromo({ ...base, etat: { ...valide, actif: false } })).toBe(
      "INTROUVABLE",
    );
  });

  it("refuse hors de la fenêtre de validité", () => {
    expect(
      evaluerCodePromo({
        ...base,
        etat: { ...valide, dateFin: new Date("2026-08-05T00:00:00Z") },
      }),
    ).toBe("EXPIRE");
    expect(
      evaluerCodePromo({
        ...base,
        etat: { ...valide, dateDebut: new Date("2026-08-10T00:00:00Z") },
      }),
    ).toBe("PAS_ENCORE_ACTIF");
  });

  it("refuse quand le quota global est épuisé", () => {
    expect(
      evaluerCodePromo({ ...base, etat: { ...valide, nbUtilisations: 100 } }),
    ).toBe("QUOTA_ATTEINT");
  });

  it("ignore le quota quand il est illimité", () => {
    expect(
      evaluerCodePromo({
        ...base,
        etat: { ...valide, quotaTotal: null, nbUtilisations: 99999 },
      }),
    ).toBe("OK");
  });

  it("refuse un second usage par le même acheteur", () => {
    expect(
      evaluerCodePromo({ ...base, etat: { ...valide, dejaUtiliseParAcheteur: true } }),
    ).toBe("DEJA_UTILISE");
  });

  it("refuse le paiement à la livraison", () => {
    // NILE n'encaisse rien sur une vente en espèces : elle n'a rien à remiser.
    expect(evaluerCodePromo({ ...base, etat: valide, modePaiement: "COD" })).toBe(
      "MODE_PAIEMENT",
    );
  });

  it("refuse un panier sous le minimum exigé", () => {
    expect(evaluerCodePromo({ ...base, etat: valide, totalPanier: 4999 })).toBe(
      "PANIER_INSUFFISANT",
    );
  });

  it("accepte un panier exactement au minimum", () => {
    expect(evaluerCodePromo({ ...base, etat: valide, totalPanier: 5000 })).toBe("OK");
  });

  it("annonce d'abord ce que l'acheteur ne peut pas corriger", () => {
    // Code expiré ET panier trop faible : lui demander de compléter son panier
    // pour rien serait une fausse piste.
    expect(
      evaluerCodePromo({
        ...base,
        totalPanier: 100,
        etat: { ...valide, dateFin: new Date("2026-08-05T00:00:00Z") },
      }),
    ).toBe("EXPIRE");
  });
});
