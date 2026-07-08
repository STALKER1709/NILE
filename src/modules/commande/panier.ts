import { prisma } from "@/lib/db";
import { stockSuffisant } from "@/modules/commande/commande-core";

/** Panier de l'utilisateur, avec lignes + infos produit. Créé si absent. */
export async function getPanierAvecLignes(utilisateurId: string) {
  const include = {
    lignes: {
      orderBy: { produit: { titre: "asc" } },
      include: {
        produit: {
          include: {
            images: { orderBy: { ordre: "asc" }, take: 1 },
            vendeur: { select: { statutValidation: true, nomBoutique: true } },
          },
        },
      },
    },
  } as const;

  const panier = await prisma.panier.findUnique({
    where: { utilisateurId },
    include,
  });
  if (panier) return panier;
  return prisma.panier.create({ data: { utilisateurId }, include });
}

/** Un produit est achetable s'il est ACTIF et sa boutique VALIDÉE. */
function estAchetable(produit: {
  statut: string;
  vendeur: { statutValidation: string };
}): boolean {
  return (
    produit.statut === "ACTIF" && produit.vendeur.statutValidation === "VALIDE"
  );
}

export type ResultatPanier =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "INDISPONIBLE" | "STOCK_INSUFFISANT" };

export async function ajouterAuPanier(
  utilisateurId: string,
  produitId: string,
  quantite: number,
): Promise<ResultatPanier> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: { vendeur: { select: { statutValidation: true } } },
  });
  if (!produit) return { ok: false, code: "INTROUVABLE" };
  if (!estAchetable(produit)) return { ok: false, code: "INDISPONIBLE" };

  const panier = await prisma.panier.upsert({
    where: { utilisateurId },
    update: {},
    create: { utilisateurId },
  });

  const existante = await prisma.lignePanier.findUnique({
    where: { panierId_produitId: { panierId: panier.id, produitId } },
  });
  const quantiteVoulue = (existante?.quantite ?? 0) + quantite;

  if (!stockSuffisant(produit.stock, quantiteVoulue)) {
    return { ok: false, code: "STOCK_INSUFFISANT" };
  }

  await prisma.lignePanier.upsert({
    where: { panierId_produitId: { panierId: panier.id, produitId } },
    update: { quantite: quantiteVoulue },
    create: { panierId: panier.id, produitId, quantite },
  });
  return { ok: true };
}

export async function modifierQuantite(
  utilisateurId: string,
  ligneId: string,
  quantite: number,
): Promise<ResultatPanier> {
  const ligne = await prisma.lignePanier.findUnique({
    where: { id: ligneId },
    include: { panier: true, produit: true },
  });
  if (!ligne || ligne.panier.utilisateurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (quantite <= 0) {
    await prisma.lignePanier.delete({ where: { id: ligneId } });
    return { ok: true };
  }
  if (!stockSuffisant(ligne.produit.stock, quantite)) {
    return { ok: false, code: "STOCK_INSUFFISANT" };
  }
  await prisma.lignePanier.update({
    where: { id: ligneId },
    data: { quantite },
  });
  return { ok: true };
}

export async function retirerLigne(
  utilisateurId: string,
  ligneId: string,
): Promise<ResultatPanier> {
  const ligne = await prisma.lignePanier.findUnique({
    where: { id: ligneId },
    include: { panier: true },
  });
  if (!ligne || ligne.panier.utilisateurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }
  await prisma.lignePanier.delete({ where: { id: ligneId } });
  return { ok: true };
}

/** Nombre total d'articles dans le panier (pour le badge de navigation). */
export async function compterArticlesPanier(
  utilisateurId: string,
): Promise<number> {
  const lignes = await prisma.lignePanier.findMany({
    where: { panier: { utilisateurId } },
    select: { quantite: true },
  });
  return lignes.reduce((s, l) => s + l.quantite, 0);
}
