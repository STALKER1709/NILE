import { describe, it, expect } from "vitest";
import {
  construireEmailAcheteur,
  construireEmailVendeur,
  vendeursDeLaCommande,
  type CommandePourEmail,
} from "@/modules/email/notifications-core";

const commande: CommandePourEmail = {
  numero: "NILE-2026-ABCD1234",
  total: 27500,
  modePaiement: "COD",
  lignes: [
    { titreProduit: "Bouilloire", quantite: 1, sousTotal: 15000, vendeurId: "v1" },
    { titreProduit: "Écouteurs", quantite: 1, sousTotal: 12500, vendeurId: "v2" },
  ],
  destNom: "Jean Test",
  destTelephone: "+237611111111",
  ville: "Douala",
  quartier: "Akwa",
  reperes: "Face pharmacie",
};

describe("construireEmailAcheteur", () => {
  it("contient le numéro, tous les articles, le total et l'adresse", () => {
    const email = construireEmailAcheteur(commande, "Jean");
    expect(email.sujet).toContain("NILE-2026-ABCD1234");
    expect(email.texte).toContain("Bouilloire");
    expect(email.texte).toContain("Écouteurs");
    expect(email.texte).toContain("27 500");
    expect(email.texte).toContain("Akwa, Douala");
    expect(email.texte).toContain("Face pharmacie");
    expect(email.texte).toContain("Paiement à la livraison");
  });

  it("indique « payé » pour Mobile Money", () => {
    const email = construireEmailAcheteur(
      { ...commande, modePaiement: "MONETBIL" },
      "Jean",
    );
    expect(email.texte).toContain("Mobile Money (payé)");
  });

  it("n'affiche pas la ligne repères quand absente", () => {
    const email = construireEmailAcheteur({ ...commande, reperes: null }, "Jean");
    expect(email.texte).not.toContain("Repères");
  });
});

describe("construireEmailVendeur", () => {
  it("ne contient QUE les lignes du vendeur, avec son sous-total", () => {
    const email = construireEmailVendeur(commande, "v1", "Boutique A");
    expect(email).not.toBeNull();
    expect(email!.texte).toContain("Bouilloire");
    expect(email!.texte).not.toContain("Écouteurs");
    expect(email!.sujet).toContain("15 000");
    expect(email!.texte).toContain("+237611111111");
  });

  it("renvoie null pour un vendeur sans ligne dans la commande", () => {
    expect(construireEmailVendeur(commande, "v999", "Autre")).toBeNull();
  });

  it("le HTML échappe le contenu", () => {
    const avecHtml: CommandePourEmail = {
      ...commande,
      lignes: [
        {
          titreProduit: "<script>méchant</script>",
          quantite: 1,
          sousTotal: 1000,
          vendeurId: "v1",
        },
      ],
    };
    const email = construireEmailVendeur(avecHtml, "v1", "Boutique A");
    expect(email!.html).not.toContain("<script>");
    expect(email!.html).toContain("&lt;script&gt;");
  });
});

describe("vendeursDeLaCommande", () => {
  it("déduplique les identifiants vendeurs", () => {
    expect(
      vendeursDeLaCommande([
        ...commande.lignes,
        { titreProduit: "X", quantite: 1, sousTotal: 1, vendeurId: "v1" },
      ]),
    ).toEqual(["v1", "v2"]);
  });
});
