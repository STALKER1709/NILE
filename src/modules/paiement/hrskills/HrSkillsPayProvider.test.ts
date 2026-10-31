import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    HRSKILLS_CLE_A: "hrsk_pk_test_public",
    HRSKILLS_CLE_B: "hrsk_sk_test_secret",
    HRSKILLS_BASE_URL: "https://api.hrskills-pay.com",
    HRSKILLS_WEBHOOK_SECRET: "webhook-test-secret",
  },
}));

import { HrSkillsPayProvider } from "@/modules/paiement/hrskills/HrSkillsPayProvider";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("HrSkillsPayProvider — contrat Cash-In", () => {
  it("échange les clés puis appelle le Cash-In avec la Clé B, le token et une clé d'idempotence stable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        transaction_token: "transaction-test-token",
        expires_in: 2700,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: { reference: "ref_test_123", status: "PENDING" },
        message: "Payment initiated",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new HrSkillsPayProvider();
    const contexte = {
      reference: "3f2a1c4e-9b7d-4e21-a8f6-0c5d2e7b1a93",
      montant: 100,
      telephone: "699823686",
      email: "test@example.com",
      nomComplet: "Test Client",
      numeroCommande: "NILE-TEST-1",
      urlRetour: "https://nile.example/retour",
      urlNotification: "https://nile-beige.vercel.app/api/paiement/callback",
      operateur: "orange",
    };

    const resultat = await provider.initier(contexte);

    expect(resultat.reference).toBe(contexte.reference);
    expect(resultat.referenceFournisseur).toBe("ref_test_123");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [urlAuth, optionsAuth] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(urlAuth).toBe("https://api.hrskills-pay.com/sandbox/v1/auth/transaction-token");
    expect(new Headers(optionsAuth.headers).get("authorization")).toBe("Bearer hrsk_pk_test_public");
    expect(JSON.parse(String(optionsAuth.body))).toEqual({ api_secret: "hrsk_sk_test_secret" });

    const [urlCashin, optionsCashin] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(urlCashin).toBe("https://api.hrskills-pay.com/sandbox/api/v1/payin/mobile-money");
    const headers = new Headers(optionsCashin.headers);
    expect(headers.get("authorization")).toBe("Bearer hrsk_sk_test_secret");
    expect(headers.get("x-transaction-token")).toBe("transaction-test-token");
    expect(headers.get("idempotency-key")).toBe(contexte.reference);
    expect(headers.has("x-api-secret")).toBe(false);
    expect(JSON.parse(String(optionsCashin.body))).toMatchObject({
      phone_number: "237699823686",
      operator: "ORANGE",
      country: "CM",
      amount: 100,
      currency: "XAF",
      metadata: { reference_interne: contexte.reference, commande: contexte.numeroCommande },
    });
  });

  it("demande une réconciliation si un webhook de paiement signé ne contient aucune référence", async () => {
    const { createHmac } = await import("node:crypto");
    const brut = JSON.stringify({
      id: "evt_123",
      event: "payment.succeeded",
      merchant_id: "merchant_123",
      created_at: "2026-10-26T08:00:00.000Z",
      data: { message: "Payment succeeded" },
    });
    const signature = "sha256=" + createHmac("sha256", "webhook-test-secret").update(brut).digest("hex");
    const provider = new HrSkillsPayProvider();
    const resultat = await provider.verifierNotification({}, {
      brut,
      entetes: new Headers({ "x-hub-signature": signature }),
    });
    expect(resultat).toEqual({
      ok: false,
      raison: "RECONCILIATION_REQUISE",
      evenement: "payment.succeeded",
    });
  });

  it("renvoie l'erreur HTTP du fournisseur sans masquer le code de réponse", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        transaction_token: "transaction-test-token",
        expires_in: 2700,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{"error":"KYC_NOT_APPROVED"}', { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new HrSkillsPayProvider();
    await expect(provider.initier({
      reference: "3f2a1c4e-9b7d-4e21-a8f6-0c5d2e7b1a93",
      montant: 100,
      telephone: "699823686",
      email: "test@example.com",
      nomComplet: "Test Client",
      numeroCommande: "NILE-TEST-2",
      urlRetour: "https://nile.example/retour",
      urlNotification: "https://nile-beige.vercel.app/api/paiement/callback",
      operateur: "orange",
    })).rejects.toThrow("HTTP 403");
  });
  it("envoie un Cash-Out MTN avec une clé d'idempotence stable et conserve les frais", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ transaction_token: "transaction-test-token", expires_in: 2700 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { reference: "payout_ref_123", status: "PENDING", fee: 100, net_amount: 10100 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new HrSkillsPayProvider();
    const reference = "3f2a1c4e-9b7d-4e21-a8f6-0c5d2e7b1a93";
    const resultat = await provider.decaisser({
      reference, telephone: "699823686", operateur: "MTN", montant: 10000,
      description: "Reversement NILE · Boutique test",
    });
    expect(resultat).toEqual({ reference: "payout_ref_123", statut: "PENDING", frais: 100 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://api.hrskills-pay.com/sandbox/api/v1/payout/mobile-money");
    const headers = new Headers(options.headers);
    expect(headers.get("authorization")).toBe("Bearer hrsk_pk_test_public");
    expect(headers.get("x-transaction-token")).toBe("transaction-test-token");
    expect(headers.get("idempotency-key")).toBe(reference);
    expect(JSON.parse(String(options.body))).toEqual({
      operator: "MTN", country: "CM", phone_number: "237699823686",
      amount: 10000, currency: "XAF", description: "Reversement NILE · Boutique test",
    });
  });

  it("relit le statut d'un Cash-Out sur l'endpoint documenté avec la Clé A", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ transaction_token: "transaction-test-token", expires_in: 2700 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { status: "SUCCESS" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new HrSkillsPayProvider();
    await expect(provider.lireStatutDecaissement("payout_ref_123")).resolves.toEqual({ ok: true, statut: "SUCCESS" });
    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://api.hrskills-pay.com/sandbox/v1/payments/payout_ref_123");
    const headers = new Headers(options.headers);
    expect(headers.get("authorization")).toBe("Bearer hrsk_pk_test_public");
    expect(headers.get("x-transaction-token")).toBe("transaction-test-token");
  });

});
