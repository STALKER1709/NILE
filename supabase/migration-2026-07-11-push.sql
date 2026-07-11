-- CreateTable
CREATE TABLE "AbonnementPush" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbonnementPush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbonnementPush_endpoint_key" ON "AbonnementPush"("endpoint");

-- CreateIndex
CREATE INDEX "AbonnementPush_utilisateurId_idx" ON "AbonnementPush"("utilisateurId");

-- AddForeignKey
ALTER TABLE "AbonnementPush" ADD CONSTRAINT "AbonnementPush_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

