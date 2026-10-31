# Politique vendeurs NILE — règles validées

Dernière validation propriétaire : 31 octobre 2026.

## Vérification d'identité (KYC)

### Vendeur particulier
- Une pièce officielle au choix selon disponibilité : Carte nationale d'identité (CNI) OU passeport.
- Une seule pièce suffit si elle est lisible, en cours de validité et correspond aux informations du compte.

### Vendeur entreprise
- Document d'identification de l'entreprise.
- Pièce d'identité du représentant légal ou de la personne autorisée à engager l'entreprise.

### Traitement
- Délai cible : 48 heures ouvrées à compter de la réception d'un dossier complet.
- États de parcours à prévoir : NON_DEPOSE, A_COMPLETER, EN_REVISION, VALIDE, REJETE, SUSPENDU.
- Toute demande de complément ou tout rejet doit comporter un motif explicite, compréhensible et actionnable.
- Le statut commercial existant Vendeur.statutValidation reste la source de vérité de l'activation de la boutique ; ne pas créer un second statut concurrent sans migration de transition.

### Sécurité obligatoire avant activation du téléversement
- Bucket Supabase privé exclusivement ; aucun lien public, aucune URL permanente.
- Autorisation serveur : le vendeur ne peut téléverser/lire que son propre dossier ; l'administrateur autorisé peut consulter les dossiers pour instruction.
- Accès aux fichiers via URL signée de courte durée, émise après vérification du rôle et de la propriété.
- Limiter les formats à PDF/JPEG/PNG, vérifier MIME réel et taille maximale côté serveur, renommer les objets avec UUID.
- Ne jamais enregistrer le binaire, une URL signée ou un document dans Vendeur.infosPaiement.
- Journaliser les décisions et accès administratifs sans recopier les numéros de pièces dans les logs.
- Définir et afficher une notice de confidentialité, une durée de conservation et une procédure de suppression/archivage avant la mise en production du KYC.

## Reversements

- Fréquence : traitement en lot une fois par semaine par l'administration.
- Minimum d'une demande : 10 000 FCFA.
- Commission NILE : 12 % (règle existante, inchangée).
- Frais de reversement supplémentaires facturés par NILE : 0 FCFA.
- Canaux de reversement : MTN MoMo et Orange Money, selon les coordonnées enregistrées et vérifiées du vendeur.
- Éligibilité : boutique validée, ventes Mobile Money livrées et payées, solde disponible suffisant.
- COD : les espèces déjà encaissées par le vendeur ne sont jamais reversées une seconde fois ; la commission COD reste calculée selon la règle existante.
- Le transfert reste manuel par l'administration ; la demande du vendeur réserve le solde et ne constitue pas une preuve de paiement. L'admin ne marque PAYE qu'après exécution effective du transfert et conservation de sa référence.

## Paramètres opérationnels restant à définir
- Le jour exact du lot hebdomadaire n'est pas fixé : l'administration choisit son créneau récurrent.
- Le nom du titulaire Mobile Money doit être rapproché du titulaire déclaré ; la procédure de vérification renforcée reste à définir.
- La durée légale de conservation et les modalités exactes d'exercice des droits sur les pièces KYC doivent être validées avec un conseil compétent au Cameroun avant ouverture de la collecte documentaire.
