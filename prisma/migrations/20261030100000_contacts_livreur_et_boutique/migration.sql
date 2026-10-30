ALTER TABLE "Vendeur"
  ADD COLUMN "localisationPublique" TEXT,
  ADD COLUMN "telephonePublic" TEXT,
  ADD COLUMN "whatsappPublic" TEXT,
  ADD COLUMN "emailPublic" TEXT;

ALTER TABLE "Livraison"
  ADD COLUMN "livreurNom" TEXT,
  ADD COLUMN "livreurTelephone" TEXT,
  ADD COLUMN "livreurWhatsapp" TEXT;
