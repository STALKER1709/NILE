/**
 * Logique PURE des déclinaisons d'un produit (testable sans base).
 *
 * Un vêtement se vend par taille et par couleur, chaque combinaison ayant son
 * propre stock. Tout ce qui décide de ce que l'acheteur peut choisir vit ici :
 * l'écran ne fait que l'afficher, et le serveur s'y réfère au moment de
 * décrémenter.
 */

/** Une déclinaison telle que la base la connaît. */
export interface Variante {
  id: string;
  taille: string;
  couleur: string;
  stock: number;
  actif: boolean;
}

/**
 * Ordre d'affichage des tailles.
 *
 * Sans lui, un tri alphabétique donnerait « L, M, S, XL », ce qu'aucun
 * acheteur ne lit correctement. Les tailles inconnues (chiffres, tailles
 * spécifiques d'un vendeur) sont rejetées à la fin, triées entre elles.
 */
const ORDRE_TAILLES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function rangTaille(taille: string): number {
  const i = ORDRE_TAILLES.indexOf(taille.trim().toUpperCase());
  return i === -1 ? ORDRE_TAILLES.length : i;
}

export function trierTailles(tailles: string[]): string[] {
  return [...tailles].sort((a, b) => {
    const ra = rangTaille(a);
    const rb = rangTaille(b);
    // À rang égal — deux tailles hors barème — on retombe sur l'ordre naturel,
    // qui vaut mieux qu'un ordre d'insertion arbitraire.
    return ra !== rb ? ra - rb : a.localeCompare(b, "fr");
  });
}

/** Une déclinaison est-elle proposable à l'achat ? */
export function varianteDisponible(v: Variante): boolean {
  return v.actif && v.stock > 0;
}

/**
 * Le produit a-t-il des déclinaisons à proposer, ou une seule façon d'être
 * acheté ?
 *
 * Tout produit possède au moins une variante ; celle des produits sans taille
 * ni couleur porte deux chaînes vides. Dans ce cas, aucun sélecteur ne doit
 * apparaître à l'écran — il n'y aurait rien à choisir.
 */
export function aDesDeclinaisons(variantes: Variante[]): boolean {
  return variantes.some((v) => v.taille !== "" || v.couleur !== "");
}

/** Stock total, tous axes confondus : ce qui décide du « épuisé » global. */
export function stockTotal(variantes: Variante[]): number {
  return variantes
    .filter((v) => v.actif)
    .reduce((somme, v) => somme + Math.max(0, v.stock), 0);
}

export interface OptionsDeclinaison {
  /** Tailles proposées, triées dans l'ordre des vêtements. */
  tailles: string[];
  /** Couleurs proposées, dans l'ordre alphabétique français. */
  couleurs: string[];
}

/**
 * Ce que l'acheteur peut choisir.
 *
 * Les axes sont listés depuis les variantes ACTIVES seulement, épuisées
 * comprises : une taille en rupture doit rester visible et grisée, sinon
 * l'acheteur ne comprend pas pourquoi son choix a disparu et croit à un bug.
 */
export function optionsDeclinaison(variantes: Variante[]): OptionsDeclinaison {
  const actives = variantes.filter((v) => v.actif);
  const tailles = [...new Set(actives.map((v) => v.taille).filter(Boolean))];
  const couleurs = [...new Set(actives.map((v) => v.couleur).filter(Boolean))];
  return {
    tailles: trierTailles(tailles),
    couleurs: couleurs.sort((a, b) => a.localeCompare(b, "fr")),
  };
}

/**
 * Retrouve la déclinaison correspondant à un choix.
 *
 * Les axes absents du produit sont comparés à la chaîne vide, ce qui permet de
 * traiter de la même façon un t-shirt (taille + couleur), un article décliné
 * sur un seul axe, et un produit sans déclinaison.
 */
export function trouverVariante(
  variantes: Variante[],
  choix: { taille?: string; couleur?: string },
): Variante | null {
  const taille = choix.taille ?? "";
  const couleur = choix.couleur ?? "";
  return (
    variantes.find((v) => v.taille === taille && v.couleur === couleur) ?? null
  );
}

/**
 * Les couleurs réellement disponibles pour une taille donnée.
 *
 * Un vendeur ne tient pas forcément toutes les combinaisons : il peut avoir du
 * bleu en M et en L, mais du rouge en M seulement. Sans ce filtrage, l'acheteur
 * choisirait « L + rouge » et se ferait refuser au panier.
 */
export function couleursPourTaille(
  variantes: Variante[],
  taille: string,
): string[] {
  return variantes
    .filter((v) => v.actif && v.taille === taille && varianteDisponible(v))
    .map((v) => v.couleur)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr"));
}

export type DecisionAjoutPanier =
  | "OK"
  /** Aucune déclinaison ne correspond au choix reçu. */
  | "INTROUVABLE"
  /** Déclinaison retirée de la vente par le vendeur. */
  | "INDISPONIBLE"
  | "STOCK_INSUFFISANT";

/**
 * Ce choix peut-il être mis au panier, dans cette quantité ?
 *
 * Vérifié côté serveur à chaque ajout : l'écran a pu être rendu il y a dix
 * minutes, et le dernier XL bleu être parti entre-temps.
 */
export function evaluerAjoutPanier(params: {
  variante: Variante | null;
  quantiteDemandee: number;
  /** Déjà présent au panier pour cette même déclinaison. */
  quantiteDejaAuPanier?: number;
}): DecisionAjoutPanier {
  const { variante } = params;
  if (!variante) return "INTROUVABLE";
  if (!variante.actif) return "INDISPONIBLE";

  const total = params.quantiteDemandee + (params.quantiteDejaAuPanier ?? 0);
  if (total <= 0) return "STOCK_INSUFFISANT";
  // Le stock déjà réservé dans SON panier compte : sans cela, l'acheteur
  // pourrait empiler cinq fois le dernier article disponible.
  if (total > variante.stock) return "STOCK_INSUFFISANT";
  return "OK";
}

/**
 * Libellé lisible d'une déclinaison, pour l'affichage et les instantanés.
 * Chaîne vide quand le produit n'a pas de déclinaison — l'appelant n'affiche
 * alors rien plutôt qu'un séparateur orphelin.
 */
export function libelleVariante(v: {
  taille: string;
  couleur: string;
}): string {
  return [v.taille, v.couleur].filter(Boolean).join(" · ");
}
