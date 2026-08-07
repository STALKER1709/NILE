import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  estOperateurValide,
  normaliserOperateur,
  normaliserNumeroHrSkills,
  mapperStatutHrSkills,
  verifierSignatureHrSkills,
  lireWebhookHrSkills,
  structureJson,
  estCleDeTest,
  environnementCle,
  clesCoherentes,
  estUuidV4,
  cleIdempotence,
  racineHrSkills,
} from "@/modules/paiement/hrskills/hrskills-core";

describe("environnement sandbox / live", () => {
  const test = "hrsk_pk_test_abc123";
  const live = "hrsk_pk_live_abc123";

  it("distingue les clés de test des clés de production", () => {
    expect(estCleDeTest(test)).toBe(true);
    expect(estCleDeTest(live)).toBe(false);
  });

  it("lit l'environnement porté par la clé", () => {
    expect(environnementCle(test)).toBe("test");
    expect(environnementCle(live)).toBe("live");
  });

  it("ne devine pas l'environnement d'une clé sans marqueur", () => {
    // Surtout pas « live » par défaut : une clé illisible doit bloquer le
    // démarrage, pas partir en production.
    expect(environnementCle("hrsk_pk_abc123")).toBeNull();
    expect(estCleDeTest("hrsk_pk_abc123")).toBe(false);
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

describe("cohérence des deux clés", () => {
  it("accepte deux clés du même environnement", () => {
    expect(clesCoherentes("hrsk_pk_live_a", "hrsk_sk_live_b")).toBe(true);
    expect(clesCoherentes("hrsk_pk_test_a", "hrsk_sk_test_b")).toBe(true);
  });

  it("refuse un mélange test / live dans les deux sens", () => {
    expect(clesCoherentes("hrsk_pk_live_a", "hrsk_sk_test_b")).toBe(false);
    expect(clesCoherentes("hrsk_pk_test_a", "hrsk_sk_live_b")).toBe(false);
  });

  it("refuse une clé sans marqueur d'environnement", () => {
    expect(clesCoherentes("hrsk_pk_a", "hrsk_sk_live_b")).toBe(false);
    expect(clesCoherentes("", "")).toBe(false);
  });
});

describe("clé d'idempotence", () => {
  const paiementId = "3f2a1c4e-9b7d-4e21-a8f6-0c5d2e7b1a93"; // id Paiement (uuid v4)

  it("est stable : deux tentatives sur le même paiement donnent la même clé", () => {
    // C'est LA propriété qui protège du double débit quand l'acheteur relance
    // un paiement resté en attente.
    expect(cleIdempotence(paiementId)).toBe(cleIdempotence(paiementId));
    expect(cleIdempotence("ref-non-uuid")).toBe(cleIdempotence("ref-non-uuid"));
  });

  it("reprend telle quelle une référence déjà au format uuid v4", () => {
    expect(cleIdempotence(paiementId)).toBe(paiementId);
  });

  it("distingue deux paiements différents", () => {
    expect(cleIdempotence("paiement-a")).not.toBe(cleIdempotence("paiement-b"));
  });

  it("produit toujours un uuid v4 valide, même à partir d'une référence qui ne l'est pas", () => {
    // La doc impose ce format sur l'en-tête Idempotency-Key.
    expect(estUuidV4(cleIdempotence("paiement-42"))).toBe(true);
    expect(estUuidV4(cleIdempotence(""))).toBe(true);
    expect(estUuidV4(cleIdempotence("ID_AVEC_MAJUSCULES_ET_-_TIRETS"))).toBe(true);
  });

  it("reconnaît le format uuid v4 et rejette ce qui n'en est pas", () => {
    expect(estUuidV4(paiementId)).toBe(true);
    // Version 1, pas 4.
    expect(estUuidV4("3f2a1c4e-9b7d-1e21-a8f6-0c5d2e7b1a93")).toBe(false);
    expect(estUuidV4("pas-un-uuid")).toBe(false);
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

describe("structureJson", () => {
  it("restitue les clés, jamais les valeurs", () => {
    // Un corps de webhook transporte un numéro de téléphone et un montant ;
    // un journal se relit, se copie et se colle.
    const structure = structureJson({
      event: "payment.succeeded",
      data: { reference: "ref_abc123", amount: 100, phone: "+237699823686" },
    });
    expect(structure).toBe("{event, data: {reference, amount, phone}}");
    expect(structure).not.toContain("699823686");
    expect(structure).not.toContain("ref_abc123");
  });

  it("montre l'imbrication, qui est justement ce qu'on cherche", () => {
    expect(structureJson({ data: { transaction: { id: 1 } } })).toBe(
      "{data: {transaction: {id}}}",
    );
  });

  it("résume un tableau par sa taille et son premier élément", () => {
    expect(structureJson({ items: [{ id: 1 }, { id: 2 }] })).toBe(
      "{items: [2× {id}]}",
    );
    expect(structureJson({ items: [] })).toBe("{items: []}");
  });

  it("borne la profondeur pour ne pas déverser une charge entière", () => {
    expect(structureJson({ a: { b: { c: { d: { e: 1 } } } } })).toBe(
      "{a: {b: {c: {…}}}}",
    );
  });

  it("supporte ce qui n'est pas un objet", () => {
    expect(structureJson(null)).toBe("null");
    expect(structureJson("texte")).toBe("string");
    expect(structureJson(42)).toBe("number");
  });
});
