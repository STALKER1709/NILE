import { describe, it, expect } from "vitest";
import {
  etatBalayage,
  messageBalayage,
  SILENCE_ALERTE_MS,
} from "@/modules/paiement/battement-core";

const MAINTENANT = new Date("2026-08-08T12:00:00Z");
const ilYA = (ms: number) => ({ date: new Date(MAINTENANT.getTime() - ms) });

describe("etatBalayage", () => {
  it("reconnaît un balayage qui vient de tourner", () => {
    expect(etatBalayage(ilYA(60_000), MAINTENANT)).toBe("ACTIF");
  });

  it("tolère quelques exécutions décalées", () => {
    // Planifié toutes les 5 min, GitHub Actions décale volontiers : un retard
    // n'est pas une panne, et une alerte qui crie pour rien n'est plus lue.
    expect(etatBalayage(ilYA(20 * 60_000), MAINTENANT)).toBe("ACTIF");
  });

  it("alerte au-delà du seuil de silence", () => {
    expect(etatBalayage(ilYA(SILENCE_ALERTE_MS + 1000), MAINTENANT)).toBe("MUET");
  });

  it("distingue « jamais tourné » de « tombé en panne »", () => {
    // Les deux appellent des vérifications différentes : un secret jamais posé
    // n'est pas un workflow qui s'est arrêté.
    expect(etatBalayage(null, MAINTENANT)).toBe("JAMAIS");
  });
});

describe("messageBalayage", () => {
  it("dit ce qui est en jeu, pas seulement qu'il y a un problème", () => {
    // Un administrateur doit comprendre la conséquence : une commande payée
    // reste figée, argent encaissé.
    expect(messageBalayage("MUET")).toMatch(/argent encaissé/);
    expect(messageBalayage("JAMAIS")).toMatch(/CRON_SECRET/);
  });

  it("reste sobre quand tout va bien", () => {
    expect(messageBalayage("ACTIF")).toMatch(/normalement/);
  });
});
