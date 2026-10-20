-- Rattrapage : la colonne `Livraison.confirmationAcheteur` est utilisée par la
-- migration 20260801170000_reception_par_code (reprise de données), mais sa
-- création est portée par 20260801180000_confirmation_reception_acheteur qui
-- la SUIT dans l'ordre. Sur une base neuve, le parcours échouait dès 17h00
-- (« column confirmationAcheteur does not exist »).
--
-- On crée ici la colonne à l'état attendu AVANT son premier usage ;
-- 20260801180000 la retrouvera déjà là (son ADD COLUMN est idempotente) et ne
-- changera rien, de même que les environnements existants.
ALTER TABLE "Livraison" ADD COLUMN IF NOT EXISTS "confirmationAcheteur" TIMESTAMP(3);
