-- Rattrapage des tables créées « hors migration ».
--
-- Reversement, AbonnementPush et EvenementAbus ont été créées par
-- `prisma db push` (cf. en-tête de la migration 20260730063000) : sur une base
-- NEUVE, `prisma migrate deploy` / `prisma migrate dev` échouait donc dès
-- cette dernière — le parcours d'installation documenté dans le README ne
-- marchait pas de bout en bout. Chaque instruction est idempotente : les
-- environnements existants, qui ont déjà ces tables, ne voient aucun
-- changement (IF NOT EXISTS sur tables/index, garde pg_constraint sur les FK,
-- PostgreSQL n'ayant pas de IF NOT EXISTS pour ADD CONSTRAINT).
--
-- Reversement est créée SANS ses colonnes `statut` ni `dateTraitement` :
-- c'est la migration 20260730063000 qui les ajoute (elle-même idempotente).

-- Événement d'abus : rate limiting adossé à Postgres (fenêtre glissante).
CREATE TABLE IF NOT EXISTS "EvenementAbus" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementAbus_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EvenementAbus_cle_dateCreation_idx"
  ON "EvenementAbus"("cle", "dateCreation");

-- Abonnement Web Push (nouvelle commande -> téléphone du vendeur/admin).
CREATE TABLE IF NOT EXISTS "AbonnementPush" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbonnementPush_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AbonnementPush_endpoint_key"
  ON "AbonnementPush"("endpoint");
CREATE INDEX IF NOT EXISTS "AbonnementPush_utilisateurId_idx"
  ON "AbonnementPush"("utilisateurId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AbonnementPush_utilisateurId_fkey'
  ) THEN
    ALTER TABLE "AbonnementPush"
      ADD CONSTRAINT "AbonnementPush_utilisateurId_fkey"
      FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Reversement : transfert MoMo/OM vers un vendeur (statut ajouté par
-- 20260730063000, qui suit dans l'ordre des migrations).
CREATE TABLE IF NOT EXISTS "Reversement" (
    "id" TEXT NOT NULL,
    "vendeurId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "commentaire" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reversement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Reversement_vendeurId_idx"
  ON "Reversement"("vendeurId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Reversement_vendeurId_fkey'
  ) THEN
    ALTER TABLE "Reversement"
      ADD CONSTRAINT "Reversement_vendeurId_fkey"
      FOREIGN KEY ("vendeurId") REFERENCES "Vendeur"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
