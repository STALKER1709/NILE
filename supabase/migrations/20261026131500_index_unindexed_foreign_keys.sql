-- Add indexes to foreign-key columns flagged by Supabase performance advisor.
-- IF NOT EXISTS makes the migration safe if an index was created manually.
CREATE INDEX IF NOT EXISTS "Avis_acheteurId_idx" ON public."Avis" ("acheteurId");
CREATE INDEX IF NOT EXISTS "Favori_produitId_idx" ON public."Favori" ("produitId");
CREATE INDEX IF NOT EXISTS "LigneCommande_produitId_idx" ON public."LigneCommande" ("produitId");
CREATE INDEX IF NOT EXISTS "LigneCommande_varianteId_idx" ON public."LigneCommande" ("varianteId");
CREATE INDEX IF NOT EXISTS "LignePanier_varianteId_idx" ON public."LignePanier" ("varianteId");
CREATE INDEX IF NOT EXISTS "PublicationCommentaire_utilisateurId_idx" ON public."PublicationCommentaire" ("utilisateurId");
CREATE INDEX IF NOT EXISTS "PublicationPartage_utilisateurId_idx" ON public."PublicationPartage" ("utilisateurId");
