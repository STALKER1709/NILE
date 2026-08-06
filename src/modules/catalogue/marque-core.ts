/**
 * Normalisation des marques (logique PURE, testable sans base).
 *
 * Les marques sont saisies librement par les vendeurs — imposer un
 * référentiel fermé demanderait un écran d'administration et bloquerait le
 * premier vendeur qui vend une marque absente de la liste. Le prix de cette
 * liberté, c'est que « gucci », « Gucci » et « GUCCI  » deviendraient trois
 * marques distinctes, et le filtre du catalogue serait inutilisable.
 *
 * D'où cette normalisation à l'écriture, qui les fait converger sans rien
 * interdire.
 */

/**
 * Forme retenue pour l'affichage et le stockage.
 *
 * Espaces réduits, extrémités coupées. La casse n'est PAS uniformisée
 * aveuglément : « LG », « H&M » ou « ASOS » perdraient leur identité si on les
 * passait en capitale initiale. On ne corrige donc que la saisie entièrement
 * en minuscules — le cas de la frappe rapide — en laissant tout le reste tel
 * que le vendeur l'a écrit.
 */
export function normaliserMarque(saisie: string): string {
  const propre = saisie.trim().replace(/\s+/g, " ");
  if (!propre) return "";
  if (propre !== propre.toLowerCase()) return propre;

  // Chaque mot prend une capitale : « yves saint laurent » -> « Yves Saint
  // Laurent ». Les séparateurs internes sont préservés (« h&m » -> « H&M »).
  return propre.replace(/(^|[\s&'\-.])([a-zà-ÿ])/g, (_, avant: string, lettre: string) =>
    avant + lettre.toUpperCase(),
  );
}

/**
 * Clé de comparaison : deux saisies désignent-elles la même marque ?
 *
 * Sert à regrouper des valeurs déjà en base, écrites avant cette
 * normalisation ou par des vendeurs différents. Insensible à la casse et aux
 * accents — « Lacoste » et « lacôste » ne doivent pas former deux entrées de
 * filtre.
 */
export function cleMarque(marque: string): string {
  return marque
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Regroupe des marques équivalentes en une seule entrée affichable.
 *
 * La forme conservée est la PLUS FRÉQUENTE : si dix vendeurs ont écrit
 * « Nike » et un seul « NIKE », c'est la première qui s'affiche. À égalité, la
 * première rencontrée gagne, ce qui rend le résultat stable d'un appel à
 * l'autre.
 */
export function regrouperMarques(marques: string[]): string[] {
  const groupes = new Map<string, Map<string, number>>();
  for (const brute of marques) {
    const marque = brute.trim();
    if (!marque) continue;
    const cle = cleMarque(marque);
    const formes = groupes.get(cle) ?? new Map<string, number>();
    formes.set(marque, (formes.get(marque) ?? 0) + 1);
    groupes.set(cle, formes);
  }

  const retenues: string[] = [];
  for (const formes of groupes.values()) {
    let meilleure = "";
    let meilleurCompte = -1;
    for (const [forme, compte] of formes) {
      if (compte > meilleurCompte) {
        meilleure = forme;
        meilleurCompte = compte;
      }
    }
    retenues.push(meilleure);
  }
  return retenues.sort((a, b) => a.localeCompare(b, "fr"));
}
