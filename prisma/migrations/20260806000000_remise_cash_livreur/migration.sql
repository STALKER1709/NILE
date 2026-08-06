-- Remise du cash par le livreur à NILE (paiement à la livraison).
--
-- Les livreurs étant désormais fournis par NILE, les espèces encaissées à la
-- livraison remontent à la plateforme au lieu de rester chez le vendeur. Deux
-- moments distincts apparaissent donc, qu'il ne faut pas confondre :
--   - `statutCash = COLLECTE` : le livreur a l'argent en main ;
--   - `statutCash = REVERSE`  : il l'a remis à NILE.
--
-- Entre les deux, la somme est détenue par une personne et pas par la
-- plateforme. C'est cette distinction qui conditionne le reversement au
-- vendeur : on ne le déclare pas payable sur un argent qu'on n'a pas encore.
ALTER TABLE "Livraison" ADD COLUMN IF NOT EXISTS "dateRemiseCash" TIMESTAMP(3);

-- Retrouver le cash en attente de remise sans balayer toute la table : c'est
-- la requête du suivi (« combien mes livreurs détiennent-ils en ce moment ? »),
-- et elle tourne à chaque affichage de la page de contrôle.
CREATE INDEX IF NOT EXISTS "Livraison_cash_idx"
  ON "Livraison"("statutCash", "dateLivraison");
