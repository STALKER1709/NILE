-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ACHETEUR', 'VENDEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutUtilisateur" AS ENUM ('ACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutVendeur" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutProduit" AS ENUM ('BROUILLON', 'ACTIF', 'INACTIF', 'EN_MODERATION', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PAYE', 'ECHOUE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('MONETBIL', 'COD');

-- CreateEnum
CREATE TYPE "StatutLivraison" AS ENUM ('EN_ATTENTE', 'AFFECTEE', 'EN_TRANSIT', 'LIVREE', 'ECHEC', 'RETOURNEE');

-- CreateEnum
CREATE TYPE "StatutCashCOD" AS ENUM ('NON_APPLICABLE', 'NON_COLLECTE', 'COLLECTE', 'REVERSE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ACHETEUR',
    "statut" "StatutUtilisateur" NOT NULL DEFAULT 'ACTIF',
    "nbCommandesNonAbouties" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockCredential" (
    "authId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockCredential_pkey" PRIMARY KEY ("authId")
);

-- CreateTable
CREATE TABLE "Vendeur" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "nomBoutique" TEXT NOT NULL,
    "description" TEXT,
    "statutValidation" "StatutVendeur" NOT NULL DEFAULT 'EN_ATTENTE',
    "infosPaiement" JSONB,
    "estBoutiqueMaison" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendeur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" TEXT NOT NULL,
    "vendeurId" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutProduit" NOT NULL DEFAULT 'BROUILLON',
    "noteMoyenne" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbAvis" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageProduit" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "chemin" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,

    CONSTRAINT "ImageProduit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panier" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Panier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LignePanier" (
    "id" TEXT NOT NULL,
    "panierId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "LignePanier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "acheteurId" TEXT NOT NULL,
    "statutCommande" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "statutPaiement" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "modePaiement" "ModePaiement" NOT NULL,
    "total" INTEGER NOT NULL,
    "destNom" TEXT NOT NULL,
    "destTelephone" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "quartier" TEXT NOT NULL,
    "reperes" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "vendeurId" TEXT NOT NULL,
    "titreProduit" TEXT NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "sousTotal" INTEGER NOT NULL,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "montant" INTEGER NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "reference" TEXT,
    "payload" JSONB,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livraison" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "transporteur" TEXT,
    "statut" "StatutLivraison" NOT NULL DEFAULT 'EN_ATTENTE',
    "preuveUrl" TEXT,
    "statutCash" "StatutCashCOD" NOT NULL DEFAULT 'NON_APPLICABLE',
    "montantCashCollecte" INTEGER,
    "dateAffectation" TIMESTAMP(3),
    "dateLivraison" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "Livraison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "acheteurId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "EvenementAbus" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementAbus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reversement" (
    "id" TEXT NOT NULL,
    "vendeurId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "commentaire" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reversement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE INDEX "Utilisateur_role_idx" ON "Utilisateur"("role");

-- CreateIndex
CREATE UNIQUE INDEX "MockCredential_email_key" ON "MockCredential"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vendeur_utilisateurId_key" ON "Vendeur"("utilisateurId");

-- CreateIndex
CREATE INDEX "Vendeur_statutValidation_idx" ON "Vendeur"("statutValidation");

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_slug_key" ON "Categorie"("slug");

-- CreateIndex
CREATE INDEX "Categorie_parentId_idx" ON "Categorie"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_slug_key" ON "Produit"("slug");

-- CreateIndex
CREATE INDEX "Produit_categorieId_idx" ON "Produit"("categorieId");

-- CreateIndex
CREATE INDEX "Produit_vendeurId_idx" ON "Produit"("vendeurId");

-- CreateIndex
CREATE INDEX "Produit_statut_idx" ON "Produit"("statut");

-- CreateIndex
CREATE INDEX "ImageProduit_produitId_idx" ON "ImageProduit"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Panier_utilisateurId_key" ON "Panier"("utilisateurId");

-- CreateIndex
CREATE INDEX "LignePanier_produitId_idx" ON "LignePanier"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "LignePanier_panierId_produitId_key" ON "LignePanier"("panierId", "produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_numero_key" ON "Commande"("numero");

-- CreateIndex
CREATE INDEX "Commande_acheteurId_idx" ON "Commande"("acheteurId");

-- CreateIndex
CREATE INDEX "Commande_statutCommande_idx" ON "Commande"("statutCommande");

-- CreateIndex
CREATE INDEX "Commande_statutPaiement_idx" ON "Commande"("statutPaiement");

-- CreateIndex
CREATE INDEX "LigneCommande_commandeId_idx" ON "LigneCommande"("commandeId");

-- CreateIndex
CREATE INDEX "LigneCommande_vendeurId_idx" ON "LigneCommande"("vendeurId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reference_key" ON "Paiement"("reference");

-- CreateIndex
CREATE INDEX "Paiement_commandeId_idx" ON "Paiement"("commandeId");

-- CreateIndex
CREATE UNIQUE INDEX "Livraison_commandeId_key" ON "Livraison"("commandeId");

-- CreateIndex
CREATE INDEX "Avis_produitId_idx" ON "Avis"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Avis_produitId_acheteurId_key" ON "Avis"("produitId", "acheteurId");

-- CreateIndex
CREATE INDEX "EvenementAbus_cle_dateCreation_idx" ON "EvenementAbus"("cle", "dateCreation");

-- CreateIndex
CREATE INDEX "Reversement_vendeurId_idx" ON "Reversement"("vendeurId");

-- AddForeignKey
ALTER TABLE "Vendeur" ADD CONSTRAINT "Vendeur_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categorie" ADD CONSTRAINT "Categorie_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageProduit" ADD CONSTRAINT "ImageProduit_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panier" ADD CONSTRAINT "Panier_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LignePanier" ADD CONSTRAINT "LignePanier_panierId_fkey" FOREIGN KEY ("panierId") REFERENCES "Panier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LignePanier" ADD CONSTRAINT "LignePanier_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_acheteurId_fkey" FOREIGN KEY ("acheteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_acheteurId_fkey" FOREIGN KEY ("acheteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

