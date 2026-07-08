# NILE Marketplace

Marketplace e-commerce (modèle hybride) pour le marché camerounais.
Interface en français, devise FCFA (XAF), pensée mobile-first.

État : **Phase 3 — Paiement Monetbil** (interface PaymentProvider, mock, callback serveur vérifié, réconciliation COD).
Phases précédentes : Phase 0 — Fondations · Phase 1 — Catalogue · Phase 2 — Commande (COD).

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

## Vérifier le paiement (Phase 3)

En mode `PAYMENT_PROVIDER="mock"` (par défaut), aucune transaction réelle :
1. Ajoute un produit au panier, va sur **Passer la commande**, choisis
   **Mobile Money (Monetbil)** → tu es redirigé vers une **page de simulation**.
2. « Simuler un paiement réussi » → la commande passe **CONFIRMEE / payée**.
   « Simuler un échec » → la commande est **annulée** et le stock restitué.
3. La commande n'est marquée payée **que** par la notification serveur vérifiée
   (`POST /api/paiement/callback`), jamais par le retour navigateur.
4. En **admin** → **Réconciliation cash (COD)** : marque le cash « collecté »
   (la commande devient payée) puis « reversé ».

## Passer à Monetbil réel (à vérifier avant toute transaction)

L'intégration `MonetbilProvider` suit le code source officiel `Monetbil/monetbil-php` :
- démarrage : `POST https://www.monetbil.com/widget/v2.1/{SERVICE_KEY}` → `{ payment_url }` ;
- vérification serveur : `POST https://api.monetbil.com/payment/v1/checkPayment` avec `paymentId` → `transaction.status` (1=succès, 0=échec, -1=annulé) ;
- signature du callback : `md5(SERVICE_SECRET + concat(valeurs des paramètres triées par clé))`.

**Elle n'a pas pu être exécutée contre le vrai service ici.** Avant de l'activer :
1. Crée un service sur https://www.monetbil.com/services et récupère
   `MONETBIL_SERVICE_KEY` / `MONETBIL_SERVICE_SECRET`, puis mets
   `PAYMENT_PROVIDER="monetbil"`.
2. Configure l'URL de notification (`notify_url`) — le code l'envoie
   automatiquement (`/api/paiement/callback`), mais **confirme dans ton tableau
   de bord Monetbil que les notifications serveur sont activées**.
3. **Confirme les noms exacts des champs du callback** avec une vraie
   notification de test (surtout `paymentId` et `payment_ref`) : ce sont les
   deux champs dont dépend la confirmation. Ajuste si besoin dans
   `src/modules/paiement/monetbil/MonetbilProvider.ts`.

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

## Passer à Supabase (production)

Le fournisseur `mock` sert au développement. Pour la production :

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **Settings → API**, récupère `Project URL`, `anon key`, `service_role key`.
3. Dans `.env` (ou les variables d'environnement de l'hébergeur) :
   ```
   AUTH_PROVIDER="supabase"
   NEXT_PUBLIC_SUPABASE_URL="..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   ```
4. Dans Supabase **Authentication → Providers → Email**, désactive la
   confirmation par email (« Confirm email ») pour le MVP, ou adapte le flux.
5. `DATABASE_URL` pointe vers la base Postgres du projet Supabase.

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
