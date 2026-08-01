import { describe, it, expect } from "vitest";
import {
  genererSecretReception,
  genererCodeReception,
  verifierCodeReception,
  fenetreCourante,
  secondesRestantes,
  contenuQr,
  analyserContenuQr,
  PERIODE_CODE_SECONDES,
  LONGUEUR_CODE,
} from "@/modules/livraison/reception-core";

const secret = "a".repeat(64);
const T0 = new Date("2026-08-01T12:00:00Z");
/** Décale d'un nombre de secondes. */
const a = (secondes: number) => new Date(T0.getTime() + secondes * 1000);

describe("genererSecretReception", () => {
  it("produit un secret long et différent à chaque appel", () => {
    const s1 = genererSecretReception();
    const s2 = genererSecretReception();
    expect(s1).toHaveLength(64);
    expect(s1).not.toBe(s2);
  });
});

describe("genererCodeReception", () => {
  it("produit toujours 6 chiffres", () => {
    for (let i = 0; i < 200; i++) {
      const code = genererCodeReception(genererSecretReception(), a(i * 37));
      expect(code).toMatch(new RegExp(`^\\d{${LONGUEUR_CODE}}$`));
    }
  });

  it("est stable à l'intérieur d'une même fenêtre", () => {
    const debut = new Date("2026-08-01T12:00:00Z"); // début de fenêtre
    expect(genererCodeReception(secret, debut)).toBe(
      genererCodeReception(secret, new Date(debut.getTime() + 29_000)),
    );
  });

  it("change d'une fenêtre à l'autre", () => {
    const code1 = genererCodeReception(secret, T0);
    const code2 = genererCodeReception(secret, a(PERIODE_CODE_SECONDES));
    expect(code1).not.toBe(code2);
  });

  it("diffère d'un secret à l'autre au même instant", () => {
    expect(genererCodeReception("a".repeat(64), T0)).not.toBe(
      genererCodeReception("b".repeat(64), T0),
    );
  });
});

describe("verifierCodeReception", () => {
  it("accepte le code de la fenêtre courante", () => {
    const code = genererCodeReception(secret, T0);
    expect(verifierCodeReception(secret, code, T0)).toBe(true);
  });

  it("accepte encore le code de la fenêtre précédente (latence du scan)", () => {
    const code = genererCodeReception(secret, T0);
    expect(verifierCodeReception(secret, code, a(PERIODE_CODE_SECONDES))).toBe(true);
  });

  it("REFUSE un code périmé de deux fenêtres — capture d'écran inexploitable", () => {
    const code = genererCodeReception(secret, T0);
    expect(verifierCodeReception(secret, code, a(PERIODE_CODE_SECONDES * 2 + 1))).toBe(false);
  });

  it("refuse un code venant d'un autre secret (autre commande)", () => {
    const codeAutre = genererCodeReception("b".repeat(64), T0);
    expect(verifierCodeReception(secret, codeAutre, T0)).toBe(false);
  });

  it("refuse un code mal formé", () => {
    expect(verifierCodeReception(secret, "", T0)).toBe(false);
    expect(verifierCodeReception(secret, "12345", T0)).toBe(false);
    expect(verifierCodeReception(secret, "1234567", T0)).toBe(false);
    expect(verifierCodeReception(secret, "abcdef", T0)).toBe(false);
  });

  it("tolère les espaces et tirets de saisie manuelle", () => {
    const code = genererCodeReception(secret, T0);
    const espace = `${code.slice(0, 3)} ${code.slice(3)}`;
    const tiret = `${code.slice(0, 3)}-${code.slice(3)}`;
    expect(verifierCodeReception(secret, espace, T0)).toBe(true);
    expect(verifierCodeReception(secret, tiret, T0)).toBe(true);
  });

  it("refuse un code futur (horloge du livreur en avance de plusieurs minutes)", () => {
    const codeFutur = genererCodeReception(secret, a(300));
    expect(verifierCodeReception(secret, codeFutur, T0)).toBe(false);
  });
});

describe("fenetreCourante / secondesRestantes", () => {
  it("la fenêtre avance d'une unité par période", () => {
    expect(fenetreCourante(a(PERIODE_CODE_SECONDES)) - fenetreCourante(T0)).toBe(1);
  });
  it("le décompte reste dans les bornes", () => {
    for (let s = 0; s < 120; s++) {
      const restant = secondesRestantes(a(s));
      expect(restant).toBeGreaterThan(0);
      expect(restant).toBeLessThanOrEqual(PERIODE_CODE_SECONDES);
    }
  });
});

describe("contenuQr / analyserContenuQr", () => {
  it("fait l'aller-retour", () => {
    const contenu = contenuQr("NILE-2026-ABCD", "123456");
    expect(analyserContenuQr(contenu)).toEqual({
      numeroCommande: "NILE-2026-ABCD",
      code: "123456",
    });
  });

  it("tolère les espaces autour", () => {
    expect(analyserContenuQr("  NILE:NILE-2026-ABCD:123456  ")).not.toBeNull();
  });

  it("rejette un QR étranger", () => {
    expect(analyserContenuQr("https://exemple.cm")).toBeNull();
    expect(analyserContenuQr("AUTRE:NILE-2026-ABCD:123456")).toBeNull();
    expect(analyserContenuQr("")).toBeNull();
  });

  it("rejette un code mal formé dans le QR", () => {
    expect(analyserContenuQr("NILE:NILE-2026-ABCD:12345")).toBeNull();
    expect(analyserContenuQr("NILE:NILE-2026-ABCD:abcdef")).toBeNull();
  });

  it("rejette un numéro de commande vide", () => {
    expect(analyserContenuQr("NILE::123456")).toBeNull();
  });
});
