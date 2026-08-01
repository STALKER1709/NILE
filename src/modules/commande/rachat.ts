import { prisma } from "@/lib/db";
import {
  planifierRachat,
  messageProblemesRachat,
  type EtatProduitRachat,
} from "@/modules/commande/rachat-core";

export type ResultatRachat =
  | {
      ok: true;
      /** Nombre d'unités réellement ajoutées au panier. */
      unitesAjoutees: number;
      /** Message d'avertissement si tout n'a pas pu être repris à l'identique. */
      avertissement: string | null;
    }
  | { ok: false; code: "INTROUVABLE" | "RIEN_DISPONIBLE"; avertissement?: string };

/**
 * Remet au panier les articles d'une ancienne commande de l'acheteur.
 *
 * Les prix ne sont JAMAIS repris de l'ancienne commande : le panier lit
 * toujours le prix courant du catalogue (promotions comprises). On ne
 * reprend que les produits et les quantités.
 *
 * La commande est retrouvée par (id, acheteurId) : un identifiant fourni par
 * le client ne peut pas donner accès à la commande d'un tiers.
 */
export async function racheterCommande(
  utilisateurId: string,
  commandeId: string,
): Promise<ResultatRachat> {
  const commande = await prisma.commande.findFirst({
    where: { id: commandeId, acheteurId: utilisateurId },
    select: {
      lignes: { select: { produitId: true, titreProduit: true, quantite: true } },
    },
  });
  if (!commande || commande.lignes.length === 0) {
    return { ok: false, code: "INTROUVABLE" };
  }

  const produitIds = commande.lignes.map((l) => l.produitId);
  const [produits, panier] = await Promise.all([
    prisma.produit.findMany({
      where: { id: { in: produitIds } },
      select: {
        id: true,
        stock: true,
        statut: true,
        vendeur: { select: { statutValidation: true } },
      },
    }),
    prisma.panier.upsert({
      where: { utilisateurId },
      update: {},
      create: { utilisateurId },
      select: { id: true, lignes: { select: { produitId: true, quantite: true } } },
    }),
  ]);

  const dejaEnPanier = new Map(panier.lignes.map((l) => [l.produitId, l.quantite]));
  const etats = new Map<string, EtatProduitRachat>(
    produits.map((p) => [
      p.id,
      {
        produitId: p.id,
        achetable: p.statut === "ACTIF" && p.vendeur.statutValidation === "VALIDE",
        stock: p.stock,
        dejaEnPanier: dejaEnPanier.get(p.id) ?? 0,
      },
    ]),
  );

  const plan = planifierRachat(commande.lignes, etats);
  const avertissement = messageProblemesRachat(plan.problemes);

  if (plan.aAjouter.length === 0) {
    return {
      ok: false,
      code: "RIEN_DISPONIBLE",
      ...(avertissement ? { avertissement } : {}),
    };
  }

  // Écriture groupée : le panier ne doit pas rester à moitié rempli si une
  // ligne échoue.
  await prisma.$transaction(
    plan.aAjouter.map((ligne) =>
      prisma.lignePanier.upsert({
        where: {
          panierId_produitId: { panierId: panier.id, produitId: ligne.produitId },
        },
        update: { quantite: { increment: ligne.quantiteAjoutee } },
        create: {
          panierId: panier.id,
          produitId: ligne.produitId,
          quantite: ligne.quantiteAjoutee,
        },
      }),
    ),
  );

  return {
    ok: true,
    unitesAjoutees: plan.aAjouter.reduce((s, l) => s + l.quantiteAjoutee, 0),
    avertissement,
  };
}
