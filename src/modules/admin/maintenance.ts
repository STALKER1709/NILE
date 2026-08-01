import { prisma } from "@/lib/db";
import { getAuthProvider } from "@/modules/auth";

/**
 * Purges globales de la plateforme. Opérations IRRÉVERSIBLES, réservées à
 * l'administrateur et protégées par une phrase à recopier (voir
 * `suppression-core`).
 *
 * Deux niveaux, volontairement distincts :
 *  - `purgerHistorique` efface l'activité (commandes, avis, règlements…) et
 *    conserve le catalogue et les comptes : c'est la remise à zéro d'avant
 *    lancement, quand on veut repartir d'un historique vierge sans tout
 *    reconstruire.
 *  - `reinitialiserPlateforme` efface en plus les produits, les boutiques et
 *    les comptes, à l'exception de l'administrateur qui déclenche l'action.
 *
 * L'ordre des suppressions suit les clés étrangères : les écritures qui en
 * référencent d'autres partent en premier.
 */

export interface ApercuPurge {
  commandes: number;
  avis: number;
  reversements: number;
  promotions: number;
  annonces: number;
  lignesPanier: number;
  produits: number;
  vendeurs: number;
  utilisateursSupprimables: number;
}

/** Ce que les purges effaceraient, pour l'afficher AVANT de les déclencher. */
export async function apercuPurge(adminId: string): Promise<ApercuPurge> {
  const [
    commandes, avis, reversements, promotions, annonces,
    lignesPanier, produits, vendeurs, utilisateursSupprimables,
  ] = await Promise.all([
    prisma.commande.count(),
    prisma.avis.count(),
    prisma.reversement.count(),
    prisma.promotion.count(),
    prisma.annonce.count(),
    prisma.lignePanier.count(),
    prisma.produit.count(),
    prisma.vendeur.count(),
    prisma.utilisateur.count({ where: { id: { not: adminId } } }),
  ]);
  return {
    commandes, avis, reversements, promotions, annonces,
    lignesPanier, produits, vendeurs, utilisateursSupprimables,
  };
}

export interface ResumePurge {
  commandes: number;
  avis: number;
  reversements: number;
  promotions: number;
  annonces: number;
  lignesPanier: number;
  produits?: number;
  utilisateurs?: number;
}

/**
 * Efface toute l'activité : commandes (et, en cascade, leurs lignes,
 * paiements et livraisons), avis, reversements, promotions, annonces et
 * paniers. Le catalogue, les comptes et la configuration restent en place.
 */
export async function purgerHistorique(): Promise<ResumePurge> {
  // Hors transaction : sur un jeu de données important, une transaction
  // unique tiendrait trop longtemps un verrou. Chaque étape est
  // indépendante et l'ordre respecte les contraintes.
  const avis = await prisma.avis.deleteMany({});
  const reversements = await prisma.reversement.deleteMany({});
  const commandes = await prisma.commande.deleteMany({});
  const promotions = await prisma.promotion.deleteMany({});
  const annonces = await prisma.annonce.deleteMany({});
  const lignesPanier = await prisma.lignePanier.deleteMany({});
  await prisma.evenementAbus.deleteMany({});

  return {
    commandes: commandes.count,
    avis: avis.count,
    reversements: reversements.count,
    promotions: promotions.count,
    annonces: annonces.count,
    lignesPanier: lignesPanier.count,
  };
}

/**
 * Réinitialisation complète : l'activité, puis le catalogue et les comptes.
 * L'administrateur qui déclenche l'opération est conservé — sans lui, plus
 * personne ne pourrait administrer la plateforme.
 *
 * Les catégories et la configuration sont préservées : ce sont des réglages
 * de structure, pas des données d'exploitation.
 */
export async function reinitialiserPlateforme(adminId: string): Promise<ResumePurge> {
  const historique = await purgerHistorique();

  // Identités d'authentification des comptes sur le point de disparaître :
  // à retirer AVANT, tant qu'on connaît encore leurs identifiants.
  const aSupprimer = await prisma.utilisateur.findMany({
    where: { id: { not: adminId } },
    select: { id: true },
  });

  const produits = await prisma.produit.deleteMany({});
  await prisma.vendeur.deleteMany({ where: { utilisateurId: { not: adminId } } });
  const utilisateurs = await prisma.utilisateur.deleteMany({
    where: { id: { not: adminId } },
  });

  const auth = getAuthProvider();
  for (const u of aSupprimer) {
    await auth
      .deleteIdentity(u.id)
      .catch((e) => console.error("[admin] identité non supprimée:", u.id, e));
    await prisma.mockCredential.deleteMany({ where: { authId: u.id } }).catch(() => undefined);
  }

  return { ...historique, produits: produits.count, utilisateurs: utilisateurs.count };
}
