-- Codes promotionnels émis par NILE.
--
-- La remise sort de la marge de la plateforme et non de celle du vendeur :
-- `Commande.remise` est retranchée du total payé par l'acheteur, mais les
-- `LigneCommande.sousTotal` restent au prix plein, puisque c'est sur eux que
-- se calculent le reversement et la commission. D'où la restriction au Mobile
-- Money, appliquée côté applicatif : en paiement à la livraison NILE
-- n'encaisse rien, et n'aurait donc rien à remiser.

ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "remise" INTEGER NOT NULL DEFAULT 0;
-- Code figé au moment de la commande, comme l'est déjà le prix unitaire : si le
-- code est renommé ou supprimé plus tard, l'historique comptable ne bouge pas.
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "codePromo" TEXT;

CREATE TABLE IF NOT EXISTS "CodePromo" (
  "id"            TEXT NOT NULL,
  "code"          TEXT NOT NULL,
  "type"          "TypePromotion" NOT NULL,
  "valeur"        INTEGER NOT NULL,
  "plafondRemise" INTEGER,
  "minPanier"     INTEGER NOT NULL DEFAULT 0,
  "dateDebut"     TIMESTAMP(3) NOT NULL,
  "dateFin"       TIMESTAMP(3) NOT NULL,
  "quotaTotal"    INTEGER,
  "actif"         BOOLEAN NOT NULL DEFAULT true,
  "dateCreation"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CodePromo_pkey" PRIMARY KEY ("id")
);

-- Le code est stocké normalisé (majuscules, sans espaces) : l'unicité porte
-- donc sur la forme comparée, pas sur la saisie de l'acheteur.
CREATE UNIQUE INDEX IF NOT EXISTS "CodePromo_code_key" ON "CodePromo"("code");
CREATE INDEX IF NOT EXISTS "CodePromo_dates_idx" ON "CodePromo"("dateDebut", "dateFin");

CREATE TABLE IF NOT EXISTS "UtilisationCodePromo" (
  "id"            TEXT NOT NULL,
  "codePromoId"   TEXT NOT NULL,
  "utilisateurId" TEXT NOT NULL,
  "commandeId"    TEXT NOT NULL,
  "remise"        INTEGER NOT NULL,
  "dateCreation"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UtilisationCodePromo_pkey" PRIMARY KEY ("id")
);

-- Une commande ne porte qu'un seul code.
CREATE UNIQUE INDEX IF NOT EXISTS "UtilisationCodePromo_commandeId_key"
  ON "UtilisationCodePromo"("commandeId");

-- Un acheteur n'utilise un code qu'une fois. Garanti ICI et non par une
-- vérification applicative : deux commandes simultanées passeraient toutes
-- deux un simple test de lecture, et le code serait consommé deux fois.
CREATE UNIQUE INDEX IF NOT EXISTS "UtilisationCodePromo_code_utilisateur_key"
  ON "UtilisationCodePromo"("codePromoId", "utilisateurId");

CREATE INDEX IF NOT EXISTS "UtilisationCodePromo_codePromoId_idx"
  ON "UtilisationCodePromo"("codePromoId");

ALTER TABLE "UtilisationCodePromo"
  DROP CONSTRAINT IF EXISTS "UtilisationCodePromo_codePromoId_fkey";
ALTER TABLE "UtilisationCodePromo"
  ADD CONSTRAINT "UtilisationCodePromo_codePromoId_fkey"
  FOREIGN KEY ("codePromoId") REFERENCES "CodePromo"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
