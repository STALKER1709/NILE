# NILE Marketplace

Marketplace e-commerce (modèle hybride) pour le marché camerounais.
Interface en français, devise FCFA (XAF), pensée mobile-first.

État : **MVP complet (Phases 0 → 5)** — fondations, catalogue, commande, paiement, confiance/livraison/admin, finitions.
Tout fonctionne en mode « mock » local (auth, paiement, stockage) ; voir plus bas pour brancher les vrais services.

## Stack

- **Next.js 15** (App Router, TypeScript strict) — front + serveur unifiés.
- **PostgreSQL** + **Prisma** (ORM & migrations).
- **Authentification** derrière une interface `AuthProvider` :
  - `supabase` — vrai fournisseur managé (production) ;
  - `mock` — développement/tests locaux uniquement.
- **Zod** — validation de toutes les entrées.
- **Tailwind CSS** — pages légères.
- **Vitest** — tests.

## Prérequis

- Node.js 20+ et [pnpm](https://pnpm.io)
- Un PostgreSQL accessible (local ou managé)

## Démarrage local (5 étapes)

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp .env.example .env
#   Puis, dans .env :
#   - DATABASE_URL      -> ta base PostgreSQL locale
#   - MOCK_AUTH_SECRET  -> une valeur aléatoire (openssl rand -hex 32)
#   (AUTH_PROVIDER reste "mock" en local : aucun compte externe requis.)

# 3. Créer les tables (migrations)
pnpm db:migrate

# 4. Charger les données de démonstration (comptes + catégories)
pnpm db:seed

# 5. Lancer le serveur de développement
pnpm dev
# -> http://localhost:3000
```

### Comptes de démonstration (créés par le seed)

| Rôle     | Email             | Mot de passe |
|----------|-------------------|--------------|
| Admin    | admin@nile.cm     | admin1234    |
| Acheteur | acheteur@nile.cm  | test1234     |
| Vendeur  | vendeur@nile.cm   | test1234     |

## Vérifier que l'auth et les rôles marchent

1. Ouvre `http://localhost:3000` → tu vois l'accueil (non connecté).
2. **Créer un compte** (`/inscription`) : choisis « Acheter » ou « Vendre ».
3. **Se connecter** (`/connexion`) avec un compte de démo.
4. Teste la **protection par rôle** :
   - `/compte` → accessible à tout utilisateur connecté ;
   - `/vendeur` → **seulement** un VENDEUR (sinon redirection vers `/acces-refuse`) ;
   - `/admin` → **seulement** un ADMIN.
5. Non connecté, va sur `/admin` → tu es redirigé vers `/connexion`.

## Vérifier le catalogue (Phase 1)

1. Connecte-toi en **vendeur** (`vendeur@nile.cm` / `test1234`).
2. Va dans **Mon compte → Gérer mes produits → Nouveau produit** : remplis le
   formulaire, ajoute une image, crée le produit (il est en **BROUILLON**).
3. Sur la page du produit, clique **Publier** (possible car la boutique de démo
   est validée). Un vendeur non validé ne peut pas publier.
4. Va sur `/catalogue` : recherche, filtre par catégorie / prix, ouvre une fiche
   produit. Un produit en rupture (stock 0) est marqué « Indisponible ».
5. En **admin** (`admin@nile.cm`), va sur `/admin/categories` pour construire
   ton arborescence de catégories.

Le stockage des images est **local** en dev (`public/uploads/`), et bascule sur
Supabase Storage en production via `STORAGE_PROVIDER="supabase"`.

## Vérifier la commande (Phase 2)

1. Connecte-toi en acheteur (`acheteur@nile.cm` / `test1234`).
2. Depuis une fiche produit du catalogue, choisis une quantité → **Ajouter au
   panier**. Va sur **Panier** (dans le menu), ajuste les quantités si besoin.
3. **Passer la commande** → remplis l'adresse (ville, quartier, repères libres) →
   **Confirmer**. Le paiement est **à la livraison (COD)**.
4. La commande apparaît dans **Mes commandes** avec deux statuts distincts
   (commande *et* paiement). Ouvre-la : tu peux l'**annuler** tant qu'elle n'est
   pas préparée (les articles sont alors remis en stock).

Garde-fous : impossible de commander plus que le stock, ni au-dessus du plafond
COD (`COD_PLAFOND_XAF`). Le décrément de stock est atomique : deux acheteurs ne
peuvent pas acheter le même dernier article (pas de survente).

## Vérifier le paiement

En mode `PAYMENT_PROVIDER="mock"` (par défaut), aucune transaction réelle :
1. Ajoute un produit au panier, va sur **Passer la commande**, choisis
   **Mobile Money** → tu es redirigé vers une **page de simulation**.
2. « Simuler un paiement réussi » → la commande passe **CONFIRMEE / payée**.
   « Simuler un échec » → la commande est **annulée** et le stock restitué.
3. La commande n'est marquée payée **que** sur un statut vérifié auprès du
   fournisseur, jamais sur le retour navigateur.
4. En **admin** → **Suivi du cash (COD)** : vue de contrôle en lecture seule.
   Les espèces sont remises au livreur de la boutique et ne transitent pas par
   NILE ; il n'y a donc rien à encaisser ni à reverser ici.

## Passer en production (HR-Skills Pay)

L'agrégateur retenu est **HR-Skills Pay**. L'intégration `MonetbilProvider`
reste dans le dépôt mais n'est plus utilisée.

L'intégration a été **éprouvée en sandbox** : encaissement accepté, commande
confirmée, wallet crédité. Le **webhook n'a jamais été reçu** — c'est pourquoi
deux filets le complètent, et doivent être conservés :
- l'écran d'attente relit le statut chez le fournisseur toutes les 10 s ;
- `/api/cron/paiements-en-attente` balaie périodiquement les paiements restés
  en attente, y compris navigateur fermé.

Pour passer en live :
1. **KYC approuvé** dans le tableau de bord HR-Skills, sinon l'API répond
   `403 kyc_required`.
2. Poser `PAYMENT_PROVIDER="hrskills"`, `HRSKILLS_CLE_A`, `HRSKILLS_CLE_B` et
   `HRSKILLS_WEBHOOK_SECRET`. Sandbox et production partagent le même hôte :
   **c'est le préfixe des clés qui détermine l'environnement**
   (`hrsk_*_test_*` / `hrsk_*_live_*`). L'application refuse de démarrer si les
   deux clés ne portent pas le même environnement.
3. Déclarer l'URL du webhook — `https://TON-DOMAINE/api/paiement/callback` —
   **pour l'environnement Live**, qui est une configuration distincte du
   Sandbox.
4. Poser `CRON_SECRET` sur l'hébergeur **et** dans les secrets du dépôt GitHub :
   sans les deux, le balayage des paiements ne tourne pas, silencieusement.
5. Faire un premier paiement réel de petit montant sur son propre numéro.

Deux points constatés en sandbox et non documentés par le fournisseur : les
encaissements de test ne sont servis que sous `/sandbox`, et les frais réels
sont de **2 %** (leur documentation annonce 1 %).

## Vérifier la Phase 4 (confiance + livraison + admin)

En **admin** (`admin@nile.cm`), menu back-office :
- **Validation des vendeurs** : valider / rejeter / suspendre une boutique.
- **Commandes & livraisons** : ouvrir une commande payée/COD → affecter un
  transporteur (→ en préparation), marquer expédiée puis livrée, ajouter une
  **preuve de livraison** (image), ou enregistrer un **refus à la livraison**
  (→ commande refusée, **stock restitué**, **compteur anti-fraude COD** de
  l'acheteur incrémenté).
- **Modération du catalogue** : rejeter (masquer) ou réactiver un produit.

Côté **acheteur** : une fois une commande **livrée**, la fiche du produit
affiche un formulaire d'**avis** (note 1–5 + commentaire). Un avis par produit,
uniquement après réception ; la note moyenne se met à jour automatiquement.

## Scripts utiles

```bash
pnpm dev          # serveur de développement
pnpm build        # build de production
pnpm typecheck    # vérification TypeScript (tsc --noEmit)
pnpm test         # tests (Vitest)
pnpm db:migrate   # créer/appliquer une migration
pnpm db:seed      # (re)charger les données de démo
pnpm db:reset     # réinitialiser la base (⚠ efface les données)
```

## Passer à Supabase (procédure complète)

Le fournisseur `mock` sert au développement. Pour brancher la vraie
authentification managée :

1. **Créer le projet** sur [supabase.com](https://supabase.com) (choisis une
   région, note le mot de passe de la base).
2. **Récupérer les clés** — **Settings → API** : `Project URL`, `anon key`,
   `service_role key`.
3. **Récupérer la chaîne de connexion** — **Settings → Database → Connection
   string** : prends l'URI du **pooler** (port `6543`, mode transaction) pour
   `DATABASE_URL`, et l'URI **direct** (port `5432`) pour `DIRECT_URL` si tu
   ajoutes des migrations (Prisma utilise le direct pour migrer).
4. **Renseigner les variables** (`.env` en local, ou les variables d'env de
   l'hébergeur) :
   ```
   AUTH_PROVIDER="supabase"
   NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."          # secret, jamais exposé au client
   DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
   ```
5. **Créer les tables** sur la base Supabase :
   ```bash
   pnpm prisma migrate deploy
   pnpm db:seed        # optionnel : catégories + comptes de démo
   ```
6. **Désactiver la confirmation d'email** au MVP — **Authentication →
   Providers → Email → « Confirm email » OFF** (sinon la connexion juste après
   l'inscription échoue). Sinon, adapter le flux d'inscription.
7. **Lancer** : `pnpm build && pnpm start`. Le **middleware** (`src/middleware.ts`)
   rafraîchit automatiquement la session à chaque requête (motif officiel
   `@supabase/ssr`) ; il est inactif en mode `mock`.

Points à vérifier une fois branché : inscription → connexion → accès par rôle
(comme pour le mock, mais avec de vrais comptes).

> Le provider `mock` est **bloqué en production** (`NODE_ENV=production`) sauf
> `ALLOW_MOCK_AUTH="true"` (pour une démo).

## Structure

```
prisma/            schéma, migrations, seed
src/
  app/             routes Next.js (accueil, auth, compte, vendeur, admin)
  modules/         logique métier
    auth/          AuthProvider + mock + supabase + autorisation par rôle
  lib/             env (Zod), client Prisma, helpers argent (XAF)
  validators/      schémas Zod des entrées
```
