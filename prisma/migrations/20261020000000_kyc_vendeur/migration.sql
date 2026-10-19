-- =============================================================================
-- Migration : Dossier KYC Vendeur avec selfie de vérification obligatoire
-- =============================================================================

-- Création des nouveaux types énumérés
DO $$ BEGIN
  CREATE TYPE "StatutKyc" AS ENUM ('NON_SOUMIS', 'EN_REVUE', 'VALIDE', 'REJETE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypePieceIdentite" AS ENUM ('CNI', 'PASSEPORT', 'RECEPISSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table KycVendeur
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

-- Unicité du dossier KYC par vendeur
CREATE UNIQUE INDEX IF NOT EXISTS "KycVendeur_vendeurId_key"
  ON "KycVendeur"("vendeurId");

-- Index par statut pour le tri et le filtrage admin
CREATE INDEX IF NOT EXISTS "KycVendeur_statut_idx"
  ON "KycVendeur"("statut");

-- Clé étrangère vers Vendeur avec cascade à la suppression
ALTER TABLE "KycVendeur" DROP CONSTRAINT IF EXISTS "KycVendeur_vendeurId_fkey";
ALTER TABLE "KycVendeur"
  ADD CONSTRAINT "KycVendeur_vendeurId_fkey"
  FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
