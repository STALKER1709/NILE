-- CreateEnum
CREATE TYPE "StatutCommentaire" AS ENUM ('ACTIF', 'MASQUE', 'SIGNALE');

-- CreateTable
CREATE TABLE "PublicationLike" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationCommentaire" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "statut" "StatutCommentaire" NOT NULL DEFAULT 'ACTIF',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationCommentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationPartage" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationPartage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicationLike_publicationId_utilisateurId_key" ON "PublicationLike"("publicationId", "utilisateurId");

-- CreateIndex
CREATE INDEX "PublicationLike_publicationId_idx" ON "PublicationLike"("publicationId");

-- CreateIndex
CREATE INDEX "PublicationLike_utilisateurId_idx" ON "PublicationLike"("utilisateurId");

-- CreateIndex
CREATE INDEX "PublicationCommentaire_publicationId_dateCreation_idx" ON "PublicationCommentaire"("publicationId", "dateCreation");

-- CreateIndex
CREATE INDEX "PublicationCommentaire_statut_idx" ON "PublicationCommentaire"("statut");

-- CreateIndex
CREATE INDEX "PublicationPartage_publicationId_dateCreation_idx" ON "PublicationPartage"("publicationId", "dateCreation");

-- AddForeignKey
ALTER TABLE "PublicationLike" ADD CONSTRAINT "PublicationLike_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationLike" ADD CONSTRAINT "PublicationLike_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationCommentaire" ADD CONSTRAINT "PublicationCommentaire_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationCommentaire" ADD CONSTRAINT "PublicationCommentaire_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationPartage" ADD CONSTRAINT "PublicationPartage_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationPartage" ADD CONSTRAINT "PublicationPartage_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
