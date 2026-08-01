import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  normaliserTelephoneCM,
  verifierSignatureWebhook,
  calculerFinFenetreService,
  fenetreServiceOuverte,
  construireTexteStatut,
  extraireExpediteurs,
} from "@/modules/whatsapp/whatsapp-core";

describe("normaliserTelephoneCM", () => {
  it("accepte un numéro local à 9 chiffres", () => {
    expect(normaliserTelephoneCM("670000000")).toBe("237670000000");
  });
  it("accepte un numéro déjà préfixé 237", () => {
    expect(normaliserTelephoneCM("237670000000")).toBe("237670000000");
  });
  it("tolère les espaces et le +", () => {
    expect(normaliserTelephoneCM("+237 670 000 000")).toBe("237670000000");
  });
  it("accepte les préfixes 2 et 6 (mobile CM)", () => {
    expect(normaliserTelephoneCM("270000000")).toBe("237270000000");
  });
  it("rejette un numéro trop court", () => {
    expect(normaliserTelephoneCM("12345")).toBeNull();
  });
  it("rejette un préfixe non camerounais", () => {
    expect(normaliserTelephoneCM("912345678")).toBeNull();
  });
});

describe("verifierSignatureWebhook", () => {
  const secret = "app-secret-test";
  const corps = '{"object":"whatsapp_business_account"}';
  const bonneSignature = `sha256=${createHmac("sha256", secret).update(corps).digest("hex")}`;

  it("accepte une signature valide", () => {
    expect(verifierSignatureWebhook(secret, corps, bonneSignature)).toBe(true);
  });
  it("rejette une signature invalide", () => {
    expect(verifierSignatureWebhook(secret, corps, "sha256=deadbeef")).toBe(false);
  });
  it("rejette un en-tête absent", () => {
    expect(verifierSignatureWebhook(secret, corps, null)).toBe(false);
  });
  it("rejette un en-tête sans préfixe sha256=", () => {
    expect(verifierSignatureWebhook(secret, corps, "abcdef")).toBe(false);
  });
  it("rejette un corps modifié", () => {
    expect(verifierSignatureWebhook(secret, corps + "x", bonneSignature)).toBe(false);
  });
  it("rejette un mauvais secret", () => {
    expect(verifierSignatureWebhook("autre-secret", corps, bonneSignature)).toBe(false);
  });
});

describe("calculerFinFenetreService / fenetreServiceOuverte", () => {
  it("la fenêtre dure 24h", () => {
    const maintenant = new Date("2026-08-01T10:00:00Z");
    const fin = calculerFinFenetreService(maintenant);
    expect(fin.toISOString()).toBe("2026-08-02T10:00:00.000Z");
  });
  it("ouverte avant l'expiration", () => {
    const fin = new Date("2026-08-02T10:00:00Z");
    expect(fenetreServiceOuverte(fin, new Date("2026-08-02T09:59:59Z"))).toBe(true);
  });
  it("fermée après l'expiration", () => {
    const fin = new Date("2026-08-02T10:00:00Z");
    expect(fenetreServiceOuverte(fin, new Date("2026-08-02T10:00:01Z"))).toBe(false);
  });
  it("fermée si jamais ouverte (null)", () => {
    expect(fenetreServiceOuverte(null, new Date())).toBe(false);
  });
});

describe("extraireExpediteurs", () => {
  it("extrait les numéros des messages entrants", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            { value: { messages: [{ from: "237670000000" }, { from: "237690000000" }] } },
          ],
        },
      ],
    };
    expect(extraireExpediteurs(payload)).toEqual(["237670000000", "237690000000"]);
  });
  it("renvoie un tableau vide si object n'est pas whatsapp_business_account", () => {
    expect(extraireExpediteurs({ object: "autre_chose" })).toEqual([]);
  });
  it("renvoie un tableau vide sur un payload de statut (pas de message entrant)", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [{ changes: [{ value: { statuses: [{ status: "delivered" }] } }] }],
    };
    expect(extraireExpediteurs(payload)).toEqual([]);
  });
  it("tolère un payload complètement invalide", () => {
    expect(extraireExpediteurs(null)).toEqual([]);
    expect(extraireExpediteurs("texte")).toEqual([]);
    expect(extraireExpediteurs({})).toEqual([]);
  });
});

describe("construireTexteStatut", () => {
  it("mentionne le numéro de commande et le statut", () => {
    const texte = construireTexteStatut("NILE-2026-ABCD", "EXPEDIEE", "https://nile-beige.vercel.app");
    expect(texte).toContain("NILE-2026-ABCD");
    expect(texte).toContain("expédiée");
    expect(texte).toContain("https://nile-beige.vercel.app/commandes");
  });
});
