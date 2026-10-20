-- =============================================================================
-- Migration : Dossier KYC Vendeur avec selfie de vérification obligatoire
-- Idempotente pour Supabase SQL Editor et Prisma
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutKyc') THEN
    CREATE TYPE "StatutKyc" AS ENUM ('NON_SOUMIS', 'EN_REVUE', 'VALIDE', 'REJETE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypePieceIdentite') THEN
    CREATE TYPE "TypePieceIdentite" AS ENUM ('CNI', 'PASSEPORT', 'RECEPISSE');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "KycVendeur" (
  "id"                     TEXT NOT NULL,
  "vendeurId"              TEXT NOT NULL,
  "statut"                 "StatutKyc" NOT NULL DEFAULT 'NON_SOUMIS',

  "estEntreprise"          BOOLEAN NOT NULL DEFAULT false,
  "nomEntreprise"          TEXT,
  "niu"                    TEXT,
  "rccm"                   TEXT,
  "registreCommerceUrl"    TEXT,
  "registreCommerceChemin" TEXT,

  "nomComplet"             TEXT,
  "typePiece"              "TypePieceIdentite" NOT NULL DEFAULT 'CNI',
  "numeroPiece"            TEXT,
  "dateExpirationPiece"    TIMESTAMP(3),

  "pieceRectoUrl"          TEXT,
  "pieceRectoChemin"       TEXT,
  "pieceVersoUrl"          TEXT,
  "pieceVersoChemin"       TEXT,

  "selfieUrl"              TEXT,
  "selfieChemin"           TEXT,

  "motifRejet"             TEXT,
  "dateSoumission"         TIMESTAMP(3),
  "dateValidation"         TIMESTAMP(3),
  "dateCreation"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateMaj"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "KycVendeur_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KycVendeur_vendeurId_key"
  ON "KycVendeur"("vendeurId");

CREATE INDEX IF NOT EXISTS "KycVendeur_statut_idx"
  ON "KycVendeur"("statut");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'KycVendeur_vendeurId_fkey'
  ) THEN
    ALTER TABLE "KycVendeur"
      ADD CONSTRAINT "KycVendeur_vendeurId_fkey"
      FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
