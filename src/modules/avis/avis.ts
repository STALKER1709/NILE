import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AvisInput } from "@/validators/avis";

/** L'acheteur a-t-il reçu (commande LIVREE) ce produit ? */
export async function aAchatLivre(
  utilisateurId: string,
  produitId: string,
): Promise<boolean> {
  const ligne = await prisma.ligneCommande.findFirst({
    where: {
      produitId,
      commande: { acheteurId: utilisateurId, statutCommande: "LIVREE" },
    },
    select: { id: true },
  });
  return ligne !== null;
}

export async function aDejaDonneAvis(
  utilisateurId: string,
  produitId: string,
): Promise<boolean> {
  const avis = await prisma.avis.findUnique({
    where: { produitId_acheteurId: { produitId, acheteurId: utilisateurId } },
    select: { id: true },
  });
  return avis !== null;
}

/** Peut laisser un avis : a reçu le produit ET ne l'a pas déjà noté. */
export async function peutLaisserAvis(
  utilisateurId: string,
  produitId: string,
): Promise<boolean> {
  if (!(await aAchatLivre(utilisateurId, produitId))) return false;
  return !(await aDejaDonneAvis(utilisateurId, produitId));
}

export async function listerAvisProduit(produitId: string) {
  return prisma.avis.findMany({
    where: { produitId },
    orderBy: { dateCreation: "desc" },
    include: { acheteur: { select: { nom: true } } },
    take: 50,
  });
}

/**
 * Répartition des notes d'un produit : nombre d'avis par étoile (1 à 5).
 * Sert à afficher l'histogramme de confiance (barres 5★ → 1★).
 * Tous les avis proviennent d'un achat livré : ils sont « vérifiés » par nature.
 */
export async function getRepartitionNotes(produitId: string): Promise<{
  total: number;
  moyenne: number;
  parNote: Record<1 | 2 | 3 | 4 | 5, number>;
}> {
  const groupes = await prisma.avis.groupBy({
    by: ["note"],
    where: { produitId },
    _count: true,
  });
  const parNote = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    1 | 2 | 3 | 4 | 5,
    number
  >;
  let total = 0;
  let somme = 0;
  for (const g of groupes) {
    const n = g.note as 1 | 2 | 3 | 4 | 5;
    if (n >= 1 && n <= 5) {
      parNote[n] = g._count;
      total += g._count;
      somme += n * g._count;
    }
  }
  return { total, moyenne: total > 0 ? somme / total : 0, parNote };
}

export type ResultatAvis =
  | { ok: true }
  | { ok: false; code: "NON_ACHETE" | "DEJA_AVIS" | "ERREUR" };

/**
 * Crée un avis (achat livré requis) et met à jour la note moyenne et le nombre
 * d'avis du produit, le tout dans une transaction.
 */
export async function creerAvis(
  utilisateurId: string,
  input: AvisInput,
): Promise<ResultatAvis> {
  if (!(await aAchatLivre(utilisateurId, input.produitId))) {
    return { ok: false, code: "NON_ACHETE" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.avis.create({
        data: {
          produitId: input.produitId,
          acheteurId: utilisateurId,
          note: input.note,
          commentaire: input.commentaire ?? null,
        },
      });
      const agg = await tx.avis.aggregate({
        where: { produitId: input.produitId },
        _avg: { note: true },
        _count: true,
      });
      await tx.produit.update({
        where: { id: input.produitId },
        data: {
          noteMoyenne: agg._avg.note ?? 0,
          nbAvis: agg._count,
        },
      });
    });
    return { ok: true };
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, code: "DEJA_AVIS" };
    }
    console.error("creerAvis:", erreur);
    return { ok: false, code: "ERREUR" };
  }
}
