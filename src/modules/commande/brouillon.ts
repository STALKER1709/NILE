import { cookies } from "next/headers";

/**
 * Brouillon de l'écran de commande — ce que l'acheteur avait saisi.
 *
 * Cet écran refuse régulièrement, et pour de bonnes raisons : stock parti
 * entre-temps, plafond du paiement à la livraison dépassé, vendeur bloqué par
 * sa dette, code promo hors de son mode. Chacun de ces refus repassait par une
 * redirection, donc par un rendu neuf du formulaire — et l'acheteur retrouvait
 * une adresse vide à retaper en entier. Sur une connexion mobile facturée à la
 * donnée, c'est ainsi qu'on perd un panier.
 *
 * Le brouillon est gardé dans un cookie, et pas ailleurs, pour trois raisons :
 *
 * 1. il survit à une redirection sans exiger de JavaScript, comme le reste de
 *    cet écran ;
 * 2. il ne met aucune donnée personnelle dans l'URL, où elle finirait dans
 *    l'historique du navigateur, l'en-tête `Referer` et les journaux serveur ;
 * 3. s'il manque, expire ou devient illisible, le formulaire s'affiche vide —
 *    c'est-à-dire exactement le comportement d'avant. Il ne peut rien casser.
 *
 * `path` le limite à `/commander` : il ne pèse donc sur aucune autre requête.
 */

const COOKIE = "nile_commande_brouillon";
/**
 * Quinze minutes : de quoi corriger ce qui a été refusé et revalider, sans
 * qu'une adresse ressurgisse des jours plus tard sur un appareil partagé.
 */
const DUREE_S = 15 * 60;

export interface BrouillonCommande {
  destNom?: string;
  destTelephone?: string;
  ville?: string;
  quartier?: string;
  reperes?: string;
  mode?: string;
  operateur?: string;
  codePromo?: string;
}

/** Longueurs bornées : un cookie dépassant 4 Ko serait tronqué, donc perdu. */
const MAX = 500;

function borner(valeur: unknown): string | undefined {
  if (typeof valeur !== "string") return undefined;
  const t = valeur.trim();
  return t ? t.slice(0, MAX) : undefined;
}

/** Lecture tolérante : tout contenu douteux est traité comme une absence. */
export async function lireBrouillon(): Promise<BrouillonCommande> {
  const brut = (await cookies()).get(COOKIE)?.value;
  if (!brut) return {};
  try {
    const data = JSON.parse(brut) as unknown;
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    const d = data as Record<string, unknown>;
    return {
      destNom: borner(d.destNom),
      destTelephone: borner(d.destTelephone),
      ville: borner(d.ville),
      quartier: borner(d.quartier),
      reperes: borner(d.reperes),
      mode: borner(d.mode),
      operateur: borner(d.operateur),
      codePromo: borner(d.codePromo),
    };
  } catch {
    return {};
  }
}

/**
 * Conserve la saisie, à n'appeler que sur un échec.
 *
 * N'est pas fatal : si l'écriture échoue, l'acheteur retrouve le formulaire
 * vide — désagréable, mais c'est le comportement d'avant, et il ne faut
 * surtout pas que cela masque le message d'erreur qui, lui, compte.
 */
export async function ecrireBrouillon(valeurs: BrouillonCommande): Promise<void> {
  try {
    const propre: BrouillonCommande = {};
    for (const [cle, valeur] of Object.entries(valeurs)) {
      const v = borner(valeur);
      if (v) propre[cle as keyof BrouillonCommande] = v;
    }
    if (Object.keys(propre).length === 0) return;
    (await cookies()).set(COOKIE, JSON.stringify(propre), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/commander",
      maxAge: DUREE_S,
    });
  } catch (erreur) {
    console.error("[commander] brouillon non enregistré:", erreur);
  }
}

/** Efface le brouillon : la commande est passée, il n'a plus lieu d'être. */
export async function effacerBrouillon(): Promise<void> {
  try {
    (await cookies()).delete({ name: COOKIE, path: "/commander" });
  } catch (erreur) {
    console.error("[commander] brouillon non effacé:", erreur);
  }
}
