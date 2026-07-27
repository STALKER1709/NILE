# Design System NILE Marketplace (Spécifications UI Stitch)

Ce document récapitule les spécifications du système de design pour la marketplace **NILE** (mobile-first, responsive, Cameroun).

---

## 1. Palette de Couleurs (Color System)

### Couleurs Principales (NILE Brand - Teal / Émeraude)
- **`nile-50`** : `#f0fdfa` (Fond d'accentuation ultra-léger, badges doux)
- **`nile-100`** : `#ccfbf1` (Surbrillance, sélection, badges d'état)
- **`nile-200`** : `#99f6e4` (Bordures actives, séparateurs subtils)
- **`nile-500`** : `#14b8a6` (Éléments interactifs secondaires, icônes)
- **`nile-600`** : `#0d9488` (Boutons principaux, états survolés)
- **`nile-700`** : `#0f766e` (Couleur de marque primaire, accent fort)
- **`nile-800`** : `#115e59` (Bannières secondaires, barres de navigation)
- **`nile-900`** : `#0a3d38` (En-tête principal, typographie forte)
- **`nile-950`** : `#042f2e` (Pied de page, cartes sombres)

### Couleurs d'Accentuation & CTA (Warm Gold / Amber)
- **`accent-400`** : `#fbbf24` (Avis / Étoiles)
- **`accent-500` (DEFAULT)** : `#f59e0b` (Boutons d'achat rapide, badges de panier, CTA secondaire)
- **`accent-600` (DARK)** : `#d97706` (Survol des boutons d'accent)

### Prix & Offres Promotions (Marketplace Coral / Red)
- **`promo-500` (DEFAULT)** : `#ef4444` (Badges de réduction, prix barrés, promo)
- **`promo-600`** : `#dc2626` (Prix fort)
- **`promo-700` (DARK)** : `#b91c1c` (Urgence / fin de stock)

### Neutres & Arrière-plans (Slate / Neutral Gray)
- **`bg-page`** : `#f8fafc` (Fond global de la plateforme)
- **`bg-card`** : `#ffffff` (Fond des cartes produits, boutiques et conteneurs)
- **`text-primary`** : `#0f172a` (Titres, noms de produits, prix)
- **`text-secondary`** : `#475569` (Descriptions, sous-titres, libellés)
- **`text-muted`** : `#94a3b8` (Texte secondaire, placeholders, dates)
- **`border-subtle`** : `#f1f5f9` (Bordures légères)
- **`border-default`** : `#e2e8f0` (Bordures de cartes et champs de formulaire)

### Paiements Mobiles & Confiance
- **`momo-yellow`** : `#ffcc00` (Signal visuel MTN MoMo)
- **`orange-money`** : `#ff6600` (Signal visuel Orange Money)
- **`success-green`** : `#10b981` (Paiement à la livraison / En stock)

---

## 2. Typographie (Typography Scale)

| Token | Taille (rem / px) | Interlignage | Usage |
| :--- | :--- | :--- | :--- |
| `text-2xs` | `0.65rem` / `10.4px` | `1rem` | Micro-badges, métadonnées de stock |
| `text-xs` | `0.75rem` / `12px` | `1rem` | Étiquettes, avis, dates, garanties |
| `text-sm` | `0.875rem` / `14px` | `1.25rem` | Descriptions, boutons secondaires, filtres |
| `text-base` | `1rem` / `16px` | `1.5rem` | Corps de texte, nom de produit, inputs |
| `text-lg` | `1.125rem` / `18px` | `1.75rem` | Titres de sections, sous-en-têtes |
| `text-xl` | `1.25rem` / `20px` | `1.75rem` | Prix principaux, titres de cartes héro |
| `text-2xl` | `1.5rem` / `24px` | `2rem` | Grands prix, en-têtes de pages |
| `text-3xl` | `1.875rem` / `30px` | `2.25rem` | Bannières promotionnelles, héros |

---

## 3. Rayons de Bordure (Border Radii)

- **`rounded-sm`** (`0.25rem` / `4px`) : Badges ultra-compacts
- **`rounded-md`** (`0.375rem` / `6px`) : Icônes d'en-tête, petits boutons
- **`rounded-lg`** (`0.5rem` / `8px`) : Champs de saisie (inputs), boutons standards
- **`rounded-xl`** (`0.75rem` / `12px`) : Cartes produits, blocs de garanties
- **`rounded-2xl`** (`1rem` / `16px`) : Bannières de carrousel, conteneurs principaux, modals
- **`rounded-full`** (`9999px`) : Pills de stock, pastilles de notification panier, bulles de chat

---

## 4. Ombres & Effets Visuels (Shadows & Effects)

- **`shadow-carte`** : `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
  - *Usage* : État repos des cartes produits, catégories et boutiques.
- **`shadow-carte-hover`** : `0 10px 25px -5px rgba(15, 118, 110, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`
  - *Usage* : État survol (hover/active) avec lueur subtile NILE.
- **`shadow-flottant`** : `0 12px 32px -4px rgba(15, 118, 110, 0.18)`
  - *Usage* : Modals, dropdowns, navigation mobile fixe.
- **`glassmorphism`** : `backdrop-blur-md bg-white/90 border border-white/20`
  - *Usage* : En-tête fixe et éléments superposés.

---

## 5. Espacements & Structure des Composants

### Grille & Conteneurs
- **Conteneur Principal** : `max-w-6xl mx-auto px-3 sm:px-4 lg:px-6`
- **Grille Produit Mobile-First** : `grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6`
- **Grille de Rayons / Garanties** : `grid grid-cols-1 sm:grid-cols-3 gap-3`

### Composants Clés
1. **`CarteProduit`** :
   - Hauteur uniforme, image responsive avec ratio 1:1, badge promo en haut à gauche.
   - Prix mis en valeur (`text-nile-900` ou `text-promo`), statut de stock et bouton rapide « Ajouter au panier ».
2. **`Entete`** :
   - Fond sombre `nile-900` hautement contrasté, barre de recherche centrale responsive, indicateur de livraison Cameroun 🇨🇲, accès direct au panier avec badge dynamique.
3. **`NavMobile`** :
   - Fixée en bas de l'écran (`fixed bottom-0 left-0 right-0 z-40`), effet verre dépoli (`backdrop-blur-md bg-white/95`), icônes tactiles de 44px+ pour un confort optimal sur mobile.
4. **`Carrousel` & `Bannières`** :
   - Coins arrondis `rounded-2xl`, gradients dynamiques `from-nile-900 via-nile-800 to-nile-950` avec éléments d'appel à l'action clairs.
