-- Répare les produits créés SANS déclinaison.
--
-- La bascule vers les déclinaisons a créé une variante par produit existant,
-- mais la création de produit, elle, n'en générait aucune. Tout article ajouté
-- au catalogue depuis ce déploiement est donc invendable : le panier ne connaît
-- que les déclinaisons, et un produit qui n'en a pas ne peut pas y être ajouté.
--
-- Le code est corrigé ; cette migration rattrape les produits déjà créés. Elle
-- reprend le stock saisi par le vendeur, seul chiffre disponible pour eux.
--
-- Idempotente : un produit ayant déjà une déclinaison n'est pas touché.
INSERT INTO "VarianteProduit" ("id", "produitId", "valeur1", "valeur2", "stock", "actif")
SELECT gen_random_uuid()::text, p."id", '', '', p."stock", true
FROM "Produit" p
WHERE NOT EXISTS (
  SELECT 1 FROM "VarianteProduit" v WHERE v."produitId" = p."id"
);
