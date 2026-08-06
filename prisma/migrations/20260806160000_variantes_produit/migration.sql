-- Déclinaisons d'un produit : deux axes déclarés par la catégorie, et un stock
-- par combinaison.
--
-- La quantité disponible quitte `Produit.stock` pour `VarianteProduit.stock`.
-- TOUT produit reçoit au moins une variante, y compris ceux qui n'ont ni
-- taille ni couleur : le stock vit alors toujours au même endroit, et le
-- décrément atomique du tunnel de commande n'a qu'un seul chemin de code.
--
-- Les valeurs d'axe valent la chaîne VIDE quand l'axe ne s'applique pas, jamais
-- NULL : Postgres traite deux NULL comme distincts dans un index unique, ce qui
-- laisserait créer deux fois la même déclinaison.
--
-- Les axes eux-mêmes sont portés par la CATÉGORIE : « Taille » (XS…XXXL) pour
-- les vêtements, « Pointure » (36…46) pour les chaussures, « Capacité » pour un
-- téléphone. C'est ce qui rend impossible de demander une télé en taille M sans
-- écrire la moindre règle en dur — la catégorie ne déclare pas cet axe.

CREATE TABLE IF NOT EXISTS "AxeVariante" (
  "id"          TEXT NOT NULL,
  "categorieId" TEXT NOT NULL,
  "rang"        INTEGER NOT NULL,
  "libelle"     TEXT NOT NULL,
  -- L'ORDRE du tableau fait foi pour l'affichage : il classe correctement
  -- « S, M, L, XL » comme « 36, 38, 40 », ce que ni l'alphabet ni le tri
  -- numérique ne font seuls.
  "valeurs"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "AxeVariante_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AxeVariante_categorieId_rang_key"
  ON "AxeVariante"("categorieId", "rang");
CREATE INDEX IF NOT EXISTS "AxeVariante_categorieId_idx"
  ON "AxeVariante"("categorieId");

ALTER TABLE "AxeVariante" DROP CONSTRAINT IF EXISTS "AxeVariante_categorieId_fkey";
ALTER TABLE "AxeVariante"
  ADD CONSTRAINT "AxeVariante_categorieId_fkey"
  FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Marque, purement descriptive (recherche et filtres), jamais un axe de stock.
ALTER TABLE "Produit" ADD COLUMN IF NOT EXISTS "marque" TEXT;

CREATE TABLE IF NOT EXISTS "VarianteProduit" (
  "id"        TEXT NOT NULL,
  "produitId" TEXT NOT NULL,
  "valeur1"   TEXT NOT NULL DEFAULT '',
  "valeur2"   TEXT NOT NULL DEFAULT '',
  "stock"     INTEGER NOT NULL DEFAULT 0,
  "actif"     BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "VarianteProduit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VarianteProduit_produit_valeurs_key"
  ON "VarianteProduit"("produitId", "valeur1", "valeur2");
CREATE INDEX IF NOT EXISTS "VarianteProduit_produitId_idx"
  ON "VarianteProduit"("produitId");

ALTER TABLE "VarianteProduit" DROP CONSTRAINT IF EXISTS "VarianteProduit_produitId_fkey";
ALTER TABLE "VarianteProduit"
  ADD CONSTRAINT "VarianteProduit_produitId_fkey"
  FOREIGN KEY ("produitId") REFERENCES "Produit"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprise de l'existant : une variante par produit, qui hérite de son stock.
-- Sans elle, tout le catalogue deviendrait invendable à la bascule.
INSERT INTO "VarianteProduit" ("id", "produitId", "valeur1", "valeur2", "stock", "actif")
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
-- Instantané LISIBLE — « Pointure 42 · Noir » — au même titre que le titre et le
-- prix. Une seule chaîne plutôt que des valeurs brutes : sans le nom de l'axe,
-- un « 42 » isolé serait indéchiffrable des années plus tard. `varianteId`
-- reste nullable — les commandes antérieures aux déclinaisons n'en désignent
-- aucune, et ne doivent pas être réécrites.
ALTER TABLE "LigneCommande" ADD COLUMN IF NOT EXISTS "varianteId" TEXT;
ALTER TABLE "LigneCommande" ADD COLUMN IF NOT EXISTS "declinaison" TEXT NOT NULL DEFAULT '';

ALTER TABLE "LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_varianteId_fkey";
ALTER TABLE "LigneCommande"
  ADD CONSTRAINT "LigneCommande_varianteId_fkey"
  FOREIGN KEY ("varianteId") REFERENCES "VarianteProduit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
