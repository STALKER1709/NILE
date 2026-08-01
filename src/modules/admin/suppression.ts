import { prisma } from "@/lib/db";
import { getAuthProvider } from "@/modules/auth";
import { getStorageProvider } from "@/modules/stockage";
import {
  modeSuppressionProduit,
  modeSuppressionUtilisateur,
  verifierSuppressionCompte,
  donneesAnonymisation,
  type ModeSuppression,
} from "@/modules/admin/suppression-core";

/**
 * Suppressions administrateur, avec repli automatique.
 *
 * Rien de ce qui documente une vente n'est jamais effacé : ni une ligne de
 * commande, ni un reversement. Quand la suppression franche est impossible,
 * on retire de la vue (corbeille) ou on vide les données personnelles
 * (anonymisation) — sans casser la piste d'audit.
 */

export type ResultatSuppressionProduit =
  | { ok: true; mode: ModeSuppression }
  | { ok: false; code: "INTROUVABLE" };

export async function supprimerProduitAdmin(
  produitId: string,
): Promise<ResultatSuppressionProduit> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    include: {
      images: true,
      _count: { select: { lignesCommande: true } },
    },
  });
  if (!produit) return { ok: false, code: "INTROUVABLE" };

  const mode = modeSuppressionProduit(produit._count.lignesCommande);

  if (mode === "CORBEILLE") {
    // Le produit figure dans des commandes : on le retire de la vente sans
    // toucher à l'historique, exactement comme la corbeille vendeur.
    await prisma.produit.update({
      where: { id: produitId },
      data: { statut: "SUPPRIME" },
    });
    return { ok: true, mode };
  }

  await prisma.produit.delete({ where: { id: produitId } });

  // Fichiers image : nettoyage au mieux, après la suppression en base. Un
  // échec ici laisse un fichier orphelin, jamais une base incohérente.
  const storage = getStorageProvider();
  for (const image of produit.images) {
    if (image.chemin) {
      await storage.supprimer(image.chemin).catch((e) => {
        console.error("[admin] suppression du fichier image échouée:", e);
      });
    }
  }
  return { ok: true, mode };
}

export type ResultatSuppressionCompte =
  | { ok: true; mode: ModeSuppression }
  | { ok: false; code: "INTROUVABLE" | "SOI_MEME" | "DERNIER_ADMIN" };

/**
 * Supprime un compte, ou l'anonymise s'il porte un historique de vente.
 *
 * Dans les deux cas l'identité d'authentification est retirée : le compte ne
 * doit plus permettre de se connecter, sinon « supprimer » ne voudrait rien
 * dire du point de vue de l'utilisateur.
 */
export async function supprimerUtilisateurAdmin(
  adminId: string,
  utilisateurId: string,
): Promise<ResultatSuppressionCompte> {
  const cible = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: {
      _count: { select: { commandes: true, avis: true } },
      vendeur: {
        select: { id: true, _count: { select: { lignesCommande: true, reversements: true } } },
      },
    },
  });
  if (!cible) return { ok: false, code: "INTROUVABLE" };

  const nbAdmins = await prisma.utilisateur.count({ where: { role: "ADMIN" } });
  const decision = verifierSuppressionCompte({
    adminId,
    cibleId: utilisateurId,
    cibleEstAdmin: cible.role === "ADMIN",
    nbAdmins,
  });
  if (!decision.ok) return { ok: false, code: decision.code };

  const mode = modeSuppressionUtilisateur({
    nbCommandes: cible._count.commandes,
    nbAvis: cible._count.avis,
    nbLignesVendues: cible.vendeur?._count.lignesCommande ?? 0,
    nbReversements: cible.vendeur?._count.reversements ?? 0,
  });

  if (mode === "ANONYMISATION") {
    const anonyme = donneesAnonymisation(utilisateurId);
    await prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id: utilisateurId },
        data: { ...anonyme, statut: "SUSPENDU" },
      });
      // La boutique disparaît de la vitrine, ses produits ne sont plus
      // achetables — sans effacer les lignes de commande qui les citent.
      if (cible.vendeur) {
        await tx.vendeur.update({
          where: { id: cible.vendeur.id },
          data: { nomBoutique: "Boutique supprimée", description: null, statutValidation: "SUSPENDU", infosPaiement: undefined },
        });
        await tx.produit.updateMany({
          where: { vendeurId: cible.vendeur.id, statut: { not: "SUPPRIME" } },
          data: { statut: "SUPPRIME" },
        });
      }
      // Appareils liés : plus aucune notification ne doit partir vers eux.
      await tx.abonnementPush.deleteMany({ where: { utilisateurId } });
    });
  } else {
    // Aucun historique : les cascades emportent boutique, panier et
    // abonnements sans rien laisser derrière.
    await prisma.utilisateur.delete({ where: { id: utilisateurId } });
  }

  // Identité d'authentification, dans les deux cas. Best-effort : le profil
  // applicatif est déjà traité, un échec ici ne doit pas annuler l'opération.
  await getAuthProvider()
    .deleteIdentity(utilisateurId)
    .catch((e) => console.error("[admin] suppression de l'identité échouée:", e));
  await prisma.mockCredential
    .deleteMany({ where: { authId: utilisateurId } })
    .catch(() => undefined);

  return { ok: true, mode };
}
