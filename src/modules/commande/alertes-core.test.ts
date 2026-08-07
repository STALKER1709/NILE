import { describe, it, expect } from "vitest";
import { choisirAlerte } from "@/modules/commande/alertes-core";

const etat = (statutCommande: string, statutPaiement: string) => ({
  statutCommande,
  statutPaiement,
});

describe("choisirAlerte", () => {
  it("n'affiche rien sans paramètre", () => {
    expect(choisirAlerte(undefined, etat("CONFIRMEE", "PAYE"))).toBeNull();
  });

  it("ignore un paramètre inconnu", () => {
    // URL bricolée à la main : on n'affiche pas un bandeau vide.
    expect(choisirAlerte("nimportequoi", etat("CONFIRMEE", "PAYE"))).toBeNull();
  });

  describe("attente de paiement Mobile Money", () => {
    it("invite à valider tant que le paiement est en attente", () => {
      const a = choisirAlerte("paiement_en_cours", etat("EN_ATTENTE", "EN_ATTENTE"));
      expect(a?.texte).toMatch(/Validez-la/);
    });

    it("se tait dès que le paiement a abouti", () => {
      // LE cas qui comptait : la page se rafraîchit toute seule pendant que
      // l'acheteur la regarde. Le bandeau demandait de régler une demande déjà
      // payée — au mieux il doute, au pire il paie deux fois.
      expect(
        choisirAlerte("paiement_en_cours", etat("CONFIRMEE", "PAYE")),
      ).toBeNull();
    });

    it("se tait aussi quand le paiement a échoué", () => {
      expect(
        choisirAlerte("paiement_en_cours", etat("ANNULEE", "ECHOUE")),
      ).toBeNull();
    });
  });

  describe("les autres bandeaux suivent le même principe", () => {
    it("« paiement confirmé » exige un paiement confirmé", () => {
      expect(choisirAlerte("paye", etat("CONFIRMEE", "PAYE"))).not.toBeNull();
      expect(choisirAlerte("paye", etat("EN_ATTENTE", "EN_ATTENTE"))).toBeNull();
    });

    it("« commande annulée » exige une commande annulée", () => {
      expect(choisirAlerte("annulee", etat("ANNULEE", "ECHOUE"))).not.toBeNull();
      expect(choisirAlerte("annulee", etat("CONFIRMEE", "PAYE"))).toBeNull();
    });

    it("« paiement échoué » exige un échec", () => {
      expect(choisirAlerte("echec", etat("ANNULEE", "ECHOUE"))).not.toBeNull();
      expect(choisirAlerte("echec", etat("CONFIRMEE", "PAYE"))).toBeNull();
    });

    it("« réception confirmée » exige une commande livrée", () => {
      expect(choisirAlerte("reception", etat("LIVREE", "PAYE"))).not.toBeNull();
      expect(choisirAlerte("reception", etat("EXPEDIEE", "PAYE"))).toBeNull();
    });

    it("« commande enregistrée » se tait si elle a été annulée depuis", () => {
      expect(choisirAlerte("creee", etat("CONFIRMEE", "EN_ATTENTE"))).not.toBeNull();
      expect(choisirAlerte("creee", etat("ANNULEE", "ECHOUE"))).toBeNull();
      expect(choisirAlerte("creee", etat("REFUSEE", "EN_ATTENTE"))).toBeNull();
    });
  });
});
