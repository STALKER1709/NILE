import { randomBytes } from "node:crypto";
import type { Categorie } from "@prisma/client";
import { prisma } from "@/lib/db";
import { slugifier } from "@/modules/catalogue/slug";

export type CategorieAvecEnfants = Categorie & {
  enfants: CategorieAvecEnfants[];
};

/** Toutes les catégories, triées (ordre puis nom). */
export async function listerCategories(): Promise<Categorie[]> {
  return prisma.categorie.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });
}

/** Construit l'arbre des catégories à partir de la liste plate. */
export function construireArbre(
  categories: Categorie[],
): CategorieAvecEnfants[] {
  const parId = new Map<string, CategorieAvecEnfants>();
  for (const c of categories) parId.set(c.id, { ...c, enfants: [] });

  const racines: CategorieAvecEnfants[] = [];
  for (const c of categories) {
    const noeud = parId.get(c.id)!;
    if (c.parentId && parId.has(c.parentId)) {
      parId.get(c.parentId)!.enfants.push(noeud);
    } else {
      racines.push(noeud);
    }
  }
  return racines;
}

/**
 * Renvoie l'id d'une catégorie ET de toutes ses descendantes.
 * Utilisé pour que filtrer par une catégorie parente inclue ses sous-catégories.
 * Fonction PURE (reçoit la liste complète).
 */
export function collecterIdsCategorieEtDescendants(
  racineId: string,
  toutes: Pick<Categorie, "id" | "parentId">[],
): string[] {
  const enfantsPar = new Map<string, string[]>();
  for (const c of toutes) {
    if (c.parentId) {
      const liste = enfantsPar.get(c.parentId) ?? [];
      liste.push(c.id);
      enfantsPar.set(c.parentId, liste);
    }
  }
  const resultat: string[] = [];
  const pile = [racineId];
  while (pile.length > 0) {
    const courant = pile.pop()!;
    resultat.push(courant);
    const enfants = enfantsPar.get(courant);
    if (enfants) pile.push(...enfants);
  }
  return resultat;
}

/** Aplatit l'arbre en options indentées pour un <select>. Fonction PURE. */
export function aplatirPourSelect(
  categories: Categorie[],
): { id: string; label: string }[] {
  const arbre = construireArbre(categories);
  const options: { id: string; label: string }[] = [];
  const parcourir = (noeuds: CategorieAvecEnfants[], profondeur: number) => {
    for (const n of noeuds) {
      options.push({ id: n.id, label: `${"- ".repeat(profondeur)}${n.nom}` });
      parcourir(n.enfants, profondeur + 1);
    }
  };
  parcourir(arbre, 0);
  return options;
}

/**
 * Pour chaque catégorie racine donnée, l'URL d'une image réelle d'un de ses
 * produits actifs (la catégorie elle-même ou une de ses sous-catégories).
 * Sert d'illustration aux cartes de rayon sur l'accueil : aucune image
 * n'est inventée, on réutilise le catalogue existant. Une racine sans
 * produit illustré est simplement absente du résultat.
 */
export async function imagesParRayon(
  racineIds: string[],
  toutes: Pick<Categorie, "id" | "parentId">[],
): Promise<Record<string, string>> {
  const resultats = await Promise.all(
    racineIds.map(async (racineId) => {
      const ids = collecterIdsCategorieEtDescendants(racineId, toutes);
      const produit = await prisma.produit.findFirst({
        where: { statut: "ACTIF", categorieId: { in: ids }, images: { some: {} } },
        orderBy: { dateCreation: "desc" },
        select: { images: { orderBy: { ordre: "asc" }, take: 1, select: { url: true } } },
      });
      return [racineId, produit?.images[0]?.url] as const;
    }),
  );

  const parRacine: Record<string, string> = {};
  for (const [racineId, url] of resultats) {
    if (url) parRacine[racineId] = url;
  }
  return parRacine;
}

export type ResultatCreationCategorie =
  | { ok: true; categorie: Categorie }
  | { ok: false; code: "PARENT_INTROUVABLE" | "ERREUR" };

export async function creerCategorie(input: {
  nom: string;
  parentId?: string | null;
}): Promise<ResultatCreationCategorie> {
  if (input.parentId) {
    const parent = await prisma.categorie.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) return { ok: false, code: "PARENT_INTROUVABLE" };
  }

  let slug = slugifier(input.nom) || "categorie";
  const existant = await prisma.categorie.findUnique({ where: { slug } });
  if (existant) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  try {
    const categorie = await prisma.categorie.create({
      data: { nom: input.nom, slug, parentId: input.parentId ?? null },
    });
    return { ok: true, categorie };
  } catch {
    return { ok: false, code: "ERREUR" };
  }
}

export interface EntreeNavigation {
  id: string;
  nom: string;
  slug: string;
  /** 0 = rayon, 1 = sous-catégorie dépliée sous son rayon. */
  niveau: number;
  actif: boolean;
}

/**
 * Liste de navigation du catalogue : les RAYONS seulement, et sous le rayon
 * ouvert, ses sous-catégories.
 *
 * Aplatir toute l'arborescence donnait une colonne interminable où rayons et
 * sous-catégories se mélangeaient, distingués par un simple tiret. Sur un
 * téléphone, l'acheteur faisait défiler une liste dont l'essentiel ne le
 * concernait pas.
 *
 * Le dépliage est progressif et sans JavaScript : ce sont des liens, chaque
 * choix recharge la page avec la branche ouverte. Choisir une sous-catégorie
 * laisse son rayon déplié — sinon l'acheteur perdrait le contexte dans lequel
 * il vient de descendre, et ne pourrait pas passer à une sœur sans remonter.
 */
export function navigationCategories(
  categories: Pick<Categorie, "id" | "nom" | "slug" | "parentId" | "ordre">[],
  slugActif?: string,
): EntreeNavigation[] {
  const parOrdre = <T extends { ordre: number; nom: string }>(a: T, b: T) =>
    a.ordre !== b.ordre ? a.ordre - b.ordre : a.nom.localeCompare(b.nom, "fr");

  const active = slugActif
    ? categories.find((c) => c.slug === slugActif)
    : undefined;
  // La branche à déplier : le rayon lui-même, ou celui de la sous-catégorie
  // choisie.
  const brancheOuverte = active
    ? (active.parentId ?? active.id)
    : null;

  const entree = (
    c: Pick<Categorie, "id" | "nom" | "slug">,
    niveau: number,
  ): EntreeNavigation => ({
    id: c.id,
    nom: c.nom,
    slug: c.slug,
    niveau,
    actif: c.slug === slugActif,
  });

  const sortie: EntreeNavigation[] = [];
  for (const racine of categories.filter((c) => !c.parentId).sort(parOrdre)) {
    sortie.push(entree(racine, 0));
    if (racine.id !== brancheOuverte) continue;
    for (const enfant of categories
      .filter((c) => c.parentId === racine.id)
      .sort(parOrdre)) {
      sortie.push(entree(enfant, 1));
    }
  }
  return sortie;
}
