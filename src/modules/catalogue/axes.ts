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
