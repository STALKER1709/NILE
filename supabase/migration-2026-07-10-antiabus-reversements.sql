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
CREATE INDEX "EvenementAbus_cle_dateCreation_idx" ON "EvenementAbus"("cle", "dateCreation");

-- CreateIndex
CREATE INDEX "Reversement_vendeurId_idx" ON "Reversement"("vendeurId");

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

