import { describe, it, expect } from "vitest";
import {
  calculerSign,
  verifierSign,
  mapperStatutMonetbil,
} from "@/modules/paiement/notification-core";

describe("calculerSign (algorithme Monetbil)", () => {
  it("est déterministe et indépendant de l'ordre des clés", () => {
    const a = calculerSign("secret", { b: "2", a: "1" });
    const b = calculerSign("secret", { a: "1", b: "2" });
    expect(a).toBe(b);
  });
  it("change si le secret change", () => {
    expect(calculerSign("s1", { a: "1" })).not.toBe(calculerSign("s2", { a: "1" }));
  });
});

describe("verifierSign", () => {
  const secret = "secret";
  it("accepte une signature valide", () => {
    const corps: Record<string, string> = { payment_ref: "p1", status: "1" };
    corps.sign = calculerSign(secret, corps);
    expect(verifierSign(secret, corps)).toBe(true);
  });
  it("refuse une signature absente ou falsifiée", () => {
    expect(verifierSign(secret, { payment_ref: "p1" })).toBe(false);
    expect(
      verifierSign(secret, { payment_ref: "p1", status: "1", sign: "faux" }),
    ).toBe(false);
  });
  it("refuse si un champ a été modifié après signature", () => {
    const corps: Record<string, string> = { payment_ref: "p1", status: "0" };
    corps.sign = calculerSign(secret, corps);
    corps.status = "1"; // falsification
    expect(verifierSign(secret, corps)).toBe(false);
  });
});

describe("mapperStatutMonetbil", () => {
  it("1 et 7 (testmode) -> PAYE", () => {
    expect(mapperStatutMonetbil(1)).toBe("PAYE");
    expect(mapperStatutMonetbil(7)).toBe("PAYE");
  });
  it("0, -1, 8, 9 -> ECHOUE", () => {
    expect(mapperStatutMonetbil(0)).toBe("ECHOUE");
    expect(mapperStatutMonetbil(-1)).toBe("ECHOUE");
    expect(mapperStatutMonetbil(8)).toBe("ECHOUE");
    expect(mapperStatutMonetbil(9)).toBe("ECHOUE");
  });
});
