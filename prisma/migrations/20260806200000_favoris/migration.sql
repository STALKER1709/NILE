-- Liste de souhaits : les articles qu'un acheteur veut retrouver plus tard.
--
-- Rattachée au PRODUIT et non à une déclinaison : on met de côté un article,
-- pas « ce t-shirt en XL bleu ». Le choix de la taille appartient au moment de
-- l'achat, où le stock est connu.
--
-- Aucune réservation de stock : un favori n'engage ni l'acheteur ni le vendeur.
CREATE TABLE IF NOT EXISTS "Favori" (
  "id"            TEXT NOT NULL,
  "utilisateurId" TEXT NOT NULL,
  "produitId"     TEXT NOT NULL,
  "dateCreation"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Favori_pkey" PRIMARY KEY ("id")
);

-- Unicité portée par la BASE : deux clics rapides sur le cœur ne peuvent pas
-- créer deux lignes, là où une vérification applicative laisserait passer les
-- deux requêtes concurrentes.
CREATE UNIQUE INDEX IF NOT EXISTS "Favori_utilisateur_produit_key"
  ON "Favori"("utilisateurId", "produitId");

-- Les favoris s'affichent du plus récent au plus ancien : l'index porte les
-- deux colonnes de cette requête.
CREATE INDEX IF NOT EXISTS "Favori_utilisateur_date_idx"
  ON "Favori"("utilisateurId", "dateCreation");

ALTER TABLE "Favori" DROP CONSTRAINT IF EXISTS "Favori_utilisateurId_fkey";
ALTER TABLE "Favori"
  ADD CONSTRAINT "Favori_utilisateurId_fkey"
  FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favori" DROP CONSTRAINT IF EXISTS "Favori_produitId_fkey";
ALTER TABLE "Favori"
  ADD CONSTRAINT "Favori_produitId_fkey"
  FOREIGN KEY ("produitId") REFERENCES "Produit"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
