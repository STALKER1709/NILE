import { prisma } from "@/lib/db";
import {
  resoudreAxes,
  type AxeDeclinaison,
} from "@/modules/catalogue/variante-core";

/**
 * Axes de déclinaison applicables à des catégories, héritage compris.
 *
 * Les axes sont déclarés sur une catégorie et valent pour ses descendantes :
 * « Vêtements » porte « Taille » et « Couleur », « Vêtements > T-shirts » en
 * hérite sans avoir à les redéclarer. Sans cet héritage, chaque
 * sous-catégorie porterait sa propre liste de tailles, et elles divergeraient.
 *
 * L'arborescence est chargée EN ENTIER une fois plutôt que remontée nœud par
 * nœud : elle compte quelques dizaines de lignes, et une remontée récursive
 * ferait autant d'allers-retours en base que de niveaux, à chaque affichage de
 * fiche produit.
 */
export async function axesParCategorie(
  categorieIds: string[],
): Promise<Map<string, AxeDeclinaison[]>> {
  const resultat = new Map<string, AxeDeclinaison[]>();
  if (categorieIds.length === 0) return resultat;

  const [categories, axes] = await Promise.all([
    prisma.categorie.findMany({ select: { id: true, parentId: true } }),
    prisma.axeVariante.findMany({
      select: { categorieId: true, rang: true, libelle: true, valeurs: true },
    }),
  ]);

  const parent = new Map(categories.map((c) => [c.id, c.parentId]));
  const axesDe = new Map<string, AxeDeclinaison[]>();
  for (const a of axes) {
    const liste = axesDe.get(a.categorieId) ?? [];
    liste.push({ rang: a.rang, libelle: a.libelle, valeurs: a.valeurs });
    axesDe.set(a.categorieId, liste);
  }

  for (const id of new Set(categorieIds)) {
    // Chemin de la catégorie vers la racine. La borne de profondeur protège
    // d'un cycle introduit par erreur dans l'arborescence : mieux vaut des
    // axes manquants qu'une boucle infinie au rendu d'une page.
    const chemin: { axes: AxeDeclinaison[] }[] = [];
    let courant: string | null | undefined = id;
    for (let niveau = 0; courant && niveau < 20; niveau += 1) {
      chemin.push({ axes: axesDe.get(courant) ?? [] });
      courant = parent.get(courant) ?? null;
    }
    resultat.set(id, resoudreAxes(chemin));
  }
  return resultat;
}

/** Axes applicables à UNE catégorie. */
export async function axesDeCategorie(
  categorieId: string,
): Promise<AxeDeclinaison[]> {
  const map = await axesParCategorie([categorieId]);
  return map.get(categorieId) ?? [];
}

/* ------------------------------ Administration ------------------------------ */

export interface AxeAdmin {
  id: string;
  categorieId: string;
  rang: number;
  libelle: string;
  valeurs: string[];
}

/** Axes DÉCLARÉS par chaque catégorie — sans héritage : c'est ce qui s'édite. */
export async function axesDeclares(): Promise<Map<string, AxeAdmin[]>> {
  const axes = await prisma.axeVariante.findMany({
    orderBy: [{ categorieId: "asc" }, { rang: "asc" }],
  });
  const parCategorie = new Map<string, AxeAdmin[]>();
  for (const a of axes) {
    const liste = parCategorie.get(a.categorieId) ?? [];
    liste.push(a);
    parCategorie.set(a.categorieId, liste);
  }
  return parCategorie;
}

/**
 * Déclare ou remplace un axe d'une catégorie.
 *
 * Les valeurs sont saisies séparées par des virgules, et leur ORDRE est
 * conservé tel quel : c'est lui qui classe « S, M, L, XL » comme
 * « 36, 38, 40 », là où ni l'alphabet ni le tri numérique ne suffisent. Les
 * réordonner à notre initiative détruirait la seule information que
 * l'administrateur a fournie sur ce point.
 */
export async function declarerAxe(params: {
  categorieId: string;
  rang: number;
  libelle: string;
  valeursBrutes: string;
}): Promise<void> {
  const valeurs = [
    ...new Set(
      params.valeursBrutes
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
  const libelle = params.libelle.trim();
  if (!libelle || valeurs.length === 0) return;

  await prisma.axeVariante.upsert({
    where: {
      categorieId_rang: { categorieId: params.categorieId, rang: params.rang },
    },
    update: { libelle, valeurs },
    create: { categorieId: params.categorieId, rang: params.rang, libelle, valeurs },
  });
}

/**
 * Retire un axe d'une catégorie.
 *
 * Les déclinaisons déjà créées ne sont PAS touchées : leurs valeurs restent en
 * base, et les commandes passées gardent leur libellé figé. Supprimer un axe
 * dit « on ne propose plus ce choix », pas « ces ventes n'ont jamais eu lieu ».
 */
export async function retirerAxe(categorieId: string, rang: number): Promise<void> {
  await prisma.axeVariante.deleteMany({ where: { categorieId, rang } });
}
