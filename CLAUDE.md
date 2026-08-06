# CLAUDE.md — Règles permanentes du projet NILE Marketplace

> Ce fichier est relu par Claude Code à chaque session. Il définit le contexte et les règles non négociables du projet. Respecte-le en permanence, même si une instruction ponctuelle semble aller plus vite en l'ignorant.

## Contexte du projet
- **Produit** : NILE Marketplace — plateforme e-commerce, modèle marketplace **hybride** (stock propre + vendeurs tiers).
- **Marché** : Cameroun. Interface en **français**. Devise **FCFA / XAF**, sans décimales.
- **Développeur** : une seule personne (solo). Toutes les décisions techniques doivent optimiser la productivité et la maintenabilité pour un dev seul.
- **Plateforme cible** : web responsive **mobile-first**, pages **légères** (la data mobile est chère et rare au Cameroun).

## État du projet
- **MVP livré** (phases 0 → 5), puis quatre chantiers : déclinaisons, marques & navigation par rayons, codes promo, liste de souhaits.
- **Le paiement n'est PAS en live.** L'intégration HR-Skills est éprouvée en sandbox ; le passage en production (KYC, clés `live`, webhook Live, `CRON_SECRET`) reste à faire.
- **En attente, sur décision du propriétaire** : paiement des dettes vendeurs (prévu après le live), points de fidélité, abonnements vendeurs, parrainage.

## Règles d'architecture non négociables
1. **TypeScript strict partout.** Pas de `any` implicite. Le typage est notre premier filet anti-bug.
2. **Services managés > code maison.** Authentification, stockage de fichiers, envoi SMS/email : on délègue. On ne code JAMAIS l'authentification à la main.
3. **Secrets en variables d'environnement uniquement.** Aucune clé, aucun mot de passe, aucun identifiant d'agrégateur de paiement dans le code ou le dépôt. Un fichier `.env.example` documente les variables sans les valeurs.
4. **Validation de toutes les entrées** utilisateur, côté serveur, systématiquement.
5. **Transactions de base de données** pour toute opération multi-tables (commande + stock, paiement + statut…).
6. **Gestion d'erreurs explicite.** Jamais de `catch` vide ni d'erreur avalée silencieusement.
7. **Protection des routes par rôle** (acheteur / vendeur / admin) vérifiée côté serveur, jamais seulement côté client.

## Règles spécifiques au paiement
- L'agrégateur retenu est **HR-Skills Pay** (MTN MoMo + Orange Money, Cameroun). L'intégration **Monetbil** existe toujours dans le dépôt mais n'est plus utilisée.
- Toute l'intégration passe derrière une interface abstraite **`PaymentProvider`** ; HR-Skills et Monetbil en sont deux implémentations. Un provider **mock** existe pour le développement et les tests.
- Une commande n'est « payée » **que sur statut vérifié auprès du fournisseur** — notification signée, ou relecture à notre initiative. Jamais sur le retour navigateur du client.
- Le webhook n'est pas une garantie : il peut ne jamais partir. Deux filets le complètent, et doivent le rester — la relecture pendant l'attente de l'acheteur, et le balayage périodique des paiements en attente.
- **Ne jamais coder une API de paiement de mémoire.** Se référer à la doc officielle. En cas d'incertitude sur un champ ou un flux : le signaler et demander, pas deviner.
- L'agrégateur prélève **2 %** sur chaque encaissement (constaté, sa documentation annonce 1 %). La commission NILE doit toujours couvrir ce prélèvement — voir `COMMISSION_POURCENT`.

## Règles sur le paiement à la livraison (COD)
- `statut_commande` et `statut_paiement` sont **deux champs distincts**. Une commande peut avancer sans être payée.
- Chaque `Ligne_commande` porte un **`vendeur_id`** (commandes multi-vendeurs possibles).
- Garde-fous anti-fraude prévus dès le départ : plafond COD configurable, suivi des commandes non abouties par acheteur, gestion du refus à la livraison.
- **Les espèces ne transitent pas par NILE** : le vendeur les encaisse à la livraison. La commission est pourtant due sur ces ventes aussi — elle est donc **prélevée sur les encaissements Mobile Money** du vendeur. Son net à reverser peut devenir négatif : la différence est une **dette**.
- Au-delà de `COD_DETTE_PLAFOND_XAF`, le COD est **refusé** sur les articles de ce vendeur, vérification **côté serveur** (l'écran de commande ne fait que l'anticiper). Le mécanisme s'auto-corrige : les ventes suivantes passent par NILE.

## Règles sur les déclinaisons
- Un produit possède **toujours au moins une déclinaison**. Le panier et la commande ne connaissent qu'elles ; un produit sans déclinaison est invendable.
- Un produit a **soit** la déclinaison par défaut (deux axes vides), **soit** de vraies déclinaisons — jamais les deux. Sinon on pourrait acheter « sans choisir de taille » en parallèle des tailles réelles.
- Les axes (leur nom, leurs valeurs, **leur ordre d'affichage**) sont déclarés par la **catégorie**. Ne jamais coder en dur une taille, une pointure ou une couleur : c'est ce qui rend impossible de demander une télévision « en taille M ».
- Toute combinaison enregistrée est **validée côté serveur** contre les axes de la catégorie. Une liste déroulante ne protège de rien.
- `Produit.stock` est un **champ historique**. Il n'est ni lu ni décrémenté à la vente : le stock vit sur la déclinaison, et c'est elle qu'on décrémente **et** qu'on recrédite (annulation, paiement échoué, refus à la livraison). Tout écran qui affiche `Produit.stock` est un bug.

## Règle de vérification (définition de « terminé »)
Une tâche n'est **jamais** « terminée » tant que :
1. Le code **compile** sans erreur de type.
2. Le code **tourne** (lancé et testé, pas seulement écrit).
3. Les **cas limites** connus sont gérés (entrée vide, stock insuffisant, paiement échoué, accès non autorisé).
4. La logique critique (commande, paiement, permissions) a des **tests**.
Écrire du code ≠ code qui marche. Toujours exécuter avant de déclarer fait.

## Règle de discipline du périmètre (anti-dispersion)
Avant d'ajouter une fonctionnalité, se poser : « Une transaction complète (l'acheteur trouve un produit, paie, est livré) est-elle possible sans elle ? » Si oui → c'est hors MVP, on ne la construit pas maintenant. Cette discipline prime sur l'envie d'enrichir.

**Hors MVP (à ne pas construire) :** app native, messagerie interne, programme de fidélité, parrainage, recommandations, multi-devise/multi-pays, entrepôt multi-emplacements, portefeuille interne.

**Exceptions assumées** (construites sur décision explicite du propriétaire, bien qu'elles échouent au test ci-dessus). Cette liste doit rester à jour : une exception non écrite vide la règle de sa force.

1. **Codes promo.** Émis par NILE seule, valables en Mobile Money uniquement, à usage unique par acheteur. La remise sort de la marge de la plateforme — le vendeur reste payé au prix plein. Toute extension de ce mécanisme (parrainage, fidélité) reste hors MVP.
2. **Liste de souhaits (favoris).** Rattachée au produit, pas à une déclinaison. Réservée aux personnes connectées. Elle ne réserve aucun stock et n'engage personne — elle ne doit rien ajouter au parcours de commande.

**Ne relèvent PAS de l'exception**, malgré les apparences : les **déclinaisons** (sans choix de taille, un vêtement ne se vend pas — la transaction est impossible sans elles) et les **marques** (repère de recherche du catalogue).

## Règle d'honnêteté
- Si tu n'es pas sûr d'une information (API externe, offre d'un service, tarif) : **dis-le clairement et demande**. Ne présente jamais une supposition comme un fait.
- Ne fabrique jamais une valeur de configuration, une clé d'API ou une référence de documentation. Si tu ne l'as pas, signale-le.

## Rythme de travail
- Construction **phase par phase** avec arrêt et validation humaine entre chaque phase (voir le master prompt). Les phases 0 → 5 étant livrées, le travail se fait désormais par **incréments**, mais la règle ne change pas : un incrément par fois, validé avant le suivant.
- Avant : annoncer le plan. Pendant : raisonner sur les cas limites. Après : indiquer comment tester et ce qui reste en suspens.
- **Ne pousser sur `main` que sur demande explicite**, et jamais avant que les migrations éventuelles aient été appliquées en base — sans quoi le déploiement casse.
