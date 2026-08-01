-- Remise contre code de réception tournant.
--
-- La commande ne passe plus à LIVREE sur simple clic du vendeur : il faut le
-- code affiché chez l'acheteur (scanné ou dicté), ou un forçage administrateur
-- motivé. Comme le calcul des reversements ne compte que les commandes LIVREE
-- et PAYEE, le règlement au vendeur se trouve de fait gagé sur cette preuve.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ModeConfirmationLivraison') THEN
    CREATE TYPE "ModeConfirmationLivraison" AS ENUM ('SCAN', 'MANUEL', 'ADMIN');
  END IF;
END
$$;

ALTER TABLE "Livraison"
  ADD COLUMN IF NOT EXISTS "modeConfirmation" "ModeConfirmationLivraison";

-- Motif obligatoire côté application quand un administrateur force la remise.
ALTER TABLE "Livraison" ADD COLUMN IF NOT EXISTS "forcageMotif" TEXT;

-- Secret d'où découle le code tournant. Tiré au sort à la première demande,
-- jamais transmis au navigateur.
ALTER TABLE "Livraison" ADD COLUMN IF NOT EXISTS "secretReception" TEXT;

-- Reprise des données : les livraisons déjà attestées avant cette migration
-- l'ont été par le bouton de confirmation acheteur, sans code. On les marque
-- ADMIN plutôt que SCAN, pour ne pas leur prêter une valeur probante
-- qu'elles n'ont pas.
UPDATE "Livraison"
   SET "modeConfirmation" = 'ADMIN',
       "forcageMotif" = 'Attestation antérieure à la remise par code'
 WHERE "confirmationAcheteur" IS NOT NULL
   AND "modeConfirmation" IS NULL;
