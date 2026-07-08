import type { StatutVendeur } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listerVendeurs() {
  return prisma.vendeur.findMany({
    orderBy: [{ statutValidation: "asc" }, { dateCreation: "desc" }],
    include: {
      utilisateur: { select: { nom: true, email: true, telephone: true } },
      _count: { select: { produits: true } },
    },
  });
}

const STATUTS_VALIDES: StatutVendeur[] = [
  "EN_ATTENTE",
  "VALIDE",
  "REJETE",
  "SUSPENDU",
];

export type ResultatVendeur =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "STATUT_INVALIDE" };

export async function changerStatutVendeur(
  vendeurId: string,
  statut: StatutVendeur,
): Promise<ResultatVendeur> {
  if (!STATUTS_VALIDES.includes(statut)) {
    return { ok: false, code: "STATUT_INVALIDE" };
  }
  const vendeur = await prisma.vendeur.findUnique({ where: { id: vendeurId } });
  if (!vendeur) return { ok: false, code: "INTROUVABLE" };
  await prisma.vendeur.update({
    where: { id: vendeurId },
    data: { statutValidation: statut },
  });
  return { ok: true };
}
