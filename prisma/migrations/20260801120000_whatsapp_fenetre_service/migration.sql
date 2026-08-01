-- Notifications de commande par WhatsApp.
--
-- `whatsappFenetreOuverteJusqua` mémorise jusqu'à quand on peut répondre à
-- l'utilisateur en texte libre gratuit (fenêtre de service Meta, 24h après
-- son dernier message entrant), plutôt que via un template payant.
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "whatsappFenetreOuverteJusqua" TIMESTAMP(3);
