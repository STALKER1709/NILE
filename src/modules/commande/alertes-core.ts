/**
 * Bandeaux de confirmation du suivi de commande — logique PURE.
 *
 * Ils sont déclenchés par un `?ok=…` posé au moment de la redirection. Ce
 * paramètre est FIGÉ à l'arrivée sur la page ; l'état de la commande, lui,
 * continue de vivre — et la page se rafraîchit toute seule pendant que
 * l'acheteur la regarde.
 *
 * Sans condition sur l'état courant, un acheteur qui attend sa confirmation
 * Mobile Money voit le paiement aboutir sous ses yeux — les badges passent à
 * « Payé » — pendant que le bandeau lui demande toujours de valider une
 * demande déjà réglée. Au mieux il doute, au pire il paie deux fois.
 *
 * La base fait foi ; l'URL ne dit que d'où l'on vient.
 */

export interface EtatCommandeAlerte {
  statutCommande: string;
  statutPaiement: string;
}

export interface Alerte {
  classe: string;
  texte: string;
  /** Ce bandeau a-t-il encore du sens au vu de l'état courant ? */
  pertinent: (commande: EtatCommandeAlerte) => boolean;
}

const VERT = "border-emerald-200 bg-emerald-50 text-emerald-700";
const AMBRE = "border-amber-200 bg-accent-fixe text-amber-800";
const ROUGE = "border-red-200 bg-red-50 text-red-700";

export const ALERTES: Record<string, Alerte> = {
  creee: {
    classe: VERT,
    texte: "Commande enregistrée ! Vous paierez à la livraison.",
    // Annulée ou refusée entre-temps : l'annonce serait un contresens.
    pertinent: (c) =>
      c.statutCommande !== "ANNULEE" && c.statutCommande !== "REFUSEE",
  },
  paye: {
    classe: VERT,
    texte: "Paiement confirmé. Merci !",
    pertinent: (c) => c.statutPaiement === "PAYE",
  },
  annulee: {
    classe: AMBRE,
    texte: "Commande annulée. Les articles ont été remis en stock.",
    pertinent: (c) => c.statutCommande === "ANNULEE",
  },
  echec: {
    classe: ROUGE,
    texte:
      "Le paiement a échoué. La commande a été annulée et le stock restitué.",
    pertinent: (c) => c.statutPaiement === "ECHOUE",
  },
  reception: {
    classe: VERT,
    texte: "Merci ! Vous avez confirmé avoir reçu cette commande.",
    pertinent: (c) => c.statutCommande === "LIVREE",
  },
  paiement_en_cours: {
    classe: AMBRE,
    texte:
      "Une demande de paiement vient d'être envoyée sur votre téléphone. Validez-la avec votre code Mobile Money : cette page se met à jour dès la confirmation.",
    // Tant que le paiement est RÉELLEMENT en attente, et pas une seconde de
    // plus : c'est le bandeau qui invite à payer.
    pertinent: (c) => c.statutPaiement === "EN_ATTENTE",
  },
};

/**
 * Bandeau à afficher, ou `null`.
 *
 * `null` couvre trois cas qui se valent à l'écran : aucun paramètre, un
 * paramètre inconnu (URL bricolée), et un bandeau devenu faux depuis.
 */
export function choisirAlerte(
  ok: string | undefined,
  commande: EtatCommandeAlerte,
): Alerte | null {
  if (!ok) return null;
  const alerte = ALERTES[ok];
  if (!alerte) return null;
  return alerte.pertinent(commande) ? alerte : null;
}
