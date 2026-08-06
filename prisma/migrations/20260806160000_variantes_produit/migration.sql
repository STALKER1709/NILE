-- Déclinaisons d'un produit : taille, couleur, et un stock par combinaison.
--
-- La quantité disponible quitte `Produit.stock` pour `VarianteProduit.stock`.
-- TOUT produit reçoit au moins une variante, y compris ceux qui n'ont ni
-- taille ni couleur : le stock vit alors toujours au même endroit, et le
-- décrément atomique du tunnel de commande n'a qu'un seul chemin de code.
--
-- `taille` et `couleur` valent la chaîne VIDE quand l'axe ne s'applique pas,
-- jamais NULL : Postgres traite deux NULL comme distincts dans un index
-- unique, ce qui laisserait créer deux fois la même déclinaison.

-- Marque, purement descriptive (recherche et filtres), jamais un axe de stock.
ALTER TABLE "Produit" ADD COLUMN IF NOT EXISTS "marque" TEXT;

CREATE TABLE IF NOT EXISTS "VarianteProduit" (
  "id"        TEXT NOT NULL,
  "produitId" TEXT NOT NULL,
  "taille"    TEXT NOT NULL DEFAULT '',
  "couleur"   TEXT NOT NULL DEFAULT '',
  "stock"     INTEGER NOT NULL DEFAULT 0,
  "actif"     BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "VarianteProduit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VarianteProduit_produit_taille_couleur_key"
  ON "VarianteProduit"("produitId", "taille", "couleur");
CREATE INDEX IF NOT EXISTS "VarianteProduit_produitId_idx"
  ON "VarianteProduit"("produitId");

ALTER TABLE "VarianteProduit" DROP CONSTRAINT IF EXISTS "VarianteProduit_produitId_fkey";
ALTER TABLE "VarianteProduit"
  ADD CONSTRAINT "VarianteProduit_produitId_fkey"
  FOREIGN KEY ("produitId") REFERENCES "Produit"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprise de l'existant : une variante par produit, qui hérite de son stock.
-- Sans elle, tout le catalogue deviendrait invendable à la bascule.
INSERT INTO "VarianteProduit" ("id", "produitId", "taille", "couleur", "stock", "actif")
SELECT gen_random_uuid()::text, p."id", '', '', p."stock", true
FROM "Produit" p
WHERE NOT EXISTS (
  SELECT 1 FROM "VarianteProduit" v WHERE v."produitId" = p."id"
);

-- --------------------------------- Panier -----------------------------------
-- C'est la variante qui est mise au panier : deux tailles du même article sont
-- deux lignes distinctes, chacune avec son stock.
ALTER TABLE "LignePanier" ADD COLUMN IF NOT EXISTS "varianteId" TEXT;

UPDATE "LignePanier" lp
SET "varianteId" = v."id"
FROM "VarianteProduit" v
WHERE v."produitId" = lp."produitId" AND lp."varianteId" IS NULL;

-- Les paniers dont le produit a disparu entre-temps ne peuvent pas être
-- rattachés : ils sont vidés plutôt que de bloquer la migration.
DELETE FROM "LignePanier" WHERE "varianteId" IS NULL;

ALTER TABLE "LignePanier" ALTER COLUMN "varianteId" SET NOT NULL;

-- L'unicité passe du produit à la variante : sans cela, ajouter un M après un
-- XL écraserait la première ligne du panier.
ALTER TABLE "LignePanier" DROP CONSTRAINT IF EXISTS "LignePanier_panierId_produitId_key";
DROP INDEX IF EXISTS "LignePanier_panierId_produitId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "LignePanier_panierId_varianteId_key"
  ON "LignePanier"("panierId", "varianteId");

ALTER TABLE "LignePanier" DROP CONSTRAINT IF EXISTS "LignePanier_varianteId_fkey";
ALTER TABLE "LignePanier"
  ADD CONSTRAINT "LignePanier_varianteId_fkey"
  FOREIGN KEY ("varianteId") REFERENCES "VarianteProduit"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------ Ligne de commande ---------------------------
-- Instantanés au même titre que le titre et le prix : le vendeur peut renommer
-- « Bleu » en « Bleu ciel », une commande passée doit continuer de dire ce qui
-- a été acheté. `varianteId` reste nullable — les commandes antérieures aux
-- déclinaisons n'en désignent aucune, et ne doivent pas être réécrites.
ALTER TABLE "LigneCommande" ADD COLUMN IF NOT EXISTS "varianteId" TEXT;
ALTER TABLE "LigneCommande" ADD COLUMN IF NOT EXISTS "taille" TEXT NOT NULL DEFAULT '';
ALTER TABLE "LigneCommande" ADD COLUMN IF NOT EXISTS "couleur" TEXT NOT NULL DEFAULT '';

ALTER TABLE "LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_varianteId_fkey";
ALTER TABLE "LigneCommande"
  ADD CONSTRAINT "LigneCommande_varianteId_fkey"
  FOREIGN KEY ("varianteId") REFERENCES "VarianteProduit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
