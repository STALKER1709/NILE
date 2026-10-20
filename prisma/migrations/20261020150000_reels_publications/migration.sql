-- CreateEnum
CREATE TYPE "StatutPublication" AS ENUM ('ACTIF', 'MASQUE');

-- CreateEnum
CREATE TYPE "TypeMediaPublication" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "vendeurId" TEXT NOT NULL,
    "texte" TEXT,
    "statut" "StatutPublication" NOT NULL DEFAULT 'ACTIF',
    "vues" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationMedia" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "type" "TypeMediaPublication" NOT NULL,
    "url" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "posterUrl" TEXT,
    "posterChemin" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PublicationMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationProduit" (
    "publicationId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,

    CONSTRAINT "PublicationProduit_pkey" PRIMARY KEY ("publicationId","produitId")
);

-- CreateIndex
CREATE INDEX "Publication_vendeurId_dateCreation_idx" ON "Publication"("vendeurId", "dateCreation");

-- CreateIndex
CREATE INDEX "Publication_statut_dateCreation_idx" ON "Publication"("statut", "dateCreation");

-- CreateIndex
CREATE INDEX "PublicationMedia_publicationId_idx" ON "PublicationMedia"("publicationId");

-- CreateIndex
CREATE INDEX "PublicationProduit_produitId_idx" ON "PublicationProduit"("produitId");

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMedia" ADD CONSTRAINT "PublicationMedia_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationProduit" ADD CONSTRAINT "PublicationProduit_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationProduit" ADD CONSTRAINT "PublicationProduit_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

