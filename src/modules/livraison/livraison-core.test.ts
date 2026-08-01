import { describe, it, expect } from "vitest";
import {
  peutAffecterTransporteur,
  peutExpedier,
  peutLivrer,
  peutRefuser,
  peutConfirmerReception,
  doitRappelerConfirmation,
  seuilRappelConfirmation,
  DELAI_RAPPEL_CONFIRMATION_MINUTES,
} from "@/modules/livraison/livraison-core";

describe("transitions de livraison", () => {
  it("affectation possible seulement depuis CONFIRMEE", () => {
    expect(peutAffecterTransporteur("CONFIRMEE")).toBe(true);
    expect(peutAffecterTransporteur("EN_ATTENTE")).toBe(false);
    expect(peutAffecterTransporteur("EXPEDIEE")).toBe(false);
  });
  it("expédition possible seulement depuis EN_PREPARATION", () => {
    expect(peutExpedier("EN_PREPARATION")).toBe(true);
    expect(peutExpedier("CONFIRMEE")).toBe(false);
  });
  it("livraison possible seulement depuis EXPEDIEE", () => {
    expect(peutLivrer("EXPEDIEE")).toBe(true);
    expect(peutLivrer("EN_PREPARATION")).toBe(false);
    expect(peutLivrer("LIVREE")).toBe(false);
  });
  it("refus possible depuis EN_PREPARATION ou EXPEDIEE", () => {
    expect(peutRefuser("EN_PREPARATION")).toBe(true);
    expect(peutRefuser("EXPEDIEE")).toBe(true);
    expect(peutRefuser("CONFIRMEE")).toBe(false);
    expect(peutRefuser("LIVREE")).toBe(false);
  });
});

describe("peutConfirmerReception", () => {
  it("possible sur une commande LIVREE pas encore confirmée", () => {
    expect(peutConfirmerReception("LIVREE", null)).toBe(true);
  });
  it("impossible avant que le livreur ait marqué LIVREE", () => {
    expect(peutConfirmerReception("EXPEDIEE", null)).toBe(false);
    expect(peutConfirmerReception("EN_PREPARATION", null)).toBe(false);
  });
  it("impossible deux fois (idempotence côté métier)", () => {
    expect(peutConfirmerReception("LIVREE", new Date())).toBe(false);
  });
});

describe("doitRappelerConfirmation", () => {
  const livraison = new Date("2026-08-01T10:00:00Z");
  const base = {
    dateLivraison: livraison,
    confirmationAcheteur: null,
    rappelConfirmationEnvoye: false,
  };
  // 30 minutes après la livraison déclarée.
  const echeance = new Date(
    livraison.getTime() + DELAI_RAPPEL_CONFIRMATION_MINUTES * 60 * 1000,
  );

  it("rappelle une fois le délai écoulé", () => {
    expect(doitRappelerConfirmation(base, echeance)).toBe(true);
  });
  it("ne rappelle pas avant le délai", () => {
    expect(doitRappelerConfirmation(base, new Date(echeance.getTime() - 1000))).toBe(false);
  });
  it("ne rappelle pas si l'acheteur a déjà confirmé", () => {
    expect(
      doitRappelerConfirmation({ ...base, confirmationAcheteur: new Date() }, echeance),
    ).toBe(false);
  });
  it("ne rappelle jamais deux fois", () => {
    expect(
      doitRappelerConfirmation({ ...base, rappelConfirmationEnvoye: true }, echeance),
    ).toBe(false);
  });
  it("ne rappelle pas sans date de livraison", () => {
    expect(doitRappelerConfirmation({ ...base, dateLivraison: null }, echeance)).toBe(false);
  });
});

describe("seuilRappelConfirmation", () => {
  it("recule de 30 minutes", () => {
    const seuil = seuilRappelConfirmation(new Date("2026-08-01T10:30:00Z"));
    expect(seuil.toISOString()).toBe("2026-08-01T10:00:00.000Z");
  });
});
