import type { StatutProduit } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Tous les produits (tous statuts) pour la modération. */
export async function listerProduitsModeration() {
  return prisma.produit.findMany({
    orderBy: { dateMaj: "desc" },
    take: 200,
    include: {
      vendeur: { select: { nomBoutique: true } },
      categorie: { select: { nom: true } },
      images: { orderBy: { ordre: "asc" }, take: 1 },
    },
  });
}

export type ResultatModeration =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "STATUT_INVALIDE" };

// L'admin peut rejeter (masquer) un produit ou le réactiver.
const STATUTS_MODERATION: StatutProduit[] = ["REJETE", "ACTIF", "INACTIF"];

export async function modererProduit(
  produitId: string,
  statut: StatutProduit,
): Promise<ResultatModeration> {
  if (!STATUTS_MODERATION.includes(statut)) {
    return { ok: false, code: "STATUT_INVALIDE" };
  }
  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit) return { ok: false, code: "INTROUVABLE" };
  await prisma.produit.update({
    where: { id: produitId },
    data: { statut },
  });
  return { ok: true };
}
