import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Code de réception TOURNANT (logique PURE, testable sans I/O).
 *
 * Problème résolu : un QR figé affiché sur la page de l'acheteur pourrait
 * être capturé puis transmis au vendeur, qui « livrerait » depuis son
 * bureau. Un code qui change toutes les 30 secondes rend la capture
 * périmée avant d'être exploitable.
 *
 * Ce que ça prouve : que l'acheteur et le livreur sont actifs AU MÊME
 * INSTANT. Ce que ça ne prouve pas : leur proximité physique (l'acheteur
 * peut dicter le code au téléphone). C'est une barrière sérieuse, pas une
 * preuve opposable — voir la note dans le module de service.
 *
 * Chaque livraison porte son propre secret aléatoire : aucune variable
 * d'environnement supplémentaire à configurer, et la compromission d'un
 * code ne dit rien des autres commandes.
 */

/** Durée de validité d'un code, en secondes. */
export const PERIODE_CODE_SECONDES = 30;

/**
 * Nombre de fenêtres passées encore acceptées. 1 = le code précédent reste
 * valable, ce qui absorbe la latence du scan et une horloge légèrement
 * décalée sans ouvrir une brèche exploitable.
 */
export const FENETRES_TOLEREES = 1;

/** Longueur du code affiché (chiffres). */
export const LONGUEUR_CODE = 6;

/** Secret propre à une livraison, tiré au sort à la création de la commande. */
export function genererSecretReception(): string {
  return randomBytes(32).toString("hex");
}

/** Numéro de la fenêtre de temps courante. */
export function fenetreCourante(instant: Date): number {
  return Math.floor(instant.getTime() / 1000 / PERIODE_CODE_SECONDES);
}

/** Secondes restantes avant que le code affiché ne change. */
export function secondesRestantes(instant: Date): number {
  const ecoulees = Math.floor(instant.getTime() / 1000) % PERIODE_CODE_SECONDES;
  return PERIODE_CODE_SECONDES - ecoulees;
}

function codePourFenetre(secret: string, fenetre: number): string {
  const empreinte = createHmac("sha256", secret).update(String(fenetre)).digest();
  // Troncature dynamique (même principe que TOTP) : évite de ne dépendre
  // que des premiers octets de l'empreinte.
  const decalage = (empreinte[empreinte.length - 1] as number) & 0x0f;
  const binaire =
    (((empreinte[decalage] as number) & 0x7f) << 24) |
    (((empreinte[decalage + 1] as number) & 0xff) << 16) |
    (((empreinte[decalage + 2] as number) & 0xff) << 8) |
    ((empreinte[decalage + 3] as number) & 0xff);
  const modulo = 10 ** LONGUEUR_CODE;
  return String(binaire % modulo).padStart(LONGUEUR_CODE, "0");
}

/** Code affiché à l'acheteur à un instant donné. */
export function genererCodeReception(secret: string, instant: Date): string {
  return codePourFenetre(secret, fenetreCourante(instant));
}

/**
 * Le code fourni par le livreur est-il valable maintenant ?
 * Comparaison en temps constant, sur la fenêtre courante et les fenêtres
 * tolérées, pour ne rien laisser fuiter par la durée de la vérification.
 */
export function verifierCodeReception(
  secret: string,
  codeFourni: string,
  instant: Date,
): boolean {
  const normalise = codeFourni.replace(/\D/g, "");
  if (normalise.length !== LONGUEUR_CODE) return false;

  const fenetre = fenetreCourante(instant);
  let valide = false;
  // Pas de court-circuit : toutes les fenêtres sont testées à chaque appel,
  // pour que la durée ne révèle pas laquelle a correspondu.
  for (let recul = 0; recul <= FENETRES_TOLEREES; recul++) {
    const attendu = Buffer.from(codePourFenetre(secret, fenetre - recul));
    const fourni = Buffer.from(normalise);
    if (attendu.length === fourni.length && timingSafeEqual(attendu, fourni)) {
      valide = true;
    }
  }
  return valide;
}

/* ------------------------------- Contenu du QR ------------------------------ */

const PREFIXE_QR = "NILE";

/**
 * Contenu encodé dans le QR. On y met le numéro de commande EN PLUS du code :
 * le scanner peut ainsi refuser un QR appartenant à une autre commande, au
 * lieu de laisser le livreur valider la mauvaise livraison sans s'en rendre
 * compte.
 */
export function contenuQr(numeroCommande: string, code: string): string {
  return `${PREFIXE_QR}:${numeroCommande}:${code}`;
}

export interface QrAnalyse {
  numeroCommande: string;
  code: string;
}

/** Lit un contenu de QR. `null` si ce n'est pas un QR NILE exploitable. */
export function analyserContenuQr(texte: string): QrAnalyse | null {
  const morceaux = texte.trim().split(":");
  if (morceaux.length !== 3) return null;
  const [prefixe, numeroCommande, code] = morceaux as [string, string, string];
  if (prefixe !== PREFIXE_QR) return null;
  if (!numeroCommande || !/^\d{6}$/.test(code)) return null;
  return { numeroCommande, code };
}
