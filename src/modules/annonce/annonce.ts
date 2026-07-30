import { prisma } from "@/lib/db";
import type { AnnonceInput } from "@/validators/annonce";

/**
 * Actualités/briefs NILE à destination des vendeurs. Diffusion à SENS UNIQUE :
 * l'admin publie, les vendeurs consultent (pas de réponse) — pas de
 * messagerie interne, exclue du MVP par CLAUDE.md.
 */

/** Toutes les annonces, épinglées d'abord puis les plus récentes. */
export async function listerAnnonces() {
  return prisma.annonce.findMany({
    orderBy: [{ epinglee: "desc" }, { dateCreation: "desc" }],
  });
}

export async function creerAnnonce(input: AnnonceInput) {
  return prisma.annonce.create({ data: input });
}

export type ResultatAnnonce = { ok: true } | { ok: false; code: "INTROUVABLE" };

export async function basculerEpingleAnnonce(
  annonceId: string,
  epinglee: boolean,
): Promise<ResultatAnnonce> {
  const { count } = await prisma.annonce.updateMany({
    where: { id: annonceId },
    data: { epinglee },
  });
  return count > 0 ? { ok: true } : { ok: false, code: "INTROUVABLE" };
}

export async function supprimerAnnonce(annonceId: string): Promise<ResultatAnnonce> {
  const { count } = await prisma.annonce.deleteMany({ where: { id: annonceId } });
  return count > 0 ? { ok: true } : { ok: false, code: "INTROUVABLE" };
}
