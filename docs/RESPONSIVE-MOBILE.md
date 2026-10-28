# NILE — matrice de validation responsive mobile

## Règle de conception

NILE est conçu **mobile-first** : les composants doivent utiliser l'espace disponible et changer de disposition quand le contenu en a besoin, plutôt que viser un modèle de téléphone précis. Les seuils Tailwind existants (sm 640 px, md 768 px, lg 1024 px, xl 1280 px) servent de points de départ ; un composant peut avoir un seuil différent si son contenu le justifie.

Références :
- MDN — Responsive design : https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design
- MDN — Media query fundamentals et choix des breakpoints : https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries
- W3C WAI — Target Size (Enhanced), 44 × 44 CSS px : https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- NICE Design System — cibles tactiles de 48 × 48 dp : https://design-system.nice.org.uk/foundations/responsive/

## Viewports de contrôle

Ces tailles sont des **tailles de test**, pas une liste de breakpoints CSS à coder en dur.

| Largeur CSS | Usage de validation |
| ---: | --- |
| 320 px | écran très étroit : aucun contenu ni action essentielle ne doit être coupé |
| 360 px | petit mobile Android |
| 390 px | mobile courant, portrait |
| 430 px | grand mobile, portrait |
| 768 px | tablette portrait / bascule vers une mise en page plus large |
| 1024 px | tablette paysage / petit ordinateur |
| 1280 px | ordinateur standard |
| 1440 px | grand écran |

Tester également l'orientation paysage sur mobile et le zoom navigateur à 200 % lorsque le scénario s'y prête.

## Parcours à valider

1. **Public** : accueil, navigation et recherche, catégories, catalogue/tri/filtres/pagination, boutique, fiche produit et galerie, promotions, Reels, centre d'aide, contact et pages légales.
2. **Authentification** : connexion, inscription, accès refusé, mot de passe oublié et réinitialisation, y compris les erreurs de validation.
3. **Client** : vue d'ensemble, profil, favoris, panier vide et rempli, modification des quantités, commande, formulaire d'adresse/livraison, suivi et détail de commande.
4. **Vendeur** : tableau de bord, création/édition de produit, images, variantes/couleurs/tailles, liste de produits, commandes et transitions de statut, finances, KYC, promotions, Reels et annonces.
5. **Administration** : vue d'ensemble, commandes et détails, vendeurs et détails, modération, catégories/axes, codes promo, reversements, réconciliation, annonces et maintenance.

## Checklist de chaque écran

- Aucun débordement horizontal de la page entière ; les tables ou rubans de navigation défilent localement si nécessaire.
- Ordre de lecture logique ; colonnes multiples empilées quand elles deviennent trop étroites.
- Titres, montants, libellés longs et messages d'erreur restent lisibles sans être tronqués.
- Cibles tactiles d'au moins 44 × 44 CSS px, avec 48 px visés pour les actions principales.
- Champs utilisables avec clavier mobile : taille de texte de 16 px minimum sur mobile pour éviter le zoom automatique iOS.
- Boutons principaux visibles et accessibles ; pas d'action importante masquée derrière un survol.
- Barres fixes, panneaux et dialogues respectent les safe areas et la hauteur disponible en paysage.
- Images proportionnelles ; aucune carte produit ne déborde de sa colonne.
- États chargement, vide, erreur et succès vérifiés, ainsi que validation de formulaire.
- Les parcours restent testables au clavier et avec le zoom.

## État des vérifications

Les ajustements CSS transversaux ajoutés dans ce chantier renforcent les tables scrollables sur mobile, les cibles tactiles, les formulaires, les dialogues et les écrans très étroits. Ils ne remplacent pas une validation visuelle réelle de chaque parcours. Les captures par route/appareil et les essais sur appareils physiques restent à joindre au ticket de validation mobile avant de déclarer l'audit terminé.

## Critères de sortie

- [ ] Tous les parcours ci-dessus testés aux largeurs 360, 390 et 430 px.
- [ ] Contrôle complémentaire à 320 px, 768 px et 1024 px.
- [ ] Pas de défilement horizontal global involontaire.
- [ ] Aucun contrôle essentiel inaccessible ou recouvert.
- [ ] Tests automatiques, typecheck et build réussis.
- [ ] Résultats et limites documentés avant fusion sur `main`.
