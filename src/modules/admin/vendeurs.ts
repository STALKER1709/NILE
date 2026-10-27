import type { StatutVendeur } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listerVendeurs() {
  return prisma.vendeur.findMany({
    orderBy: [{ statutValidation: "asc" }, { dateCreation: "desc" }],
    include: {
      utilisateur: { select: { nom: true, email: true, telephone: true } },
      _count: { select: { produits: true } },
      kyc: true,
    },
  });
}

export async function getVendeurDetail(vendeurId: string) {
  return prisma.vendeur.findUnique({
    where: { id: vendeurId },
    include: {
      utilisateur: { select: { nom: true, email: true, telephone: true } },
      kyc: true,
      _count: { select: { produits: true, lignesCommande: true } },
    },
  });
}

export type ResultatVendeur =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "STATUT_INVALIDE" };

/**
 * Depuis la liste, l'administrateur ne peut que suspendre une boutique.
 * L'activation et le rejet doivent passer par le workflow KYC dédié, qui
 * met à jour le statut du dossier et celui de la boutique dans une transaction.
 */
export async function changerStatutVendeur(
  vendeurId: string,
  statut: StatutVendeur,
): Promise<ResultatVendeur> {
  if (statut !== "SUSPENDU") {
    return { ok: false, code: "STATUT_INVALIDE" };
  }
  const vendeur = await prisma.vendeur.findUnique({ where: { id: vendeurId } });
  if (!vendeur) return { ok: false, code: "INTROUVABLE" };
  await prisma.vendeur.update({
    where: { id: vendeurId },
    data: { statutValidation: "SUSPENDU" },
  });
  return { ok: true };
}
