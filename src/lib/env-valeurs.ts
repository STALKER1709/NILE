/**
 * Normalisation des valeurs d'environnement.
 *
 * Module volontairement SANS effet de bord : `@/lib/env` valide toute la
 * configuration au chargement et lève si elle est incomplète — comportement
 * voulu pour démarrer l'application, mais qui rend ses exports inutilisables
 * depuis un outil qui ne dispose que d'une partie des variables (le contrôle
 * avant vol du paiement, par exemple).
 */

/**
 * Retire les guillemets qui entourent une valeur.
 *
 * Dans un fichier `.env`, dotenv retire lui-même les guillemets : on écrit
 * donc `PAYMENT_PROVIDER="hrskills"`. L'interface de Vercel, elle, enregistre
 * la valeur littéralement — recopier la ligne telle quelle y produit la chaîne
 * `"hrskills"`, guillemets compris.
 *
 * Sur une énumération l'erreur est bruyante, donc bénigne. Sur une clé d'API
 * elle est silencieuse et bien plus coûteuse : la clé part avec ses
 * guillemets, le fournisseur répond « clé invalide », et on cherche le
 * problème du mauvais côté. On normalise donc à l'entrée.
 *
 * Une valeur légitime commençant ET finissant par un guillemet serait altérée ;
 * le cas ne se rencontre pas parmi les variables déclarées ici (identifiants,
 * URL, énumérations, nombres).
 */
export function sansGuillemets(valeur: string): string {
  const t = valeur.trim();
  if (t.length >= 2) {
    const debut = t[0];
    if ((debut === '"' || debut === "'") && t[t.length - 1] === debut) {
      return t.slice(1, -1);
    }
  }
  return t;
}
