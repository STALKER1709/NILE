import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { stockSuffisant } from "@/modules/commande/commande-core";
import {
  ajouterAuPanier,
  getQuantitesPanier,
  compterArticlesPanier,
  type ResultatQuantitePanier,
} from "@/modules/commande/panier";

/**
 * PANIER INVITÉ : un visiteur non connecté peut remplir et consulter son
 * panier ; l'inscription n'est exigée qu'au moment de passer la commande.
 *
 * Stockage : un cookie (produitId -> quantité), pas de ligne en base. Léger,
 * compatible serverless, expire en 30 jours. Les prix/stocks font toujours
 * foi côté base au moment de l'affichage et de la commande. À la connexion
 * ou l'inscription, le contenu est fusionné dans le vrai panier puis effacé.
 *
 * ⚠️ L'écriture du cookie n'est possible que depuis une Server Action ou une
 * Route Handler (contrainte Next.js) — les lectures sont libres.
 */

const COOKIE_PANIER = "nile_panier_invite";
const DUREE_JOURS = 30;
const MAX_LIGNES = 50;

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

/** Le produit est-il achetable (ACTIF + boutique VALIDÉE) ? Renvoie son stock. */
async function produitAchetable(produitId: string) {
  return prisma.produit.findFirst({
    where: {
      id: produitId,
      statut: "ACTIF",
      vendeur: { is: { statutValidation: "VALIDE" } },
    },
    select: { id: true, stock: true },
  });
}

/** +1 unité dans le panier invité (mêmes garde-fous que le panier connecté). */
export async function ajouterInvite(
  produitId: string,
): Promise<ResultatQuantitePanier> {
  const produit = await produitAchetable(produitId);
  if (!produit) return { ok: false, code: "INDISPONIBLE" };

  const map = await lireQuantitesInvite();
  const voulue = (map[produitId] ?? 0) + 1;
  if (!stockSuffisant(produit.stock, voulue)) {
    return { ok: false, code: "STOCK_INSUFFISANT" };
  }
  if (!map[produitId] && Object.keys(map).length >= MAX_LIGNES) {
    return { ok: false, code: "STOCK_INSUFFISANT" };
  }
  map[produitId] = voulue;
  await ecrireQuantitesInvite(map);
  return { ok: true, quantite: voulue };
}

/** −1 unité dans le panier invité (à 0, la ligne disparaît). */
export async function retirerInvite(
  produitId: string,
): Promise<ResultatQuantitePanier> {
  const map = await lireQuantitesInvite();
  const actuelle = map[produitId] ?? 0;
  if (actuelle <= 1) {
    delete map[produitId];
    await ecrireQuantitesInvite(map);
    return { ok: true, quantite: 0 };
  }
  map[produitId] = actuelle - 1;
  await ecrireQuantitesInvite(map);
  return { ok: true, quantite: actuelle - 1 };
}

/** Nombre total d'articles du panier invité (badge d'en-tête). */
export async function compterArticlesInvite(): Promise<number> {
  const map = await lireQuantitesInvite();
  return Object.values(map).reduce((s, q) => s + q, 0);
}

/**
 * Lignes du panier invité avec les infos produit à jour (pour la page panier).
 * Les produits devenus indisponibles sont signalés, pas cachés.
 */
export async function getLignesInvite() {
  const map = await lireQuantitesInvite();
  const ids = Object.keys(map);
  if (ids.length === 0) return [];
  const produits = await prisma.produit.findMany({
    where: { id: { in: ids } },
    include: {
      images: { orderBy: { ordre: "asc" }, take: 1 },
      vendeur: { select: { statutValidation: true, nomBoutique: true } },
    },
  });
  return produits
    .map((produit) => ({ produit, quantite: map[produit.id] ?? 0 }))
    .filter((l) => l.quantite > 0)
    .sort((a, b) => a.produit.titre.localeCompare(b.produit.titre));
}

/**
 * Quantités à afficher sur les cartes produit : panier en base si connecté,
 * panier cookie sinon.
 */
export async function getQuantitesAffichees(
  utilisateurId: string | null,
): Promise<Record<string, number>> {
  if (utilisateurId) return getQuantitesPanier(utilisateurId);
  return lireQuantitesInvite();
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
  for (const [produitId, quantite] of entrees) {
    try {
      await ajouterAuPanier(utilisateurId, produitId, quantite);
    } catch (erreur) {
      console.error("[panier-invite] fusion d'une ligne échouée:", erreur);
    }
  }
  await ecrireQuantitesInvite({});
}
