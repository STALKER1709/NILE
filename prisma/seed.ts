import { randomUUID } from "node:crypto";
import { PrismaClient, type Role } from "@prisma/client";
import { hasherMotDePasse } from "../src/modules/auth/mock/hash";

const prisma = new PrismaClient();

/**
 * Données de démarrage pour le développement local (fournisseur d'auth "mock").
 * Idempotent : peut être relancé sans dupliquer.
 *
 * NB : les catégories ci-dessous sont des EXEMPLES pour démontrer l'arborescence.
 * Les vraies catégories de lancement sont une décision commerciale.
 */

async function creerCompteMock(params: {
  email: string;
  motDePasse: string;
  nom: string;
  telephone: string;
  role: Role;
}) {
  const existant = await prisma.utilisateur.findUnique({
    where: { email: params.email },
  });
  if (existant) return existant;

  const authId = randomUUID();
  await prisma.mockCredential.create({
    data: {
      authId,
      email: params.email,
      motDePasse: hasherMotDePasse(params.motDePasse),
    },
  });
  return prisma.utilisateur.create({
    data: {
      id: authId,
      nom: params.nom,
      telephone: params.telephone,
      email: params.email,
      role: params.role,
      panier: { create: {} },
    },
  });
}

/**
 * Produit de démonstration NON décliné.
 *
 * Sa déclinaison par défaut — deux axes vides — est créée avec lui : le panier
 * et la commande ne connaissent plus que les déclinaisons, et un produit qui
 * n'en a aucune est simplement invendable. L'oublier ici donnerait un
 * environnement de développement où plus rien ne s'achète.
 */
async function creerProduitDemo(params: {
  slug: string;
  vendeurId: string;
  categorieId: string;
  titre: string;
  description: string;
  prix: number;
  stock: number;
  marque?: string;
}) {
  const produit = await prisma.produit.upsert({
    where: { slug: params.slug },
    update: {},
    create: {
      slug: params.slug,
      vendeurId: params.vendeurId,
      categorieId: params.categorieId,
      titre: params.titre,
      description: params.description,
      prix: params.prix,
      stock: params.stock,
      marque: params.marque,
      statut: "ACTIF",
      variantes: { create: { valeur1: "", valeur2: "", stock: params.stock } },
    },
  });
  // Rejouable sur une base déjà semée, d'avant les déclinaisons : les produits
  // existants n'ont pas été touchés par l'`upsert` ci-dessus et resteraient
  // sans rien à vendre.
  const nb = await prisma.varianteProduit.count({ where: { produitId: produit.id } });
  if (nb === 0) {
    await prisma.varianteProduit.create({
      data: { produitId: produit.id, valeur1: "", valeur2: "", stock: params.stock },
    });
  }
  return produit;
}

/**
 * Produit de démonstration DÉCLINÉ (une déclinaison par combinaison).
 *
 * Il n'a volontairement PAS de déclinaison par défaut : un article décliné la
 * perd dès sa première taille, sans quoi on pourrait l'acheter « sans taille »
 * en parallèle des tailles réelles.
 */
async function creerProduitDeclineDemo(params: {
  slug: string;
  vendeurId: string;
  categorieId: string;
  titre: string;
  description: string;
  prix: number;
  marque?: string;
  /** [valeur du 1er axe, valeur du 2nd axe, stock] */
  declinaisons: [string, string, number][];
}) {
  const produit = await prisma.produit.upsert({
    where: { slug: params.slug },
    update: {},
    create: {
      slug: params.slug,
      vendeurId: params.vendeurId,
      categorieId: params.categorieId,
      titre: params.titre,
      description: params.description,
      prix: params.prix,
      marque: params.marque,
      // Champ historique, plus lu à la vente : le stock vit sur les
      // déclinaisons. Laissé à 0 pour qu'aucun écran ne s'y fie.
      stock: 0,
      statut: "ACTIF",
    },
  });
  for (const [valeur1, valeur2, stock] of params.declinaisons) {
    await prisma.varianteProduit.upsert({
      where: {
        produitId_valeur1_valeur2: { produitId: produit.id, valeur1, valeur2 },
      },
      update: {},
      create: { produitId: produit.id, valeur1, valeur2, stock },
    });
  }
  await prisma.varianteProduit.deleteMany({
    where: { produitId: produit.id, valeur1: "", valeur2: "" },
  });
  return produit;
}

async function main() {
  // --- Comptes de démonstration -------------------------------------------
  const admin = await creerCompteMock({
    email: "admin@nile.cm",
    motDePasse: "admin1234",
    nom: "Administrateur NILE",
    telephone: "+237600000000",
    role: "ADMIN",
  });

  const acheteur = await creerCompteMock({
    email: "acheteur@nile.cm",
    motDePasse: "test1234",
    nom: "Acheteur Démo",
    telephone: "+237611111111",
    role: "ACHETEUR",
  });

  const vendeurUser = await creerCompteMock({
    email: "vendeur@nile.cm",
    motDePasse: "test1234",
    nom: "Vendeur Démo",
    telephone: "+237622222222",
    role: "VENDEUR",
  });

  // Boutique du vendeur démo (validée pour pouvoir tester le catalogue).
  const boutiqueDemo = await prisma.vendeur.upsert({
    where: { utilisateurId: vendeurUser.id },
    update: {},
    create: {
      utilisateurId: vendeurUser.id,
      nomBoutique: "Boutique Démo",
      statutValidation: "VALIDE",
    },
  });

  // Compte + boutique "maison" (le stock propre de la plateforme).
  const maisonUser = await creerCompteMock({
    email: "maison@nile.cm",
    motDePasse: "test1234",
    nom: "NILE Officiel",
    telephone: "+237633333333",
    role: "VENDEUR",
  });
  const boutiqueMaison = await prisma.vendeur.upsert({
    where: { utilisateurId: maisonUser.id },
    update: {},
    create: {
      utilisateurId: maisonUser.id,
      nomBoutique: "NILE Officiel",
      statutValidation: "VALIDE",
      estBoutiqueMaison: true,
    },
  });

  // --- Catégories d'exemple (arborescence) --------------------------------
  const electronique = await prisma.categorie.upsert({
    where: { slug: "electronique" },
    update: {},
    create: { nom: "Électronique", slug: "electronique", ordre: 1 },
  });
  const telephones = await prisma.categorie.upsert({
    where: { slug: "telephones" },
    update: {},
    create: {
      nom: "Téléphones",
      slug: "telephones",
      parentId: electronique.id,
      ordre: 1,
    },
  });
  const accessoires = await prisma.categorie.upsert({
    where: { slug: "accessoires" },
    update: {},
    create: {
      nom: "Accessoires",
      slug: "accessoires",
      parentId: electronique.id,
      ordre: 2,
    },
  });
  const maison = await prisma.categorie.upsert({
    where: { slug: "maison" },
    update: {},
    create: { nom: "Maison & Cuisine", slug: "maison", ordre: 2 },
  });
  const mode = await prisma.categorie.upsert({
    where: { slug: "mode" },
    update: {},
    create: { nom: "Mode", slug: "mode", ordre: 3 },
  });
  const tshirts = await prisma.categorie.upsert({
    where: { slug: "t-shirts" },
    update: {},
    create: { nom: "T-shirts", slug: "t-shirts", parentId: mode.id, ordre: 1 },
  });

  // --- Axes de déclinaison ------------------------------------------------
  // Déclarés sur « Mode » : « Mode > T-shirts » en hérite sans les redéclarer,
  // sinon chaque sous-catégorie porterait sa propre liste de tailles et elles
  // finiraient par diverger. L'ORDRE des valeurs est l'ordre d'affichage :
  // c'est lui qui classe « S, M, L, XL », ce que l'alphabet ne fait pas.
  for (const axe of [
    { rang: 1, libelle: "Taille", valeurs: ["XS", "S", "M", "L", "XL", "XXL"] },
    { rang: 2, libelle: "Couleur", valeurs: ["Noir", "Blanc", "Bleu", "Rouge"] },
  ]) {
    await prisma.axeVariante.upsert({
      where: { categorieId_rang: { categorieId: mode.id, rang: axe.rang } },
      update: {},
      create: { categorieId: mode.id, ...axe },
    });
  }

  // --- Produits de démonstration (publiés) --------------------------------
  await creerProduitDemo({
    slug: "smartphone-nile-x",
    vendeurId: boutiqueMaison.id,
    categorieId: telephones.id,
    titre: "Smartphone NILE X",
    description:
      "Smartphone d'entrée de gamme, écran 6 pouces, double SIM, batterie longue durée. Idéal pour un premier smartphone.",
    prix: 89000,
    stock: 25,
  });
  await creerProduitDemo({
    slug: "ecouteurs-bluetooth",
    vendeurId: boutiqueDemo.id,
    categorieId: accessoires.id,
    titre: "Écouteurs Bluetooth",
    description:
      "Écouteurs sans fil confortables, autonomie 5 heures, avec boîtier de recharge.",
    prix: 12500,
    stock: 60,
  });
  await creerProduitDemo({
    slug: "chargeur-rapide-usb-c",
    vendeurId: boutiqueDemo.id,
    categorieId: accessoires.id,
    titre: "Chargeur rapide USB-C",
    description:
      "Chargeur mural 20W avec câble USB-C. Compatible avec la plupart des smartphones récents.",
    prix: 6000,
    stock: 0, // en rupture pour tester l'affichage
  });
  await creerProduitDemo({
    slug: "bouilloire-electrique",
    vendeurId: boutiqueMaison.id,
    categorieId: maison.id,
    titre: "Bouilloire électrique 1,7 L",
    description:
      "Bouilloire électrique rapide, arrêt automatique, base rotative 360°.",
    prix: 15000,
    stock: 12,
  });

  // Article décliné : toutes les combinaisons ne sont pas tenues (pas de
  // blanc en L), et le M noir est épuisé — de quoi voir le sélecteur garder
  // une valeur visible mais barrée plutôt que la faire disparaître.
  await creerProduitDeclineDemo({
    slug: "t-shirt-nile-coton",
    vendeurId: boutiqueDemo.id,
    categorieId: tshirts.id,
    titre: "T-shirt NILE en coton",
    description:
      "T-shirt 100 % coton, coupe droite, col rond. Lavable en machine à 30°.",
    prix: 7500,
    marque: "NILE",
    declinaisons: [
      ["S", "Noir", 4],
      ["S", "Blanc", 2],
      ["M", "Noir", 0],
      ["M", "Blanc", 6],
      ["L", "Noir", 3],
    ],
  });

  // --- Garde-fous COD (éditables ensuite par l'admin) ---------------------
  await prisma.configuration.upsert({
    where: { cle: "cod_plafond_xaf" },
    update: {},
    create: { cle: "cod_plafond_xaf", valeur: 150000 },
  });
  await prisma.configuration.upsert({
    where: { cle: "cod_max_commandes_non_abouties" },
    update: {},
    create: { cle: "cod_max_commandes_non_abouties", valeur: 3 },
  });

  console.log("Seed terminé.");
  console.log("Comptes de démo (mot de passe) :");
  console.log(`  - ADMIN    : ${admin.email} / admin1234`);
  console.log(`  - ACHETEUR : ${acheteur.email} / test1234`);
  console.log(`  - VENDEUR  : ${vendeurUser.email} / test1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
