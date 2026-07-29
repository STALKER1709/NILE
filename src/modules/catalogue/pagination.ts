/**
 * Logique PURE de la pagination numérotée (testable sans I/O).
 *
 * On affiche toujours la première et la dernière page, une fenêtre autour de
 * la page courante, et des ellipses pour le reste. Objectif : une barre de
 * largeur constante, quel que soit le nombre de pages.
 */

/** Une entrée de la barre : un numéro de page, ou une coupure. */
export type EntreePagination = number | "ellipse";

/**
 * Construit la liste des entrées à afficher.
 *
 * @param courante page actuellement affichée (1-indexée)
 * @param total nombre total de pages
 * @param voisins nombre de pages montrées de chaque côté de la courante
 */
export function entreesPagination(
  courante: number,
  total: number,
  voisins = 1,
): EntreePagination[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const page = Math.min(Math.max(1, courante), total);
  const pages = new Set<number>([1, total]);
  for (let p = page - voisins; p <= page + voisins; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const triees = [...pages].sort((a, b) => a - b);
  const entrees: EntreePagination[] = [];
  let precedente = 0;
  for (const p of triees) {
    // Une seule page manquante : l'afficher plutôt qu'une ellipse d'un élément.
    if (precedente && p - precedente === 2) entrees.push(precedente + 1);
    else if (precedente && p - precedente > 2) entrees.push("ellipse");
    entrees.push(p);
    precedente = p;
  }
  return entrees;
}

/** Bornes lisibles « de X à Y sur N », pour le pied du tableau. */
export function bornesAffichage(
  page: number,
  parPage: number,
  total: number,
): { debut: number; fin: number } {
  if (total <= 0) return { debut: 0, fin: 0 };
  const debut = (Math.max(1, page) - 1) * parPage + 1;
  return { debut: Math.min(debut, total), fin: Math.min(debut + parPage - 1, total) };
}
