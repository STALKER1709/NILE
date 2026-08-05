/**
 * Clés HR-Skills et environnement (test / live).
 *
 * Module volontairement SANS dépendance à `node:crypto`, ni à quoi que ce soit
 * de spécifique à Node : il est importé par `@/lib/env`, lui-même chargé par le
 * middleware, qui tourne sur le runtime Edge. Une seule importation de
 * `node:crypto` dans cette chaîne fait échouer le build — et ni `tsc` ni les
 * tests unitaires ne le détectent, seul `next build` le voit.
 *
 * Tout ce qui a besoin de hachage vit dans `hrskills-core`, qui importe ce
 * fichier et n'est jamais atteint depuis le middleware.
 */

export type EnvironnementHrSkills = "test" | "live";

/**
 * Environnement porté par une clé, lu sur son préfixe (`hrsk_pk_live_…`,
 * `hrsk_sk_test_…`). C'est la SEULE chose qui distingue sandbox de production :
 * l'hôte de l'API est le même des deux côtés.
 *
 * Renvoie `null` si la clé ne porte aucun des deux marqueurs — cas traité comme
 * une erreur de configuration par l'appelant, jamais comme « production » par
 * défaut : partir en live sur une clé illisible est le pire des deux échecs.
 */
export function environnementCle(cle: string): EnvironnementHrSkills | null {
  if (cle.includes("_test_")) return "test";
  if (cle.includes("_live_")) return "live";
  return null;
}

export function estCleDeTest(cle: string): boolean {
  return environnementCle(cle) === "test";
}

/**
 * Les deux clés désignent-elles bien le même environnement ?
 *
 * La Clé A et la Clé B sont copiées séparément depuis le tableau de bord :
 * rien n'empêche matériellement d'associer une Clé A live à une Clé B de test.
 * L'application choisissant son chemin d'après la Clé A, un tel mélange
 * enverrait des appels de production authentifiés par un secret de test — ou
 * l'inverse. On refuse de démarrer plutôt que de le découvrir en paiement.
 */
export function clesCoherentes(cleA: string, cleB: string): boolean {
  const a = environnementCle(cleA);
  return a !== null && a === environnementCle(cleB);
}

/**
 * Racine des appels qui consomment le token de transaction.
 *
 * En test, ces appels ne sont servis que sous `/sandbox` ; ailleurs l'API
 * renvoie un 403 `sandbox_path_required`. En production, aucun préfixe. La
 * fonction est idempotente : une base déjà terminée par `/sandbox` n'est pas
 * préfixée deux fois.
 *
 * ⚠️ Ce préfixe ne vient PAS de la documentation, qui n'en parle nulle part :
 * il vient du refus renvoyé par l'API avec des clés de test, et il est depuis
 * CONFIRMÉ en sandbox — `/sandbox/api/v1/payin/mobile-money` répond. Comme
 * rien ne le documente, il reste susceptible de disparaître sans préavis : si
 * les encaissements de test se mettaient un jour à répondre 404, c'est ici
 * qu'il faut regarder en premier.
 *
 * L'échange des clés contre un token (`/v1/auth/transaction-token`) n'est PAS
 * concerné : il fonctionne avec des clés de test sur le chemin normal — c'est
 * vérifié, cet appel aboutit là où le paiement était refusé.
 */
export function racineHrSkills(baseUrl: string, cle: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (!estCleDeTest(cle)) return base;
  return base.endsWith("/sandbox") ? base : `${base}/sandbox`;
}
