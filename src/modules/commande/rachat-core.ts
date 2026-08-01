/**
 * Logique PURE du « repasser une commande » (testable sans base).
 *
 * Reprendre une ancienne commande n'est jamais une copie littérale : entre
 * temps un produit peut avoir été retiré de la vente, être en rupture, ou
 * n'être disponible qu'en quantité réduite. On ajoute donc ce qui est
 * réellement disponible et on rend compte du reste, plutôt que d'échouer en
 * bloc ou d'ajouter silencieusement une quantité fausse.
 */

export interface LigneARacheter {
  produitId: string;
  titreProduit: string;
  quantite: number;
}

/** État courant d'un produit du catalogue, au moment du rachat. */
export interface EtatProduitRachat {
  produitId: string;
  /** Absent du catalogue, supprimé, dépublié, ou boutique non validée. */
  achetable: boolean;
  stock: number;
  /** Quantité déjà présente dans le panier de l'acheteur. */
  dejaEnPanier: number;
}

export type MotifIndisponible = "INDISPONIBLE" | "RUPTURE" | "PARTIEL";

export interface LigneRachat {
  produitId: string;
  titreProduit: string;
  /** Quantité réellement ajoutable au panier (0 si rien n'est possible). */
  quantiteAjoutee: number;
  /** Quantité demandée à l'origine (celle de l'ancienne commande). */
  quantiteVoulue: number;
  motif?: MotifIndisponible;
}

export interface PlanRachat {
  aAjouter: LigneRachat[];
  problemes: LigneRachat[];
}

/**
 * Décide, ligne par ligne, ce qui peut être remis au panier.
 * La quantité ajoutable tient compte de ce qui est DÉJÀ dans le panier : le
 * total en panier ne doit jamais dépasser le stock disponible.
 */
export function planifierRachat(
  lignes: LigneARacheter[],
  etats: Map<string, EtatProduitRachat>,
): PlanRachat {
  const aAjouter: LigneRachat[] = [];
  const problemes: LigneRachat[] = [];

  for (const ligne of lignes) {
    const etat = etats.get(ligne.produitId);
    const base = {
      produitId: ligne.produitId,
      titreProduit: ligne.titreProduit,
      quantiteVoulue: ligne.quantite,
    };

    // Produit retiré du catalogue, dépublié, supprimé, boutique non validée.
    if (!etat || !etat.achetable) {
      problemes.push({ ...base, quantiteAjoutee: 0, motif: "INDISPONIBLE" });
      continue;
    }

    // Marge restante avant d'atteindre le stock, panier actuel déduit.
    const marge = Math.max(0, etat.stock - etat.dejaEnPanier);
    if (marge === 0) {
      problemes.push({ ...base, quantiteAjoutee: 0, motif: "RUPTURE" });
      continue;
    }

    const quantiteAjoutee = Math.min(ligne.quantite, marge);
    if (quantiteAjoutee < ligne.quantite) {
      // Partiel : on ajoute quand même ce qui passe, et on le signale.
      const partielle = { ...base, quantiteAjoutee, motif: "PARTIEL" as const };
      aAjouter.push(partielle);
      problemes.push(partielle);
      continue;
    }

    aAjouter.push({ ...base, quantiteAjoutee });
  }

  return { aAjouter, problemes };
}

/** Message lisible récapitulant ce qui n'a pas pu être ajouté tel quel. */
export function messageProblemesRachat(problemes: LigneRachat[]): string | null {
  if (problemes.length === 0) return null;

  const morceaux = problemes.map((p) => {
    if (p.motif === "PARTIEL") {
      return `${p.titreProduit} (${p.quantiteAjoutee} sur ${p.quantiteVoulue} seulement)`;
    }
    if (p.motif === "RUPTURE") return `${p.titreProduit} (en rupture)`;
    return `${p.titreProduit} (retiré de la vente)`;
  });

  return `Articles non repris à l'identique : ${morceaux.join(", ")}.`;
}
