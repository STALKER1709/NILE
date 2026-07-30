-- Demande de versement par le vendeur.
--
-- Écrite à la main et rendue IDEMPOTENTE à dessein : l'historique de
-- migrations de ce dépôt est incomplet (Reversement, AbonnementPush et
-- EvenementAbus ont été créées hors migration), si bien que les
-- environnements peuvent avoir été montés via `prisma db push`. Ces gardes
-- permettent d'appliquer ce delta sans présumer de la façon dont le schéma
-- a été mis en place.

-- Statut d'un versement.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutReversement') THEN
    CREATE TYPE "StatutReversement" AS ENUM ('DEMANDE', 'PAYE', 'REJETE');
  END IF;
END
$$;

-- Les lignes déjà présentes sont des transferts réellement effectués : le
-- défaut PAYE leur donne le bon statut sans reprise de données.
ALTER TABLE "Reversement"
  ADD COLUMN IF NOT EXISTS "statut" "StatutReversement" NOT NULL DEFAULT 'PAYE';

ALTER TABLE "Reversement"
  ADD COLUMN IF NOT EXISTS "dateTraitement" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Reversement_statut_idx" ON "Reversement"("statut");
