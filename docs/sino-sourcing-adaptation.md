# Adaptation des bonnes pratiques de Sino Sourcing à NILE

## Objectif

Améliorer la confiance et la conversion de NILE en reprenant les principes utiles observés sur Sino Sourcing, sans copier son modèle d'importation Chine-Afrique ni introduire de promesses logistiques non prises en charge par NILE.

## Changements livrés dans cette passe

- Afficher un repère explicite « Boutique validée » sur les cartes produit, car les parcours publics de NILE n'exposent que les produits actifs des boutiques validées.
- Renforcer le message de validation des boutiques sur la page d'accueil.
- Clarifier le texte de suivi de commande sans inventer de délai ou de numéro de tracking externe.
- Préremplir le raccourci WhatsApp d’assistance avec le numéro et le statut de la commande pour réduire les échanges de clarification.
- Afficher sur la fiche produit le délai indicatif déjà configuré dans `DELAI_LIVRAISON_TEXTE`, avec un lien vers le centre d’aide ; aucun délai n’est codé en dur.

## Capacités déjà présentes dans NILE

- Recherche catalogue et filtres de produits, catégories, marques et prix.
- Promotions réelles, codes promotionnels et favoris.
- Notes et avis publiables après livraison.
- Suivi de commande par étapes et notifications de changement de statut.
- Validation des boutiques, modération des produits et centre d'aide.
- Affichage des prix en FCFA et options de règlement selon l'éligibilité de la commande.

## À ne pas copier sans une décision produit et un vrai support technique

- Prix « tout compris » incluant transport international et douane : le modèle NILE est une marketplace locale et ne calcule pas une chaîne logistique d'importation. Ne pas afficher de frais ou délais inventés.
- Recherche par image : nécessite un moteur de recherche visuelle, une stratégie d'indexation et une infrastructure de stockage/traitement.
- Tarifs dégressifs par quantité : nécessite un modèle tarifaire vendeur, son interface de gestion, des règles de panier et des tests de calcul.
- Réclamations et retours structurés : nécessite une politique validée, des états de dossier, des pièces justificatives, des délais et une résolution côté vendeur/admin.
- Multilingue complet et mode sombre : sont des chantiers transversaux qui doivent couvrir toutes les routes et tous les composants, pas seulement la vitrine.

## Garde-fous

- Aucun changement au code Brevo ni au système de paiement.
- Aucun tarif, délai de livraison, volume de vente ou label de confiance inventé.
- Les prochaines fonctionnalités doivent être développées dans des branches dédiées, testées (typecheck, suite Vitest et build) puis vérifiées avant fusion sur `main`.
