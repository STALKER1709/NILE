-- Reversements vendeurs via HR-Skills Pay Cash-Out.
ALTER TYPE "StatutReversement" ADD VALUE 'EN_COURS';

ALTER TABLE "Reversement"
  ADD COLUMN "referenceFournisseur" TEXT,
  ADD COLUMN "operateur" TEXT,
  ADD COLUMN "telephoneDestination" TEXT,
  ADD COLUMN "frais" INTEGER;

CREATE UNIQUE INDEX "Reversement_referenceFournisseur_key"
  ON "Reversement"("referenceFournisseur");
