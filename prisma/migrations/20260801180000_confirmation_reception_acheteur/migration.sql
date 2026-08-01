-- Attestation de réception par l'acheteur (paiement à la livraison).
--
-- `confirmationAcheteur` est distincte de `dateLivraison` : la première est
-- déclarée par l'ACHETEUR, la seconde par le vendeur/livreur. Purement
-- déclarative — elle ne conditionne ni le reversement au vendeur, ni le
-- droit de laisser un avis.
ALTER TABLE "Livraison" ADD COLUMN IF NOT EXISTS "confirmationAcheteur" TIMESTAMP(3);

-- Un seul rappel push par commande : ce drapeau empêche toute relance en
-- boucle si le passage périodique repasse sur la même livraison.
ALTER TABLE "Livraison"
  ADD COLUMN IF NOT EXISTS "rappelConfirmationEnvoye" BOOLEAN NOT NULL DEFAULT false;

-- Retrouver les livraisons à rappeler sans balayer toute la table. Nom court
-- et explicite : l'auto-généré dépasserait la limite de 63 caractères de
-- Postgres et serait tronqué silencieusement.
CREATE INDEX IF NOT EXISTS "Livraison_rappel_idx"
  ON "Livraison"("statut", "confirmationAcheteur", "rappelConfirmationEnvoye");
