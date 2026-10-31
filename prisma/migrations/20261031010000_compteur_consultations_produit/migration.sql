-- Compteur agrégé de consultations des fiches produits.
-- Aucun identifiant acheteur ou donnée personnelle n’est enregistré.
ALTER TABLE "Produit"
ADD COLUMN "nombreVues" INTEGER NOT NULL DEFAULT 0;
