import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  validerPromotion,
  promotionChevaucheExistantes,
  resoudreAffichagePrix,
  type AffichagePrix,
  type TypePromotion,
  type PromotionActive,
} from "@/modules/promotion/promotion-core";

/** Filtre Prisma standard : promotions non annulées et actives à l'instant `maintenant`. */
function whereActives(maintenant: Date): Prisma.PromotionWhereInput {
  return { annulee: false, dateDebut: { lte: maintenant }, dateFin: { gte: maintenant } };
}

export type ResultatPromotion =
  | { ok: true; promotionId: string }
  | {
      ok: false;
      code: "PRODUIT_INTROUVABLE" | "VALEUR_INVALIDE" | "PERIODE_INVALIDE" | "PRIX_INSUFFISANT" | "CHEVAUCHEMENT";
    };

export interface CreerPromotionInput {
  produitId: string | null;
  type: TypePromotion;
  valeur: number;
  dateDebut: Date;
  dateFin: Date;
}

/**
 * Crée une promotion pour un vendeur, sur un produit précis (`produitId`) ou
 * sur toute sa boutique (`produitId` null). Vérifie l'appartenance du produit,
 * la validité des paramètres et l'absence de chevauchement avec une autre
 * promotion déjà active sur la MÊME cible.
 */
export async function creerPromotion(
  vendeurId: string,
  input: CreerPromotionInput,
): Promise<ResultatPromotion> {
  let prixReference: number | undefined;
  if (input.produitId) {
    const produit = await prisma.produit.findUnique({
      where: { id: input.produitId },
      select: { vendeurId: true, prix: true },
    });
    if (!produit || produit.vendeurId !== vendeurId) {
      return { ok: false, code: "PRODUIT_INTROUVABLE" };
    }
    prixReference = produit.prix;
  }

  const maintenant = new Date();
  const decision = validerPromotion({
    type: input.type,
    valeur: input.valeur,
    dateDebut: input.dateDebut,
    dateFin: input.dateFin,
    maintenant,
    prixReference,
  });
  if (!decision.ok) return { ok: false, code: decision.code };

  const existantes = await prisma.promotion.findMany({
    where: { vendeurId, produitId: input.produitId, annulee: false },
    select: { dateDebut: true, dateFin: true },
  });
  if (promotionChevaucheExistantes({ dateDebut: input.dateDebut, dateFin: input.dateFin }, existantes)) {
    return { ok: false, code: "CHEVAUCHEMENT" };
  }

  const cree = await prisma.promotion.create({
    data: {
      vendeurId,
      produitId: input.produitId,
      type: input.type,
      valeur: input.valeur,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin,
    },
  });
  return { ok: true, promotionId: cree.id };
}

/** Promotions d'un vendeur, les plus récentes d'abord, avec le titre du produit ciblé. */
export async function listerPromotionsVendeur(vendeurId: string) {
  return prisma.promotion.findMany({
    where: { vendeurId },
    orderBy: { dateCreation: "desc" },
    include: { produit: { select: { titre: true, slug: true, prix: true } } },
  });
}

export type ResultatAnnulation =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" };

/** Annule une promotion (ownership vérifiée) : ne la supprime pas, la désactive. */
export async function annulerPromotion(
  vendeurId: string,
  promotionId: string,
): Promise<ResultatAnnulation> {
  const { count } = await prisma.promotion.updateMany({
    where: { id: promotionId, vendeurId },
    data: { annulee: true },
  });
  return count > 0 ? { ok: true } : { ok: false, code: "INTROUVABLE" };
}

function versPromotionActive(p: {
  id: string;
  produitId: string | null;
  type: TypePromotion;
  valeur: number;
  dateDebut: Date;
  dateFin: Date;
  annulee: boolean;
}): PromotionActive {
  return p;
}

/**
 * Charge, pour un ensemble de produits (même vendeur ou vendeurs mêlés), les
 * promotions actives applicables (produit + boutique) et renvoie une carte
 * `produitId -> AffichagePrix`. Une seule requête, quel que soit le nombre de
 * produits — pensé pour enrichir des grilles catalogue/vitrine.
 */
export async function chargerAffichagePrixPourProduits(
  produits: { id: string; prix: number; vendeurId: string }[],
): Promise<Map<string, AffichagePrix>> {
  const resultat = new Map<string, AffichagePrix>();
  if (produits.length === 0) return resultat;

  const maintenant = new Date();
  const vendeurIds = [...new Set(produits.map((p) => p.vendeurId))];
  const produitIds = produits.map((p) => p.id);

  const promotions = await prisma.promotion.findMany({
    where: {
      ...whereActives(maintenant),
      vendeurId: { in: vendeurIds },
      OR: [{ produitId: { in: produitIds } }, { produitId: null }],
    },
  });

  const parProduit = new Map<string, PromotionActive>();
  const parBoutique = new Map<string, PromotionActive>();
  for (const p of promotions) {
    const active = versPromotionActive(p);
    if (p.produitId) parProduit.set(p.produitId, active);
    else parBoutique.set(p.vendeurId, active);
  }

  for (const produit of produits) {
    resultat.set(
      produit.id,
      resoudreAffichagePrix(
        produit.prix,
        parProduit.get(produit.id) ?? null,
        parBoutique.get(produit.vendeurId) ?? null,
        maintenant,
      ),
    );
  }
  return resultat;
}

/** Ce qu'une carte de grille doit savoir des déclinaisons d'un article. */
export interface InfosCarteVariante {
  /**
   * Stock réellement disponible, toutes déclinaisons actives confondues.
   * `Produit.stock` n'est plus tenu à jour : le lire afficherait « en stock »
   * sur un article épuisé.
   */
  stock: number;
  /**
   * Déclinaison à mettre au panier en un clic, ou `null` quand l'article est
   * décliné — il faut alors passer par la fiche produit pour choisir sa
   * taille. Une grille ne peut pas faire ce choix à la place de l'acheteur.
   */
  varianteId: string | null;
}

/**
 * Enrichit une liste de produits (déjà chargée pour l'affichage en cartes)
 * avec le prix promotionnel éventuel et l'état de leurs déclinaisons.
 *
 * Ne modifie pas `prix` : ajoute `prixPromo`/`pourcentageReduction`, `null` si
 * aucune promotion active. En revanche `stock` est REMPLACÉ par le stock des
 * déclinaisons, seul à jour.
 */
export async function enrichirProduitsPourCartes<
  T extends { id: string; prix: number; vendeurId: string },
>(
  produits: T[],
): Promise<
  (T & { prixPromo: number | null; pourcentageReduction: number | null } & InfosCarteVariante)[]
> {
  const [affichages, variantes] = await Promise.all([
    chargerAffichagePrixPourProduits(produits),
    produits.length === 0
      ? Promise.resolve([])
      : prisma.varianteProduit.findMany({
          where: { produitId: { in: produits.map((p) => p.id) } },
          select: {
            id: true,
            produitId: true,
            valeur1: true,
            valeur2: true,
            stock: true,
            actif: true,
          },
        }),
  ]);

  const parProduit = new Map<string, typeof variantes>();
  for (const v of variantes) {
    const liste = parProduit.get(v.produitId) ?? [];
    liste.push(v);
    parProduit.set(v.produitId, liste);
  }

  return produits.map((p) => {
    const a = affichages.get(p.id);
    const liste = parProduit.get(p.id) ?? [];
    const actives = liste.filter((v) => v.actif);
    const parDefaut = actives.find((v) => v.valeur1 === "" && v.valeur2 === "");
    return {
      ...p,
      prixPromo: a?.prixPromo ?? null,
      pourcentageReduction: a?.pourcentageReduction ?? null,
      stock: actives.reduce((somme, v) => somme + Math.max(0, v.stock), 0),
      // Un article décliné n'a PAS de déclinaison par défaut (le vendeur la
      // perd dès sa première taille) : `parDefaut` est alors absent, et la
      // carte proposera « Choisir » au lieu d'« Ajouter ».
      varianteId: parDefaut?.id ?? null,
    };
  });
}

/** Affichage prix pour UN produit (fiche produit). */
export async function getAffichagePrixProduit(produit: {
  id: string;
  prix: number;
  vendeurId: string;
}): Promise<AffichagePrix> {
  const carte = await chargerAffichagePrixPourProduits([produit]);
  return carte.get(produit.id) as AffichagePrix;
}

/**
 * Prix effectif d'un produit AU SEIN d'une transaction Prisma (checkout) :
 * relit les promotions actives sous la même connexion, pour que le prix
 * capturé dans `LigneCommande.prixUnitaire` reflète bien la réduction en
 * vigueur au moment du paiement, pas seulement à l'affichage du panier.
 */
export async function resoudrePrixEffectifTx(
  tx: Prisma.TransactionClient,
  produit: { id: string; prix: number; vendeurId: string },
): Promise<number> {
  const maintenant = new Date();
  const [promoProduit, promoBoutique] = await Promise.all([
    tx.promotion.findFirst({
      where: { produitId: produit.id, ...whereActives(maintenant) },
    }),
    tx.promotion.findFirst({
      where: { vendeurId: produit.vendeurId, produitId: null, ...whereActives(maintenant) },
    }),
  ]);
  const affichage = resoudreAffichagePrix(
    produit.prix,
    promoProduit ? versPromotionActive(promoProduit) : null,
    promoBoutique ? versPromotionActive(promoBoutique) : null,
    maintenant,
  );
  return affichage.prixPromo ?? produit.prix;
}

/**
 * Tous les produits actuellement en promotion active (produit ou boutique),
 * achetables (ACTIF + boutique validée), pour la section publique /promotions.
 */
export async function listerProduitsEnPromotion(options: { page: number; parPage: number }) {
  const maintenant = new Date();
  const page = Math.max(1, options.page);

  // Vendeurs et produits couverts par une promotion active : deux ensembles
  // (cible produit, cible boutique) fusionnés en un where produit unique.
  const promosActives = await prisma.promotion.findMany({
    where: whereActives(maintenant),
    select: { produitId: true, vendeurId: true },
  });
  const produitIds = promosActives.filter((p) => p.produitId).map((p) => p.produitId as string);
  const vendeurIdsBoutique = promosActives.filter((p) => !p.produitId).map((p) => p.vendeurId);

  if (produitIds.length === 0 && vendeurIdsBoutique.length === 0) {
    return { produits: [], total: 0, page, pages: 1 };
  }

  const where: Prisma.ProduitWhereInput = {
    statut: "ACTIF",
    vendeur: { is: { statutValidation: "VALIDE" } },
    OR: [
      ...(produitIds.length ? [{ id: { in: produitIds } }] : []),
      ...(vendeurIdsBoutique.length ? [{ vendeurId: { in: vendeurIdsBoutique } }] : []),
    ],
  };

  const [produits, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      orderBy: { dateMaj: "desc" },
      skip: (page - 1) * options.parPage,
      take: options.parPage,
      include: {
        images: { orderBy: { ordre: "asc" }, take: 1 },
        vendeur: { select: { id: true, nomBoutique: true } },
      },
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    produits: await enrichirProduitsPourCartes(produits),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / options.parPage)),
  };
}
