/**
 * Logique PURE des déclinaisons d'un produit (testable sans base).
 *
 * Un article peut se vendre en plusieurs versions ayant chacune son stock : un
 * t-shirt par taille et couleur, une chaussure par pointure et couleur, un
 * téléphone par capacité. Ce module ne connaît NI les tailles, NI les
 * pointures, NI les couleurs : les axes sont déclarés par la catégorie du
 * produit, et lui n'en manipule que la structure.
 *
 * C'est ce qui rend impossible de demander une télé en taille M sans qu'aucune
 * règle ne soit écrite en dur : la catégorie ne déclare pas cet axe.
 */

/** Axe déclaré par une catégorie : son nom, et ses valeurs dans leur ordre. */
export interface AxeDeclinaison {
  /** 1 = premier axe (taille, pointure, capacité), 2 = second (couleur). */
  rang: number;
  libelle: string;
  /** Valeurs autorisées, DANS L'ORDRE D'AFFICHAGE voulu. */
  valeurs: string[];
}

/** Une déclinaison telle que la base la connaît. */
export interface Variante {
  id: string;
  valeur1: string;
  valeur2: string;
  stock: number;
  actif: boolean;
}

/**
 * Résout les axes applicables à une catégorie en REMONTANT l'arborescence.
 *
 * « Vêtements > T-shirts » hérite des axes de « Vêtements » s'il n'en déclare
 * aucun : sans cet héritage, il faudrait redéclarer les tailles sur chaque
 * sous-catégorie, et elles finiraient par diverger.
 *
 * Le premier ancêtre qui déclare des axes gagne, et gagne ENTIÈREMENT : on ne
 * fusionne pas les niveaux. Une sous-catégorie qui redéclare le fait pour
 * remplacer, jamais pour compléter à moitié — un héritage partiel produirait
 * des combinaisons que personne n'a voulues.
 */
export function resoudreAxes(
  chemin: { axes: AxeDeclinaison[] }[],
): AxeDeclinaison[] {
  for (const categorie of chemin) {
    if (categorie.axes.length > 0) {
      return [...categorie.axes].sort((a, b) => a.rang - b.rang);
    }
  }
  return [];
}

/**
 * Ordonne des valeurs selon le référentiel de leur axe.
 *
 * L'ordre du référentiel fait foi : il classe « S, M, L, XL » comme
 * « 36, 38, 40 », ce que ni l'alphabet ni le tri numérique ne réussissent
 * seuls. Les valeurs absentes du référentiel — saisies avant qu'il ne change,
 * ou propres à un vendeur — sont rejetées à la fin, triées entre elles de
 * façon naturelle : « 8 » avant « 10 », et non l'inverse.
 */
export function trierSelonAxe(valeurs: string[], axe?: AxeDeclinaison): string[] {
  const reference = axe?.valeurs ?? [];
  const rang = (v: string) => {
    const i = reference.indexOf(v);
    return i === -1 ? reference.length : i;
  };
  return [...valeurs].sort((a, b) => {
    const ra = rang(a);
    const rb = rang(b);
    if (ra !== rb) return ra - rb;
    // `numeric` évite que « 10 » se retrouve avant « 8 ».
    return a.localeCompare(b, "fr", { numeric: true });
  });
}

/** Une déclinaison est-elle proposable à l'achat ? */
export function varianteDisponible(v: Variante): boolean {
  return v.actif && v.stock > 0;
}

/**
 * Le produit a-t-il quelque chose à faire choisir ?
 *
 * Tout produit possède au moins une variante ; celle d'un article sans
 * déclinaison porte deux chaînes vides. Aucun sélecteur ne doit alors
 * apparaître — il n'y aurait rien à choisir.
 */
export function aDesDeclinaisons(variantes: Variante[]): boolean {
  return variantes.some((v) => v.valeur1 !== "" || v.valeur2 !== "");
}

/** Stock total, tous axes confondus : ce qui décide du « épuisé » global. */
export function stockTotal(variantes: Variante[]): number {
  return variantes
    .filter((v) => v.actif)
    .reduce((somme, v) => somme + Math.max(0, v.stock), 0);
}

/** Valeurs proposées sur un axe, dans l'ordre de son référentiel. */
export function valeursProposees(
  variantes: Variante[],
  rang: 1 | 2,
  axe?: AxeDeclinaison,
): string[] {
  const actives = variantes.filter((v) => v.actif);
  const brutes = actives
    .map((v) => (rang === 1 ? v.valeur1 : v.valeur2))
    .filter(Boolean);
  // Les valeurs ÉPUISÉES sont conservées : une pointure en rupture doit rester
  // visible et grisée, sinon l'acheteur ne comprend pas pourquoi son choix a
  // disparu et croit à un dysfonctionnement.
  return trierSelonAxe([...new Set(brutes)], axe);
}

/**
 * Valeurs du second axe réellement disponibles pour une valeur du premier.
 *
 * Un vendeur ne tient pas forcément toutes les combinaisons : du noir en 40 et
 * en 42, du blanc en 40 seulement. Sans ce filtrage, l'acheteur choisirait
 * « 42 + blanc » et se ferait refuser au panier.
 */
export function valeur2Pour(
  variantes: Variante[],
  valeur1: string,
  axe?: AxeDeclinaison,
): string[] {
  const dispo = variantes
    .filter((v) => v.valeur1 === valeur1 && varianteDisponible(v))
    .map((v) => v.valeur2)
    .filter(Boolean);
  return trierSelonAxe([...new Set(dispo)], axe);
}

/**
 * Second axe à conserver quand l'acheteur change le premier.
 *
 * Il a choisi « 40 · Blanc », puis passe au 42, que le vendeur ne tient qu'en
 * noir : garder « Blanc » afficherait une combinaison inexistante, et l'ajout
 * au panier serait refusé sans que rien ne l'ait laissé prévoir. Le choix est
 * alors effacé, pour être refait.
 *
 * Il est en revanche CONSERVÉ quand il reste disponible : reperdre sa couleur
 * à chaque essai de taille rendrait le sélecteur épuisant.
 */
export function conserverValeur2(
  variantes: Variante[],
  valeur1: string,
  valeur2: string,
): string {
  if (!valeur2) return "";
  return valeur2Pour(variantes, valeur1).includes(valeur2) ? valeur2 : "";
}

/**
 * Retrouve la déclinaison correspondant à un choix.
 *
 * Les axes non renseignés sont comparés à la chaîne vide, ce qui traite de la
 * même façon un article à deux axes, à un seul, et un article sans
 * déclinaison.
 */
export function trouverVariante(
  variantes: Variante[],
  choix: { valeur1?: string; valeur2?: string },
): Variante | null {
  const v1 = choix.valeur1 ?? "";
  const v2 = choix.valeur2 ?? "";
  return variantes.find((v) => v.valeur1 === v1 && v.valeur2 === v2) ?? null;
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
 * minutes, et la dernière paire en 42 être partie entre-temps.
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
 * Libellé lisible d'une déclinaison — « Pointure 42 · Noir ».
 *
 * Le nom de l'axe est repris parce qu'une valeur seule ne se comprend pas :
 * « 42 » peut être une pointure, une capacité, un tour de taille. C'est ce
 * libellé qui est figé dans la ligne de commande, et il doit rester
 * déchiffrable des années plus tard, même si la catégorie a changé de nom
 * depuis.
 *
 * Chaîne vide quand l'article n'a pas de déclinaison : l'appelant n'affiche
 * alors rien, plutôt qu'un séparateur orphelin.
 */
export function libelleVariante(
  variante: { valeur1: string; valeur2: string },
  axes: AxeDeclinaison[] = [],
): string {
  const nom = (rang: number) => axes.find((a) => a.rang === rang)?.libelle;
  const morceau = (valeur: string, rang: number) => {
    if (!valeur) return null;
    const libelle = nom(rang);
    // Sans axe connu, la valeur seule vaut mieux qu'un préfixe inventé.
    return libelle ? `${libelle} ${valeur}` : valeur;
  };
  return [morceau(variante.valeur1, 1), morceau(variante.valeur2, 2)]
    .filter(Boolean)
    .join(" · ");
}

export type DecisionCombinaison =
  | "OK"
  /** Une valeur ne figure pas dans le référentiel de son axe. */
  | "VALEUR_INCONNUE"
  /** Un axe déclaré par la catégorie n'a pas été renseigné. */
  | "AXE_MANQUANT"
  /** Une valeur a été fournie sur un axe que la catégorie ne déclare pas. */
  | "AXE_INEXISTANT";

/**
 * La combinaison proposée est-elle conforme aux axes de la catégorie ?
 *
 * Vérifiée CÔTÉ SERVEUR à chaque enregistrement : les listes déroulantes du
 * formulaire ne protègent de rien, un formulaire forgé pourrait créer une
 * chaussure « taille XXL » ou un téléviseur « pointure 42 ».
 *
 * Tous les axes déclarés doivent être renseignés : une déclinaison à moitié
 * remplie créerait une combinaison qui n'existe pas en rayon, et qui entrerait
 * en collision avec la déclinaison par défaut.
 */
export function verifierCombinaison(
  axes: AxeDeclinaison[],
  valeur1: string,
  valeur2: string,
): DecisionCombinaison {
  const axe1 = axes.find((a) => a.rang === 1);
  const axe2 = axes.find((a) => a.rang === 2);

  for (const [valeur, axe] of [
    [valeur1, axe1],
    [valeur2, axe2],
  ] as const) {
    if (!axe) {
      if (valeur) return "AXE_INEXISTANT";
      continue;
    }
    if (!valeur) return "AXE_MANQUANT";
    if (!axe.valeurs.includes(valeur)) return "VALEUR_INCONNUE";
  }
  return "OK";
}
