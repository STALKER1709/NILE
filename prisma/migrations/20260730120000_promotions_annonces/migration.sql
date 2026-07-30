-- Promotions vendeur + annonces NILE vers les vendeurs.
--
-- Écrite à la main et IDEMPOTENTE, comme 20260730063000_demande_versement_vendeur :
-- l'historique de migrations de ce dépôt est incomplet, on ne présume donc pas
-- de la façon dont le schéma a été mis en place dans chaque environnement.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypePromotion') THEN
    CREATE TYPE "TypePromotion" AS ENUM ('POURCENTAGE', 'MONTANT');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Promotion" (
  "id" TEXT NOT NULL,
  "vendeurId" TEXT NOT NULL,
  "produitId" TEXT,
  "type" "TypePromotion" NOT NULL,
  "valeur" INTEGER NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateFin" TIMESTAMP(3) NOT NULL,
  "annulee" BOOLEAN NOT NULL DEFAULT false,
  "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Promotion_vendeurId_idx" ON "Promotion"("vendeurId");
CREATE INDEX IF NOT EXISTS "Promotion_produitId_idx" ON "Promotion"("produitId");
CREATE INDEX IF NOT EXISTS "Promotion_dateDebut_dateFin_idx" ON "Promotion"("dateDebut", "dateFin");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Promotion_vendeurId_fkey'
  ) THEN
    ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_vendeurId_fkey"
      FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Promotion_produitId_fkey'
  ) THEN
    ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_produitId_fkey"
      FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Annonce" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "contenu" TEXT NOT NULL,
  "epinglee" BOOLEAN NOT NULL DEFAULT false,
  "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateMaj" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Annonce_epinglee_dateCreation_idx" ON "Annonce"("epinglee", "dateCreation");
