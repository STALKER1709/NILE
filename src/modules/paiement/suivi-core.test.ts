import { describe, it, expect } from "vitest";
import { decisionSuivi } from "@/modules/paiement/suivi-core";

const enAttente = {
  modePaiement: "MONETBIL",
  statutPaiement: "EN_ATTENTE",
  statutCommande: "EN_ATTENTE",
  referenceFournisseur: "ref_d5b40df948dc52cc",
};

describe("decisionSuivi", () => {
  it("interroge un paiement Mobile Money encore en attente", () => {
    expect(decisionSuivi(enAttente)).toBe("INTERROGER");
  });

  it("n'interroge jamais une commande payée à la livraison", () => {
    // Aucun fournisseur n'est impliqué : il n'y a personne à qui demander.
    expect(
      decisionSuivi({ ...enAttente, modePaiement: "COD" }),
    ).toBe("RIEN_A_FAIRE");
  });

  it("n'interroge plus un paiement déjà tranché", () => {
    // Reconclure rejouerait des notifications déjà envoyées à l'acheteur.
    expect(decisionSuivi({ ...enAttente, statutPaiement: "PAYE" })).toBe(
      "RIEN_A_FAIRE",
    );
    expect(decisionSuivi({ ...enAttente, statutPaiement: "ECHOUE" })).toBe(
      "RIEN_A_FAIRE",
    );
  });

  it("n'interroge pas une commande qui n'attend plus", () => {
    // Le stock a été restitué : un « payé » tardif relève du remboursement,
    // pas d'un rafraîchissement automatique.
    expect(decisionSuivi({ ...enAttente, statutCommande: "ANNULEE" })).toBe(
      "RIEN_A_FAIRE",
    );
    expect(decisionSuivi({ ...enAttente, statutCommande: "CONFIRMEE" })).toBe(
      "RIEN_A_FAIRE",
    );
  });

  it("signale un paiement en attente sans référence fournisseur", () => {
    // Anomalie : on ne sait pas quoi demander. Doit être distingué du cas
    // « rien à faire », sinon le problème reste invisible.
    expect(
      decisionSuivi({ ...enAttente, referenceFournisseur: null }),
    ).toBe("SANS_REFERENCE");
  });

  it("privilégie l'état de la commande sur la présence d'une référence", () => {
    expect(
      decisionSuivi({
        ...enAttente,
        statutCommande: "ANNULEE",
        referenceFournisseur: null,
      }),
    ).toBe("RIEN_A_FAIRE");
  });
});
