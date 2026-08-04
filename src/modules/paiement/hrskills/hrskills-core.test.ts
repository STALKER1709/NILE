import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  estOperateurValide,
  normaliserOperateur,
  normaliserNumeroHrSkills,
  mapperStatutHrSkills,
  verifierSignatureHrSkills,
  lireWebhookHrSkills,
  estCleDeTest,
  racineHrSkills,
} from "@/modules/paiement/hrskills/hrskills-core";

describe("environnement sandbox / live", () => {
  const test = "hrsk_a_test_abc123";
  const live = "hrsk_a_live_abc123";

  it("distingue les clés de test des clés de production", () => {
    expect(estCleDeTest(test)).toBe(true);
    expect(estCleDeTest(live)).toBe(false);
  });

  it("préfixe /sandbox avec une clé de test", () => {
    expect(racineHrSkills("https://api.hrskills-pay.com", test)).toBe(
      "https://api.hrskills-pay.com/sandbox",
    );
  });

  it("ne préfixe rien en production", () => {
    expect(racineHrSkills("https://api.hrskills-pay.com", live)).toBe(
      "https://api.hrskills-pay.com",
    );
  });

  it("ne double jamais le préfixe déjà présent dans la base", () => {
    expect(racineHrSkills("https://api.hrskills-pay.com/sandbox", test)).toBe(
      "https://api.hrskills-pay.com/sandbox",
    );
    expect(racineHrSkills("https://api.hrskills-pay.com/sandbox/", test)).toBe(
      "https://api.hrskills-pay.com/sandbox",
    );
  });

  it("tolère une barre oblique finale", () => {
    expect(racineHrSkills("https://api.hrskills-pay.com/", test)).toBe(
      "https://api.hrskills-pay.com/sandbox",
    );
    expect(racineHrSkills("https://api.hrskills-pay.com/", live)).toBe(
      "https://api.hrskills-pay.com",
    );
  });
});

describe("opérateurs", () => {
  it("accepte les opérateurs camerounais, quelle que soit la casse", () => {
    expect(estOperateurValide("mtn")).toBe(true);
    expect(estOperateurValide("ORANGE")).toBe(true);
  });
  it("refuse un opérateur absent du pays", () => {
    expect(estOperateurValide("wave")).toBe(false); // Sénégal / Côte d'Ivoire
    expect(estOperateurValide("")).toBe(false);
  });
  it("normalise en minuscules", () => {
    expect(normaliserOperateur("  ORANGE ")).toBe("orange");
  });
});

describe("normaliserNumeroHrSkills", () => {
  it("ajoute l'indicatif quand il manque", () => {
    expect(normaliserNumeroHrSkills("655500393")).toBe("237655500393");
  });
  it("conserve un numéro déjà préfixé", () => {
    expect(normaliserNumeroHrSkills("237655500393")).toBe("237655500393");
  });
  it("retire le + et les espaces", () => {
    expect(normaliserNumeroHrSkills("+237 655 500 393")).toBe("237655500393");
  });
  it("refuse un numéro trop court", () => {
    expect(normaliserNumeroHrSkills("1234")).toBeNull();
  });
});

describe("mapperStatutHrSkills", () => {
  it("SUCCESS -> payé, FAILED -> échoué", () => {
    expect(mapperStatutHrSkills("SUCCESS")).toBe("PAYE");
    expect(mapperStatutHrSkills("FAILED")).toBe("ECHOUE");
  });
  it("PENDING et HOLD ne concluent rien", () => {
    // HOLD = révision AML : surtout ne pas libérer la commande.
    expect(mapperStatutHrSkills("PENDING")).toBeNull();
    expect(mapperStatutHrSkills("HOLD")).toBeNull();
  });
  it("REFUNDED est traité comme un échec de commande", () => {
    expect(mapperStatutHrSkills("REFUNDED")).toBe("ECHOUE");
  });
  it("un statut inconnu ne conclut rien", () => {
    expect(mapperStatutHrSkills("BIZARRE")).toBeNull();
    expect(mapperStatutHrSkills("")).toBeNull();
  });
  it("est insensible à la casse et aux espaces", () => {
    expect(mapperStatutHrSkills(" success ")).toBe("PAYE");
  });
});

describe("verifierSignatureHrSkills", () => {
  const secret = "whsec_test";
  const corps = '{"data":{"reference":"ref_abc","status":"SUCCESS"}}';
  const bonne = `sha256=${createHmac("sha256", secret).update(corps).digest("hex")}`;

  it("accepte une signature valide", () => {
    expect(verifierSignatureHrSkills(secret, corps, [bonne])).toBe(true);
  });
  it("accepte la signature quelle que soit la variante d'en-tête reçue", () => {
    expect(verifierSignatureHrSkills(secret, corps, [null, bonne])).toBe(true);
  });
  it("refuse une signature falsifiée", () => {
    expect(verifierSignatureHrSkills(secret, corps, ["sha256=deadbeef"])).toBe(false);
  });
  it("refuse quand aucun en-tête n'est fourni", () => {
    expect(verifierSignatureHrSkills(secret, corps, [null, null])).toBe(false);
  });
  it("refuse si le corps a été modifié d'un seul caractère", () => {
    expect(verifierSignatureHrSkills(secret, `${corps} `, [bonne])).toBe(false);
  });
  it("refuse avec un mauvais secret", () => {
    expect(verifierSignatureHrSkills("autre", corps, [bonne])).toBe(false);
  });
});

describe("lireWebhookHrSkills", () => {
  it("lit une référence imbriquée sous data", () => {
    const lu = lireWebhookHrSkills({
      event: "payment.succeeded",
      data: { reference: "ref_abc", status: "SUCCESS" },
    });
    expect(lu).toEqual({
      reference: "ref_abc",
      statutAnnonce: "SUCCESS",
      referenceInterne: null,
    });
  });

  it("lit une référence posée à la racine", () => {
    const lu = lireWebhookHrSkills({ reference: "ref_xyz", status: "FAILED" });
    expect(lu?.reference).toBe("ref_xyz");
    expect(lu?.statutAnnonce).toBe("FAILED");
  });

  it("récupère notre référence interne depuis metadata", () => {
    const lu = lireWebhookHrSkills({
      data: { reference: "ref_abc", metadata: { reference_interne: "paiement-42" } },
    });
    expect(lu?.referenceInterne).toBe("paiement-42");
  });

  it("tolère l'absence de statut annoncé", () => {
    const lu = lireWebhookHrSkills({ data: { reference: "ref_abc" } });
    expect(lu?.reference).toBe("ref_abc");
    expect(lu?.statutAnnonce).toBeNull();
  });

  it("refuse une charge sans référence exploitable", () => {
    expect(lireWebhookHrSkills({ data: { status: "SUCCESS" } })).toBeNull();
    expect(lireWebhookHrSkills({})).toBeNull();
    expect(lireWebhookHrSkills(null)).toBeNull();
    expect(lireWebhookHrSkills("texte")).toBeNull();
  });
});
