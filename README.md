# NILE Marketplace

Marketplace e-commerce (modèle hybride) pour le marché camerounais.
Interface en français, devise FCFA (XAF), pensée mobile-first.

État : **MVP complet (Phases 0 → 5)** — fondations, catalogue, commande, paiement, confiance/livraison/admin, finitions.
Depuis, quatre chantiers se sont ajoutés : **déclinaisons** (taille / couleur /
pointure, avec un stock par combinaison), **marques et navigation par rayons**,
**codes promo**, **liste de souhaits**.

Tout fonctionne en mode « mock » local (auth, paiement, stockage) ; voir plus bas
pour brancher les vrais services. Le paiement réel a été **éprouvé en sandbox**
mais **n'est pas encore passé en live** (voir « Passer en production »).

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
4. Va sur `/catalogue` : recherche, filtre par catégorie / **marque** / prix,
   ouvre une fiche produit. Un article sans stock est marqué « Indisponible ».
   La colonne de gauche n'affiche que les **rayons**, et déplie les
   sous-catégories du rayon ouvert.
5. En **admin** (`admin@nile.cm`), va sur `/admin/categories` pour construire
   ton arborescence de catégories et y déclarer les **axes de déclinaison**
   (voir plus bas).

La **marque** est une saisie libre côté vendeur, avec suggestion de celles déjà
utilisées. Les graphies d'une même marque (« Nike », « NIKE », « nike ») sont
regroupées en une entrée dans le filtre, la plus fréquente l'emportant.

Le stockage des images est **local** en dev (`public/uploads/`), et bascule sur
Supabase Storage en production via `STORAGE_PROVIDER="supabase"`.

## Vérifier la commande (Phase 2)

1. Connecte-toi en acheteur (`acheteur@nile.cm` / `test1234`).
2. Depuis une fiche produit du catalogue, **Ajouter au panier** — le bouton
   devient un compteur `[− qté +]`. Si l'article est décliné, choisis d'abord
   ta taille (et sa couleur) : le bouton reste inactif tant que le choix n'est
   pas complet. Va sur **Panier**, ajuste les quantités si besoin.
3. **Passer la commande** → remplis l'adresse (ville, quartier, repères libres) →
   **Confirmer**. Le paiement est **à la livraison (COD)** ou en Mobile Money.
4. La commande apparaît dans **Mes commandes** avec deux statuts distincts
   (commande *et* paiement). Ouvre-la : tu peux l'**annuler** tant qu'elle n'est
   pas préparée (les articles sont alors remis en stock).

Le panier fonctionne **sans compte** : un visiteur le remplit (cookie), et son
contenu est fusionné dans son vrai panier à la connexion. Le compte n'est exigé
qu'au moment de valider la commande.

Garde-fous : impossible de commander plus que le stock, ni au-dessus du plafond
COD (`COD_PLAFOND_XAF`). Le décrément est **atomique et porte sur la
déclinaison** : deux acheteuses ne peuvent pas emporter le même dernier XL bleu,
même si le M reste abondant (pas de survente). Toute commande qui n'aboutit pas
recrédite la **même déclinaison**.

## Vérifier le paiement

En mode `PAYMENT_PROVIDER="mock"` (par défaut), aucune transaction réelle :
1. Ajoute un produit au panier, va sur **Passer la commande**, choisis
   **Mobile Money** → tu es redirigé vers une **page de simulation**.
2. « Simuler un paiement réussi » → la commande passe **CONFIRMEE / payée**.
   « Simuler un échec » → la commande est **annulée** et le stock restitué.
3. La commande n'est marquée payée **que** sur un statut vérifié auprès du
   fournisseur, jamais sur le retour navigateur.
4. En **admin** → **Suivi du cash (COD)** : vue de contrôle en lecture seule des
   commandes réglées en espèces.

## Commission et paiement à la livraison

Les espèces du COD sont encaissées par le vendeur au moment de la livraison :
elles ne transitent pas par NILE. La commission de la plateforme, elle, est due
sur **toutes** les ventes, espèces comprises.

Elle est donc **prélevée sur les encaissements Mobile Money** du vendeur :

- `COMMISSION_POURCENT` (défaut **12 %**) s'applique au chiffre d'affaires
  total — ventes Mobile Money **et** ventes en espèces. Le taux couvre les 2 %
  réellement prélevés par l'agrégateur ; il reste donc 10 % nets à NILE ;
- le net à reverser au vendeur = ventes Mobile Money − commission totale. Il
  peut être **négatif** si le vendeur ne vend qu'en espèces : la différence
  devient une **dette** ;
- au-delà de `COD_DETTE_PLAFOND_XAF` (défaut **25 000 FCFA**), le paiement à la
  livraison est **refusé** sur les articles de ce vendeur — vérifié côté
  serveur, l'écran de commande ne fait que l'anticiper. Le mécanisme
  s'auto-corrige : les ventes suivantes passent par NILE, qui se rembourse.

L'acheteur dont le panier mêle des articles bloqués et des articles éligibles
voit lesquels retirer pour pouvoir payer à la livraison.

Vue admin : **Reversements** (net, commission, dette par vendeur).

## Passer en production (HR-Skills Pay)

L'agrégateur retenu est **HR-Skills Pay**. L'intégration `MonetbilProvider`
reste dans le dépôt mais n'est plus utilisée.

L'intégration a été **éprouvée en sandbox** : encaissement accepté, commande
confirmée, wallet crédité. Le **webhook n'a jamais été reçu** — c'est pourquoi
deux filets le complètent, et doivent être conservés :
- l'écran d'attente relit le statut chez le fournisseur toutes les 10 s ;
- `/api/cron/paiements-en-attente` balaie **toutes les 5 minutes** (workflow
  GitHub Actions) les paiements restés en attente, y compris navigateur fermé.

### Séquence de bascule

Aucune étape n'est facultative : la 4 sans la 5 donne une application qui
encaisse et n'apprend jamais qu'elle a encaissé.

1. **Faire approuver le KYC** dans le tableau de bord HR-Skills. Sans lui, tout
   encaissement répond `403 kyc_required` — rien dans le code ne le contourne.
2. **Générer les clés Live** (Clé A et Clé B) et le **secret de webhook de
   l'environnement Live**, qui est une configuration distincte du Sandbox.
3. **Poser les variables sur l'hébergeur** : `PAYMENT_PROVIDER="hrskills"`,
   `HRSKILLS_CLE_A`, `HRSKILLS_CLE_B`, `HRSKILLS_WEBHOOK_SECRET`.
   Sandbox et production partagent le même hôte : **c'est le préfixe des clés
   qui détermine l'environnement** (`hrsk_*_test_*` / `hrsk_*_live_*`).
   L'application refuse de démarrer si les deux clés ne portent pas le même.
   ⚠️ Ne pas recopier les guillemets depuis un `.env` : l'interface de Vercel
   enregistre la valeur littéralement.
4. **Déclarer l'URL du webhook** — `https://TON-DOMAINE/api/paiement/callback` —
   **côté Live**.
5. **Poser `CRON_SECRET`** sur l'hébergeur **et** dans les secrets du dépôt
   GitHub, à l'identique. Sans les deux, le balayage des paiements ne tourne
   pas, et il ne le signale pas.
6. **Lancer le contrôle avant vol** (voir ci-dessous) avec les variables de
   production.
7. **Faire un premier paiement réel de petit montant** sur son propre numéro,
   puis vérifier dans l'admin que la commande est passée payée.

### Contrôle avant vol

```bash
pnpm verif:paiement
```

Provoque dans un terminal les erreurs qu'on découvrirait sinon au moment où un
client paie : clés mélangeant les environnements, guillemets recopiés, secret de
webhook oublié, `CRON_SECRET` absent. Il **ne déplace aucun argent** — son seul
appel réseau est l'échange des clés contre un jeton de transaction, celui-là
même que l'application fait avant chaque encaissement. S'il aboutit, les clés
sont bonnes **et** le KYC est passé.

Il dit aussi explicitement ce qu'il ne peut pas vérifier : que l'URL du webhook
est bien déclarée côté Live, que le secret posé vient de ce même environnement,
et qu'un vrai encaissement aboutit.

### Deux points constatés en sandbox, non documentés par le fournisseur

- les encaissements de test ne sont servis que sous `/sandbox` (le préfixe
  disparaît automatiquement avec des clés `live`) ;
- les frais réels sont de **2 %**, là où leur documentation annonce 1 % — c'est
  ce que `COMMISSION_POURCENT` doit couvrir.

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

## Vérifier les déclinaisons (taille, couleur, pointure…)

Un article peut se vendre en plusieurs versions ayant **chacune son stock**. Le
code ne connaît ni les tailles ni les couleurs : les **axes** sont déclarés par
la **catégorie**, ce qui rend impossible de demander une télévision « en taille
M » sans qu'aucune règle ne soit écrite en dur.

1. En **admin** → `/admin/categories` : sur une catégorie, déclarer un axe de
   rang 1 (ex. `Taille` : `XS, S, M, L, XL, XXL`) et éventuellement de rang 2
   (ex. `Couleur`). **L'ordre des valeurs est l'ordre d'affichage** — c'est lui
   qui classe « S, M, L, XL », ce que l'alphabet ne fait pas. Les
   sous-catégories **héritent** des axes du parent ; le premier niveau qui
   déclare gagne entièrement (pas de fusion entre niveaux).
2. En **vendeur** → fiche d'un produit de cette catégorie → carte
   **Déclinaisons** : ajouter les combinaisons tenues, chacune avec son stock.
   Dès la première, le champ « Stock » du formulaire cesse de s'appliquer et
   devient un simple total.
3. En **acheteur** → fiche produit : les sélecteurs apparaissent. Rien n'est
   présélectionné (un défaut ferait partir des commandes en taille M par
   inattention) et les valeurs épuisées restent **visibles et barrées** plutôt
   que de disparaître.

Sur les grilles, un article décliné affiche **« Choisir les options »** au lieu
d'« Ajouter » : une grille ne peut pas choisir une taille à la place de
l'acheteur.

Points structurants :

- l'unité du panier et de la commande est la **déclinaison**, pas le produit —
  un même t-shirt peut occuper deux lignes, en M et en XL ;
- le décrément de stock, atomique, porte sur la déclinaison : deux acheteuses ne
  peuvent pas emporter le même dernier XL bleu ;
- `Produit.stock` est un **champ historique** : il n'est plus ni lu ni
  décrémenté à la vente. Tout écran qui l'affiche est un bug.

## Vérifier la liste de souhaits

Le cœur est présent sur la fiche produit et sur les cartes des grilles
(accueil, catalogue, promotions, boutique, « Vous aimerez aussi »). Il n'est
proposé **qu'aux personnes connectées** : sans compte, il n'y a nulle part où
enregistrer la liste. Accès et compteur dans l'en-tête, dans la barre mobile et
sur la page Compte.

Un favori est rattaché au **produit**, pas à une déclinaison : on met de côté un
article, pas « ce t-shirt en XL bleu ». Les articles devenus indisponibles sont
**signalés, pas masqués** — les faire disparaître donne l'impression d'avoir
perdu sa liste.

## Vérifier les codes promo

Émis par **NILE seule** (`/admin/codes-promo`), à usage unique par acheteur,
valables **en Mobile Money uniquement**. La remise sort de la marge de la
plateforme : **le vendeur reste payé au prix plein**, les `sousTotal` des lignes
restent au prix catalogue et seul le total payé est net de remise.

Le code est évalué et consommé **dans la transaction de commande**, sur le total
recalculé à ce moment — jamais sur celui affiché au panier. Si la commande
n'aboutit pas (paiement échoué, annulation, initiation impossible), le code est
**rendu** avec le stock.

## Scripts utiles

```bash
pnpm dev          # serveur de développement
pnpm build        # build de production
pnpm typecheck    # vérification TypeScript (tsc --noEmit)
pnpm test         # tests (Vitest)
pnpm db:migrate   # créer/appliquer une migration
pnpm db:seed      # (re)charger les données de démo
pnpm verif:paiement  # contrôle de la config de paiement (aucun encaissement)
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
    catalogue/     produits, catégories, axes & déclinaisons, marques, favoris
    commande/      panier (connecté + visiteur), commande, stock, rachat
    paiement/      PaymentProvider + hrskills / monetbil / mock, suivi, webhook
    promotion/     promotions vendeur, codes promo
    reversement/   commission, net à reverser, dette COD
    livraison/     transporteur, preuve, refus à la livraison
  lib/             env (Zod), client Prisma, helpers argent (XAF)
  validators/      schémas Zod des entrées
```

Convention : la logique métier pure vit dans des fichiers `*-core.ts`, sans base
ni réseau, et c'est elle qui porte les tests (`pnpm test`). Les fichiers voisins
sans suffixe font les accès base et orchestrent.
