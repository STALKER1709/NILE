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

  // Boutique du vendeur démo (validée pour pouvoir tester le catalogue plus tard).
  await prisma.vendeur.upsert({
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
  await prisma.vendeur.upsert({
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
  await prisma.categorie.upsert({
    where: { slug: "telephones" },
    update: {},
    create: {
      nom: "Téléphones",
      slug: "telephones",
      parentId: electronique.id,
      ordre: 1,
    },
  });
  await prisma.categorie.upsert({
    where: { slug: "accessoires" },
    update: {},
    create: {
      nom: "Accessoires",
      slug: "accessoires",
      parentId: electronique.id,
      ordre: 2,
    },
  });
  await prisma.categorie.upsert({
    where: { slug: "maison" },
    update: {},
    create: { nom: "Maison & Cuisine", slug: "maison", ordre: 2 },
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
