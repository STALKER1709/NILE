import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Liste de souhaits de l'acheteur.
 *
 * Rattachée au PRODUIT et non à une déclinaison : on met de côté un article,
 * pas « ce t-shirt en XL bleu ». Le choix de la taille appartient au moment de
 * l'achat, quand le stock est connu — l'enregistrer des semaines à l'avance
 * n'apporterait rien et vieillirait mal.
 *
 * Un favori ne réserve aucun stock et n'engage personne.
 */

/**
 * Nombre d'articles affichés dans la liste de souhaits.
 *
 * Borné : la page charge pour chaque favori son produit, ses images, ses
 * déclinaisons et sa boutique, et une liste sans limite finirait par mettre
 * une minute à s'afficher sur une connexion mobile. Au-delà, la page le dit
 * plutôt que de tronquer en silence.
 */
export const LIMITE_FAVORIS = 100;

export type ResultatFavori =
  | { ok: true; enFavori: boolean }
  | { ok: false; code: "INTROUVABLE" };

/**
 * Ajoute ou retire un produit des favoris, et renvoie l'état APRÈS bascule.
 *
 * L'existence du produit est vérifiée d'abord : sans ce contrôle, un
 * identifiant inventé passerait par la contrainte de clé étrangère et
 * remonterait une erreur serveur là où « introuvable » suffit.
 */
export async function basculerFavori(
  utilisateurId: string,
  produitId: string,
): Promise<ResultatFavori> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { id: true },
  });
  if (!produit) return { ok: false, code: "INTROUVABLE" };

  // `deleteMany` renvoie le nombre de lignes touchées : une seule requête
  // suffit à savoir si le favori existait, au lieu de lire puis écrire.
  const { count } = await prisma.favori.deleteMany({
    where: { utilisateurId, produitId },
  });
  if (count > 0) return { ok: true, enFavori: false };

  try {
    await prisma.favori.create({ data: { utilisateurId, produitId } });
  } catch (erreur) {
    // Deux clics quasi simultanés : la contrainte d'unicité a tranché, le
    // favori existe. Ce n'est pas une erreur pour l'acheteur.
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: true, enFavori: true };
    }
    throw erreur;
  }
  return { ok: true, enFavori: true };
}

/**
 * Identifiants des produits en favori, pour cocher les cœurs d'une grille.
 *
 * Restreint aux produits affichés plutôt que de charger toute la liste : une
 * page de catalogue en montre vingt, un acheteur fidèle peut en avoir cent.
 */
export async function favorisParmi(
  utilisateurId: string | null,
  produitIds: string[],
): Promise<Set<string>> {
  if (!utilisateurId || produitIds.length === 0) return new Set();
  const lignes = await prisma.favori.findMany({
    where: { utilisateurId, produitId: { in: produitIds } },
    select: { produitId: true },
  });
  return new Set(lignes.map((l) => l.produitId));
}

export async function estEnFavori(
  utilisateurId: string | null,
  produitId: string,
): Promise<boolean> {
  if (!utilisateurId) return false;
  const favori = await prisma.favori.findUnique({
    where: { utilisateurId_produitId: { utilisateurId, produitId } },
    select: { id: true },
  });
  return favori !== null;
}

export async function compterFavoris(
  utilisateurId: string | null,
): Promise<number> {
  if (!utilisateurId) return 0;
  return prisma.favori.count({ where: { utilisateurId } });
}

/**
 * Favoris de l'acheteur, du plus récent au plus ancien.
 *
 * Les produits devenus indisponibles — retirés de la vente, boutique
 * suspendue — sont CONSERVÉS et signalés plutôt que masqués : les faire
 * disparaître sans explication donne à l'acheteur l'impression d'avoir perdu
 * sa liste. Il décide lui-même de les retirer.
 */
export async function listerFavoris(utilisateurId: string) {
  const favoris = await prisma.favori.findMany({
    where: { utilisateurId },
    orderBy: { dateCreation: "desc" },
    take: LIMITE_FAVORIS,
    include: {
      produit: {
        include: {
          images: { orderBy: { ordre: "asc" }, take: 1 },
          categorie: { select: { nom: true } },
          variantes: {
            select: { id: true, valeur1: true, valeur2: true, stock: true, actif: true },
          },
          vendeur: { select: { id: true, nomBoutique: true, statutValidation: true } },
        },
      },
    },
  });

  return favoris.map((f) => {
    const actives = f.produit.variantes.filter((v) => v.actif);
    const stock = actives.reduce((somme, v) => somme + Math.max(0, v.stock), 0);
    // Un article décliné n'a pas de déclinaison par défaut : depuis la liste
    // de souhaits, l'ajout direct n'a alors pas de sens — la taille se choisit
    // sur la fiche produit.
    const parDefaut = actives.find((v) => v.valeur1 === "" && v.valeur2 === "");
    return {
      id: f.id,
      dateCreation: f.dateCreation,
      produit: f.produit,
      stock,
      varianteId: parDefaut?.id ?? null,
      // « Achetable » reprend exactement la règle du catalogue : produit ACTIF
      // ET boutique VALIDÉE. La dupliquer ici serait la laisser diverger.
      achetable:
        f.produit.statut === "ACTIF" &&
        f.produit.vendeur.statutValidation === "VALIDE",
    };
  });
}
