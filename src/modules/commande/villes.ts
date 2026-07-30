/**
 * Villes de livraison proposées à la commande, groupées par région
 * administrative (les dix régions du Cameroun). Le chef-lieu ouvre chaque
 * groupe, les autres villes suivent par ordre alphabétique.
 *
 * La liste couvre les villes principales, pas la totalité des localités : le
 * champ de commande garde donc une option « Autre ville » en texte libre,
 * indispensable pour un adressage informel.
 */

export interface RegionVilles {
  region: string;
  villes: string[];
}

/** Valeur du choix « Autre ville » dans le select. */
export const VILLE_AUTRE = "AUTRE";

export const VILLES_CAMEROUN: RegionVilles[] = [
  {
    region: "Littoral",
    villes: ["Douala", "Edéa", "Loum", "Manjo", "Mbanga", "Nkongsamba", "Yabassi"],
  },
  {
    region: "Centre",
    villes: [
      "Yaoundé",
      "Akonolinga",
      "Bafia",
      "Eséka",
      "Mbalmayo",
      "Mfou",
      "Nanga-Eboko",
      "Obala",
    ],
  },
  {
    region: "Ouest",
    villes: [
      "Bafoussam",
      "Bafang",
      "Bandjoun",
      "Bangangté",
      "Dschang",
      "Foumban",
      "Foumbot",
      "Mbouda",
    ],
  },
  {
    region: "Sud-Ouest",
    villes: ["Buéa", "Kumba", "Limbé", "Mamfé", "Mundemba", "Tiko"],
  },
  {
    region: "Nord-Ouest",
    villes: ["Bamenda", "Batibo", "Fundong", "Kumbo", "Mbengwi", "Ndop", "Nkambé", "Wum"],
  },
  {
    region: "Sud",
    villes: ["Ebolowa", "Ambam", "Djoum", "Kribi", "Sangmélima"],
  },
  {
    region: "Est",
    villes: ["Bertoua", "Abong-Mbang", "Batouri", "Bélabo", "Garoua-Boulaï", "Yokadouma"],
  },
  {
    region: "Adamaoua",
    villes: ["Ngaoundéré", "Banyo", "Meiganga", "Tibati"],
  },
  {
    region: "Nord",
    villes: ["Garoua", "Figuil", "Guider", "Lagdo", "Poli", "Tcholliré"],
  },
  {
    region: "Extrême-Nord",
    villes: ["Maroua", "Kaélé", "Kousséri", "Mokolo", "Mora", "Yagoua"],
  },
];

/** Toutes les villes de la liste, à plat. */
export function listerVilles(): string[] {
  return VILLES_CAMEROUN.flatMap((r) => r.villes);
}

/** Vrai si la ville figure dans la liste proposée (comparaison exacte). */
export function estVilleConnue(ville: string): boolean {
  return listerVilles().includes(ville);
}

/**
 * Résout la ville soumise par le formulaire : la valeur du select, ou le
 * champ libre quand l'acheteur a choisi « Autre ville ».
 */
export function resoudreVille(
  choix: string | null | undefined,
  villeLibre: string | null | undefined,
): string {
  const selection = (choix ?? "").trim();
  if (selection === VILLE_AUTRE) return (villeLibre ?? "").trim();
  return selection;
}
