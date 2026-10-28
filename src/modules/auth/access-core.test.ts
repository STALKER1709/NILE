import { describe, it, expect } from "vitest";
import { evaluerAcces } from "@/modules/auth/access-core";

describe("evaluerAcces (autorisation par rôle)", () => {
  it("refuse un visiteur non connecté", () => {
    expect(evaluerAcces(null, ["ACHETEUR"])).toBe("NON_AUTHENTIFIE");
  });

  it("autorise le bon rôle", () => {
    expect(
      evaluerAcces({ role: "VENDEUR", statut: "ACTIF" }, ["VENDEUR"]),
    ).toBe("OK");
  });

  it("refuse un rôle non autorisé", () => {
    expect(
      evaluerAcces({ role: "ACHETEUR", statut: "ACTIF" }, ["ADMIN"]),
    ).toBe("INTERDIT");
  });

  it("bloque un compte suspendu même avec le bon rôle", () => {
    expect(
      evaluerAcces({ role: "ADMIN", statut: "SUSPENDU" }, ["ADMIN"]),
    ).toBe("SUSPENDU");
  });

  it("bloque un vendeur suspendu lors d'une action réservée aux vendeurs", () => {
    expect(
      evaluerAcces({ role: "VENDEUR", statut: "SUSPENDU" }, ["VENDEUR"]),
    ).toBe("SUSPENDU");
  });

  it("bloque un acheteur suspendu lors d'une action de mutation générale", () => {
    expect(
      evaluerAcces(
        { role: "ACHETEUR", statut: "SUSPENDU" },
        ["ACHETEUR", "VENDEUR", "ADMIN"],
      ),
    ).toBe("SUSPENDU");
  });

  it("autorise si le rôle figure parmi plusieurs rôles permis", () => {
    expect(
      evaluerAcces({ role: "ADMIN", statut: "ACTIF" }, [
        "ACHETEUR",
        "VENDEUR",
        "ADMIN",
      ]),
    ).toBe("OK");
  });

  it("refuse quand aucun rôle n'est autorisé (liste vide)", () => {
    expect(evaluerAcces({ role: "ADMIN", statut: "ACTIF" }, [])).toBe(
      "INTERDIT",
    );
  });
});
