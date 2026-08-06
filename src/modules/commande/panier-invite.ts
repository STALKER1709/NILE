import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { evaluerAjoutPanier } from "@/modules/catalogue/variante-core";
import {
  ajouterVarianteAuPanier,
  getQuantitesPanier,
  getQuantitesParVariante,
  compterArticlesPanier,
  type ResultatQuantitePanier,
} from "@/modules/commande/panier";

/**
 * PANIER INVITÉ : un visiteur non connecté peut remplir et consulter son
 * panier ; l'inscription n'est exigée qu'au moment de passer la commande.
 *
 * Stockage : un cookie (varianteId -> quantité), pas de ligne en base. Léger,
 * compatible serverless, expire en 30 jours. Les prix/stocks font toujours
 * foi côté base au moment de l'affichage et de la commande. À la connexion
 * ou l'inscription, le contenu est fusionné dans le vrai panier puis effacé.
 *
 * La clé est la DÉCLINAISON, comme pour le panier connecté : un visiteur doit
 * pouvoir mettre le même t-shirt en M et en XL, chacun avec son stock.
 *
 * ⚠️ L'écriture du cookie n'est possible que depuis une Server Action ou une
 * Route Handler (contrainte Next.js) — les lectures sont libres.
 */

/**
 * Nom versionné : la clé du cookie est passée du produit à la DÉCLINAISON.
 * Relire l'ancien contenu ferait compter au badge d'en-tête des articles que
 * la page panier, elle, ne saurait plus retrouver — un panier fantôme.
 */
const COOKIE_PANIER = "nile_panier_invite_v2";
/** Panier visiteur d'avant les déclinaisons : ignoré, et effacé au passage. */
const COOKIE_PANIER_HERITE = "nile_panier_invite";
const DUREE_JOURS = 30;
/**
 * Plafond de lignes, dicté par la taille d'un cookie (4 Ko) : une clé est ici
 * un UUID de 36 caractères, soit ~45 octets par ligne une fois sérialisée.
 * Trente lignes tiennent largement ; cinquante frôleraient la limite, et un
 * cookie tronqué ferait perdre le panier entier au visiteur.
 */
const MAX_LIGNES = 30;

type QuantitesInvite = Record<string, number>;

/** Lit le panier invité depuis le cookie (tolérant : contenu invalide = vide). */
export async function lireQuantitesInvite(): Promise<QuantitesInvite> {
  const store = await cookies();
  const brut = store.get(COOKIE_PANIER)?.value;
  if (!brut) return {};
  try {
    const data = JSON.parse(brut) as unknown;
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    const map: QuantitesInvite = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof k === "string" && typeof v === "number" && Number.isInteger(v) && v > 0) {
        map[k] = Math.min(v, 1000);
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function ecrireQuantitesInvite(map: QuantitesInvite): Promise<void> {
  const store = await cookies();
  // L'ancien panier ne sera jamais relu : le laisser vivre trente jours de
  // plus, c'est renvoyer deux kilo-octets inutiles à chaque requête — cher
  // payé sur une connexion mobile.
  if (store.get(COOKIE_PANIER_HERITE)) store.delete(COOKIE_PANIER_HERITE);
  if (Object.keys(map).length === 0) {
    store.delete(COOKIE_PANIER);
    return;
  }
  store.set(COOKIE_PANIER, JSON.stringify(map), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * DUREE_JOURS,
  });
}

/**
 * Charge une déclinaison si elle est réellement achetable (produit ACTIF,
 * boutique VALIDÉE). Renvoie son stock, qui seul fait foi — `Produit.stock`
 * n'est plus tenu à jour depuis les déclinaisons.
 */
async function varianteAchetable(varianteId: string) {
  return prisma.varianteProduit.findFirst({
    where: {
      id: varianteId,
      produit: {
        statut: "ACTIF",
        vendeur: { is: { statutValidation: "VALIDE" } },
      },
    },
    select: { id: true, valeur1: true, valeur2: true, stock: true, actif: true },
  });
}

/** +1 unité dans le panier invité (mêmes garde-fous que le panier connecté). */
export async function ajouterInvite(
  varianteId: string,
): Promise<ResultatQuantitePanier> {
  const variante = await varianteAchetable(varianteId);
  if (!variante) return { ok: false, code: "INDISPONIBLE" };

  const map = await lireQuantitesInvite();
  const dejaAuPanier = map[varianteId] ?? 0;
  const decision = evaluerAjoutPanier({
    variante,
    quantiteDemandee: 1,
    quantiteDejaAuPanier: dejaAuPanier,
  });
  if (decision === "INDISPONIBLE") return { ok: false, code: "INDISPONIBLE" };
  if (decision !== "OK") return { ok: false, code: "STOCK_INSUFFISANT" };
  if (!dejaAuPanier && Object.keys(map).length >= MAX_LIGNES) {
    return { ok: false, code: "STOCK_INSUFFISANT" };
  }

  const voulue = dejaAuPanier + 1;
  map[varianteId] = voulue;
  await ecrireQuantitesInvite(map);
  return { ok: true, quantite: voulue };
}

/** −1 unité dans le panier invité (à 0, la ligne disparaît). */
export async function retirerInvite(
  varianteId: string,
): Promise<ResultatQuantitePanier> {
  const map = await lireQuantitesInvite();
  const actuelle = map[varianteId] ?? 0;
  if (actuelle <= 1) {
    delete map[varianteId];
    await ecrireQuantitesInvite(map);
    return { ok: true, quantite: 0 };
  }
  map[varianteId] = actuelle - 1;
  await ecrireQuantitesInvite(map);
  return { ok: true, quantite: actuelle - 1 };
}

/**
 * Retire complètement une déclinaison du panier invité, quelle que soit sa
 * quantité (bouton « Retirer » de la page panier).
 */
export async function retirerToutInvite(varianteId: string): Promise<void> {
  const map = await lireQuantitesInvite();
  if (!(varianteId in map)) return;
  delete map[varianteId];
  await ecrireQuantitesInvite(map);
}

/** Vide le panier visiteur : supprime simplement le cookie. */
export async function viderInvite(): Promise<void> {
  await ecrireQuantitesInvite({});
}

/** Nombre total d'articles du panier invité (badge d'en-tête). */
export async function compterArticlesInvite(): Promise<number> {
  const map = await lireQuantitesInvite();
  return Object.values(map).reduce((s, q) => s + q, 0);
}

/**
 * Lignes du panier invité avec les infos produit à jour (pour la page panier).
 * Les produits devenus indisponibles sont signalés, pas cachés.
 *
 * La forme renvoyée imite celle des lignes en base (`produit`, `variante`,
 * `quantite`) pour que la page panier n'ait qu'un seul rendu à écrire.
 */
export async function getLignesInvite() {
  const map = await lireQuantitesInvite();
  const ids = Object.keys(map);
  if (ids.length === 0) return [];
  const variantes = await prisma.varianteProduit.findMany({
    where: { id: { in: ids } },
    include: {
      produit: {
        include: {
          images: { orderBy: { ordre: "asc" }, take: 1 },
          vendeur: { select: { statutValidation: true, nomBoutique: true } },
        },
      },
    },
  });
  return variantes
    .map((variante) => ({
      produit: variante.produit,
      variante,
      varianteId: variante.id,
      quantite: map[variante.id] ?? 0,
    }))
    .filter((l) => l.quantite > 0)
    .sort((a, b) => a.produit.titre.localeCompare(b.produit.titre));
}

/**
 * Quantités à afficher sur les cartes produit : panier en base si connecté,
 * panier cookie sinon. Toujours agrégées PAR PRODUIT — une carte de grille
 * montre un article, pas une taille.
 *
 * Pour le visiteur, le cookie ne connaît que des déclinaisons : une requête
 * les rattache à leur produit. Elle n'a lieu que si son panier n'est pas vide.
 */
export async function getQuantitesAffichees(
  utilisateurId: string | null,
): Promise<Record<string, number>> {
  if (utilisateurId) return getQuantitesPanier(utilisateurId);
  const map = await lireQuantitesInvite();
  const ids = Object.keys(map);
  if (ids.length === 0) return {};
  const variantes = await prisma.varianteProduit.findMany({
    where: { id: { in: ids } },
    select: { id: true, produitId: true },
  });
  const parProduit: Record<string, number> = {};
  for (const v of variantes) {
    parProduit[v.produitId] = (parProduit[v.produitId] ?? 0) + (map[v.id] ?? 0);
  }
  return parProduit;
}

/**
 * Quantités du panier visiteur PAR DÉCLINAISON, pour la fiche produit : c'est
 * la taille sélectionnée que son compteur doit suivre.
 */
export async function getQuantitesVarianteAffichees(
  utilisateurId: string | null,
  produitId: string,
): Promise<Record<string, number>> {
  if (utilisateurId) return getQuantitesParVariante(utilisateurId, produitId);
  const map = await lireQuantitesInvite();
  const ids = Object.keys(map);
  if (ids.length === 0) return {};
  const variantes = await prisma.varianteProduit.findMany({
    where: { id: { in: ids }, produitId },
    select: { id: true },
  });
  const resultat: Record<string, number> = {};
  for (const v of variantes) resultat[v.id] = map[v.id] ?? 0;
  return resultat;
}

/** Total d'articles pour le badge d'en-tête (connecté ou invité). */
export async function compterArticlesAffiches(
  utilisateurId: string | null,
): Promise<number> {
  if (utilisateurId) return compterArticlesPanier(utilisateurId);
  return compterArticlesInvite();
}

/**
 * Fusionne le panier invité dans le panier en base de l'utilisateur qui vient
 * de se connecter / s'inscrire, puis efface le cookie. Best-effort : une ligne
 * qui dépasse le stock est plafonnée par les garde-fous existants (l'ajout
 * échoue silencieusement, l'acheteur verra le stock réel dans son panier).
 */
export async function fusionnerPanierInvite(
  utilisateurId: string,
): Promise<void> {
  const map = await lireQuantitesInvite();
  const entrees = Object.entries(map);
  if (entrees.length === 0) return;
  for (const [varianteId, quantite] of entrees) {
    try {
      await ajouterVarianteAuPanier(utilisateurId, varianteId, quantite);
    } catch (erreur) {
      console.error("[panier-invite] fusion d'une ligne échouée:", erreur);
    }
  }
  await ecrireQuantitesInvite({});
}
