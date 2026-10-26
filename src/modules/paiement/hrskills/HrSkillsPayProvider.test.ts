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
  it("échange les clés puis appelle le Cash-In documenté avec la Clé A, le token et une clé d'idempotence stable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        transaction_token: "transaction-test-token",
        expires_in: 2700,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        reference: "ref_test_123",
        status: "PENDING",
      }), { status: 202 }));
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
      urlNotification: "https://nile.example/api/webhook/hrskills",
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
    expect(headers.get("authorization")).toBe("Bearer hrsk_pk_test_public");
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
      urlNotification: "https://nile.example/api/webhook/hrskills",
      operateur: "orange",
    })).rejects.toThrow("HTTP 403");
  });
});
