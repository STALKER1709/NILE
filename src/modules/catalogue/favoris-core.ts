/**
 * Logique PURE de la liste de souhaits (testable sans base).
 *
 * Un favori vieillit : l'article peut avoir été retiré de la vente, sa
 * boutique suspendue, ou son stock parti. Ces trois situations ne se disent
 * pas de la même façon à l'acheteur, et surtout elles ne se valent pas — un
 * article épuisé peut revenir, un article retiré non.
 */

export type EtatFavori =
  /** Achetable ici et maintenant. */
  | "DISPONIBLE"
  /** Toujours en vente, mais plus une unité en stock. */
  | "EPUISE"
  /** Retiré de la vente, ou boutique non validée. */
  | "RETIRE";

export function etatFavori(article: {
  /** Produit ACTIF ET boutique VALIDÉE. */
  achetable: boolean;
  /** Stock toutes déclinaisons actives confondues. */
  stock: number;
}): EtatFavori {
  // L'ordre compte : un article retiré de la vente est à zéro de stock aussi,
  // et « Épuisé » laisserait espérer un réassort qui ne viendra pas.
  if (!article.achetable) return "RETIRE";
  return article.stock > 0 ? "DISPONIBLE" : "EPUISE";
}

/**
 * Ce qui est affiché sous le titre. Rien quand tout va bien : une pastille
 * « Disponible » sur chaque ligne n'apprendrait rien et noierait les deux
 * lignes qui, elles, demandent une décision.
 */
export function messageEtatFavori(etat: EtatFavori): string | null {
  if (etat === "EPUISE") return "Épuisé pour le moment";
  if (etat === "RETIRE") return "Plus disponible à la vente";
  return null;
}

/**
 * L'article peut-il être mis au panier depuis la liste de souhaits ?
 *
 * Un article décliné n'a pas de déclinaison par défaut : sa taille se choisit
 * sur la fiche produit, la liste de souhaits renvoie donc vers elle plutôt que
 * de proposer un ajout qui serait refusé.
 */
export type ActionFavori = "AJOUTER" | "CHOISIR" | "AUCUNE";

export function actionFavori(article: {
  achetable: boolean;
  stock: number;
  /** Déclinaison unique de l'article, ou `null` s'il est décliné. */
  varianteId: string | null;
}): ActionFavori {
  if (etatFavori(article) !== "DISPONIBLE") return "AUCUNE";
  return article.varianteId ? "AJOUTER" : "CHOISIR";
}
