# Correctifs de sécurité — prérequis de déploiement

Cette branche durcit la configuration de production et isole les nouveaux documents KYC. Les actions externes ci-dessous restent obligatoires : elles ne peuvent pas être exécutées sans accès au tableau de bord Supabase/Vercel et aux identifiants du fournisseur.

## 1. Supabase Storage : bucket KYC privé

1. Dans Supabase Storage, créer un bucket nommé `kyc-prive` (ou renseigner `SUPABASE_KYC_BUCKET`).
2. **Ne pas activer Public bucket** pour ce bucket.
3. Ne donner aucun accès anonyme en lecture/écriture aux objets de ce bucket. Les opérations passent par la clé service-role côté serveur.
4. Vérifier que `SUPABASE_KYC_BUCKET` est différent de `SUPABASE_STORAGE_BUCKET` (habituellement `produits`).
5. Les nouvelles pièces KYC sont enregistrées sous une référence `kyc://...`; la page de détail vendeur génère une URL signée de 5 minutes uniquement après contrôle du rôle ADMIN.

### Documents KYC déjà téléversés

Les dossiers existants peuvent encore contenir des URL publiques héritées du bucket média. Le code conserve leur compatibilité et **ne peut pas rendre rétroactivement privées les anciennes URL**. Avant d’accepter des dossiers réels :

- sauvegarder la base de données ;
- faire un dry-run avec `pnpm exec tsx --env-file-if-exists=.env scripts/migrate-kyc-private.ts` ;
- après validation du décompte, exécuter `pnpm exec tsx --env-file-if-exists=.env scripts/migrate-kyc-private.ts --apply` ;
- inventorier les champs `pieceRectoChemin`, `pieceVersoChemin`, `selfieChemin` et `registreCommerceChemin` déjà renseignés ;
- copier chaque objet du bucket public vers `kyc-prive` ;
- mettre à jour les URL en base au format `kyc://<chemin>` ;
- vérifier la lecture par un administrateur, puis supprimer l’objet original du bucket public ;
- contrôler qu’aucun objet KYC ne reste accessible publiquement.

Ne supprimez les anciens objets qu'après avoir confirmé la copie et la mise à jour en base.

## 2. Variables de production obligatoires

Dans Vercel > Settings > Environment Variables, définir les fournisseurs réels et les secrets pour l'environnement **Production** :

- `NODE_ENV=production` (fourni par la plateforme) ;
- `AUTH_PROVIDER=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et la clé service-role nécessaire aux opérations administratives ;
- `PAYMENT_PROVIDER=hrskills` ou `monetbil`, avec les identifiants du même environnement et le secret webhook ;
- `STORAGE_PROVIDER=supabase`, `SUPABASE_STORAGE_BUCKET=produits`, `SUPABASE_KYC_BUCKET=kyc-prive` ;
- `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY` et `EMAIL_EXPEDITEUR` ;
- `CRON_SECRET` fort, d'au moins 16 caractères, identique aux secrets des workflows qui appellent les routes cron.

Ne collez jamais de clé secrète dans une issue, un commit, un message ou un log. Saisir les valeurs sans guillemets littéraux dans Vercel.

## 3. HR-Skills Pay

Le HTTP 401 « Clé B invalide » précédemment observé ne peut pas être résolu de manière fiable par une modification supposée des en-têtes. Vérifier avec le support HR-Skills Pay le contrat exact de l'endpoint d'encaissement, les clés A/B associées au même environnement et l'en-tête attendu pour la Clé B. Réussir un encaissement sandbox, un échec sandbox, un webhook signé et une lecture de statut avant d'activer le paiement réel.

## 4. Informations légales

Les champs d'identification de l'exploitant et de contact dans les conditions et la politique de confidentialité doivent être renseignés avec les vraies informations légales de l'entité exploitante. Ne pas publier ces pages avec des champs « à compléter ». Vérifier les textes avec un conseil compétent avant le lancement.

## 5. Vérifications de mise en production

- TypeScript, tests unitaires et build Next.js réussis.
- Parcours de commande testé avec fournisseurs mock uniquement en environnement de test.
- Sandbox HR-Skills Pay testé de bout en bout ; aucun achat réel avant validation.
- Bucket KYC privé vérifié avec une session anonyme (lecture refusée) et un compte ADMIN (URL signée temporaire).
- Revue des documents KYC historiques terminée.
- Conditions, politique de confidentialité, livraison, annulation et remboursement alignés sur les comportements réellement déployés.
