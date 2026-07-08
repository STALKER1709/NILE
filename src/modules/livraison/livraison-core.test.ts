import { describe, it, expect } from "vitest";
import {
  peutAffecterTransporteur,
  peutExpedier,
  peutLivrer,
  peutRefuser,
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
