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
      lignes: {
        select: {
          produitId: true,
          varianteId: true,
          titreProduit: true,
          quantite: true,
        },
      },
    },
  });
  if (!commande || commande.lignes.length === 0) {
    return { ok: false, code: "INTROUVABLE" };
  }

  // Le rachat raisonne par DÉCLINAISON : reprendre « le t-shirt » sans sa
  // taille n'aurait aucun sens. Les lignes antérieures aux déclinaisons n'en
  // désignent aucune et sont ignorées plutôt que rattachées à une variante
  // devinée.
  const lignes = commande.lignes.filter(
    (l): l is typeof l & { varianteId: string } => l.varianteId !== null,
  );
  if (lignes.length === 0) return { ok: false, code: "RIEN_DISPONIBLE" };

  const varianteIds = lignes.map((l) => l.varianteId);
  const [variantes, panier] = await Promise.all([
    prisma.varianteProduit.findMany({
      where: { id: { in: varianteIds } },
      select: {
        id: true,
        produitId: true,
        stock: true,
        actif: true,
        produit: {
          select: {
            statut: true,
            vendeur: { select: { statutValidation: true } },
          },
        },
      },
    }),
    prisma.panier.upsert({
      where: { utilisateurId },
      update: {},
      create: { utilisateurId },
      select: { id: true, lignes: { select: { varianteId: true, quantite: true } } },
    }),
  ]);

  // Retrouver le produit d'une déclinaison au moment d'écrire la ligne de
  // panier, qui porte les deux.
  const produitParVariante = new Map(variantes.map((v) => [v.id, v.produitId]));

  const dejaEnPanier = new Map(panier.lignes.map((l) => [l.varianteId, l.quantite]));
  // La planification est purement arithmétique : sa clé lui est opaque. On lui
  // passe donc des identifiants de DÉCLINAISON là où elle parlait de produits.
  const etats = new Map<string, EtatProduitRachat>(
    variantes.map((v) => [
      v.id,
      {
        produitId: v.id,
        achetable:
          v.actif &&
          v.produit.statut === "ACTIF" &&
          v.produit.vendeur.statutValidation === "VALIDE",
        stock: v.stock,
        dejaEnPanier: dejaEnPanier.get(v.id) ?? 0,
      },
    ]),
  );

  // Même substitution de clé côté lignes : la planification compare des
  // identifiants, elle ne les interprète pas.
  const lignesPourPlan = lignes.map((l) => ({
    produitId: l.varianteId,
    titreProduit: l.titreProduit,
    quantite: l.quantite,
  }));
  const plan = planifierRachat(lignesPourPlan, etats);
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
        // `ligne.produitId` porte ici un identifiant de DÉCLINAISON : c'est la
        // clé passée à la planification plus haut.
        where: {
          panierId_varianteId: { panierId: panier.id, varianteId: ligne.produitId },
        },
        update: { quantite: { increment: ligne.quantiteAjoutee } },
        create: {
          panierId: panier.id,
          produitId: produitParVariante.get(ligne.produitId) as string,
          varianteId: ligne.produitId,
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
