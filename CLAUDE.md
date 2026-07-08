# CLAUDE.md — Règles permanentes du projet NILE Marketplace

> Ce fichier est relu par Claude Code à chaque session. Il définit le contexte et les règles non négociables du projet. Respecte-le en permanence, même si une instruction ponctuelle semble aller plus vite en l'ignorant.

## Contexte du projet
- **Produit** : NILE Marketplace — plateforme e-commerce, modèle marketplace **hybride** (stock propre + vendeurs tiers).
- **Marché** : Cameroun. Interface en **français**. Devise **FCFA / XAF**, sans décimales.
- **Développeur** : une seule personne (solo). Toutes les décisions techniques doivent optimiser la productivité et la maintenabilité pour un dev seul.
- **Plateforme cible** : web responsive **mobile-first**, pages **légères** (la data mobile est chère et rare au Cameroun).

## Règles d'architecture non négociables
1. **TypeScript strict partout.** Pas de `any` implicite. Le typage est notre premier filet anti-bug.
2. **Services managés > code maison.** Authentification, stockage de fichiers, envoi SMS/email : on délègue. On ne code JAMAIS l'authentification à la main.
3. **Secrets en variables d'environnement uniquement.** Aucune clé, aucun mot de passe, aucun identifiant Monetbil dans le code ou le dépôt. Un fichier `.env.example` documente les variables sans les valeurs.
4. **Validation de toutes les entrées** utilisateur, côté serveur, systématiquement.
5. **Transactions de base de données** pour toute opération multi-tables (commande + stock, paiement + statut…).
6. **Gestion d'erreurs explicite.** Jamais de `catch` vide ni d'erreur avalée silencieusement.
7. **Protection des routes par rôle** (acheteur / vendeur / admin) vérifiée côté serveur, jamais seulement côté client.

## Règles spécifiques au paiement
- L'agrégateur est **Monetbil** (MTN MoMo + Orange Money, Cameroun).
- Toute l'intégration passe derrière une interface abstraite **`PaymentProvider`** ; Monetbil en est une implémentation. Un provider **mock** existe pour le développement et les tests.
- Une commande n'est « payée » **que sur callback serveur Monetbil vérifié**, jamais sur le retour navigateur du client.
- **Ne jamais coder l'API Monetbil de mémoire.** Se référer à la doc officielle. En cas d'incertitude sur un champ ou un flux : le signaler et demander, pas deviner.

## Règles sur le paiement à la livraison (COD)
- `statut_commande` et `statut_paiement` sont **deux champs distincts**. Une commande peut avancer sans être payée.
- Chaque `Ligne_commande` porte un **`vendeur_id`** (commandes multi-vendeurs possibles).
- Garde-fous anti-fraude prévus dès le départ : plafond COD configurable, suivi des commandes non abouties par acheteur, gestion du refus à la livraison.

## Règle de vérification (définition de « terminé »)
Une tâche n'est **jamais** « terminée » tant que :
1. Le code **compile** sans erreur de type.
2. Le code **tourne** (lancé et testé, pas seulement écrit).
3. Les **cas limites** connus sont gérés (entrée vide, stock insuffisant, paiement échoué, accès non autorisé).
4. La logique critique (commande, paiement, permissions) a des **tests**.
Écrire du code ≠ code qui marche. Toujours exécuter avant de déclarer fait.

## Règle de discipline du périmètre (anti-dispersion)
Avant d'ajouter une fonctionnalité, se poser : « Une transaction complète (l'acheteur trouve un produit, paie, est livré) est-elle possible sans elle ? » Si oui → c'est hors MVP, on ne la construit pas maintenant. Cette discipline prime sur l'envie d'enrichir.

**Hors MVP (à ne pas construire) :** app native, messagerie interne, fidélité/coupons, recommandations, multi-devise/multi-pays, entrepôt multi-emplacements, portefeuille interne.

## Règle d'honnêteté
- Si tu n'es pas sûr d'une information (API externe, offre d'un service, tarif) : **dis-le clairement et demande**. Ne présente jamais une supposition comme un fait.
- Ne fabrique jamais une valeur de configuration, une clé d'API ou une référence de documentation. Si tu ne l'as pas, signale-le.

## Rythme de travail
- Construction **phase par phase** avec arrêt et validation humaine entre chaque phase (voir le master prompt).
- Avant une phase : annoncer le plan. Pendant : raisonner sur les cas limites. Après : indiquer comment tester et ce qui reste en suspens.
