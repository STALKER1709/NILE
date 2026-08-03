import { formaterXAF } from "@/lib/money";

/** Contenu PUR des notifications push (testable sans I/O). */

export interface ChargePush {
  titre: string;
  corps: string;
  /** Page ouverte au clic sur la notification. */
  url: string;
}

/** Notification « nouvelle commande » envoyée à UN vendeur (ses lignes). */
export function chargeNouvelleCommandeVendeur(params: {
  numero: string;
  nbArticles: number;
  totalVendeur: number;
  modePaiement: "COD" | "MONETBIL";
}): ChargePush {
  const { numero, nbArticles, totalVendeur, modePaiement } = params;
  return {
    titre: `🛒 Nouvelle commande ${numero}`,
    corps: `${nbArticles} article${nbArticles > 1 ? "s" : ""} · ${formaterXAF(totalVendeur)} · ${
      modePaiement === "COD" ? "paiement à la livraison" : "déjà payée (Mobile Money)"
    }. À préparer !`,
    url: "/vendeur/commandes",
  };
}

/** Agrège les lignes d'une commande par vendeur (articles et total). */
export function vendeursAvecTotaux(
  lignes: { vendeurId: string; quantite: number; sousTotal: number }[],
): Map<string, { nbArticles: number; totalVendeur: number }> {
  const map = new Map<string, { nbArticles: number; totalVendeur: number }>();
  for (const l of lignes) {
    const actuel = map.get(l.vendeurId) ?? { nbArticles: 0, totalVendeur: 0 };
    actuel.nbArticles += l.quantite;
    actuel.totalVendeur += l.sousTotal;
    map.set(l.vendeurId, actuel);
  }
  return map;
}

export type StatutNotifiableAcheteur =
  | "CONFIRMEE"
  | "EN_PREPARATION"
  | "EXPEDIEE"
  | "LIVREE";

/**
 * Avancement de commande notifié à l'ACHETEUR.
 *
 * Mêmes étapes que les emails, mais le push arrive sur l'écran de veille :
 * c'est le canal qui a le plus de chances d'être vu, et il ne coûte rien
 * (VAPID, aucun tiers facturé).
 *
 * En COD, le message d'expédition rappelle de préparer l'argent : c'est
 * l'information la plus utile du parcours pour un acheteur camerounais.
 */
export function chargeStatutAcheteur(params: {
  numero: string;
  commandeId: string;
  statut: StatutNotifiableAcheteur;
  modePaiement: "COD" | "MONETBIL";
  total: number;
}): ChargePush {
  const { numero, commandeId, statut, modePaiement, total } = params;
  const url = `/commandes/${commandeId}`;

  switch (statut) {
    case "CONFIRMEE":
      return {
        titre: `✅ Commande ${numero} confirmée`,
        corps:
          modePaiement === "COD"
            ? `${formaterXAF(total)} à régler à la livraison. La boutique prépare votre colis.`
            : `${formaterXAF(total)} payés. La boutique prépare votre colis.`,
        url,
      };
    case "EN_PREPARATION":
      return {
        titre: `Commande ${numero} en préparation`,
        corps: "La boutique rassemble vos articles. Départ imminent.",
        url,
      };
    case "EXPEDIEE":
      return {
        titre: `📦 Commande ${numero} en route`,
        corps:
          modePaiement === "COD"
            ? `Préparez ${formaterXAF(total)} en espèces. Vérifiez le colis avant de payer.`
            : "Votre colis est en route. Vérifiez-le à la réception.",
        url,
      };
    case "LIVREE":
      return {
        titre: `Commande ${numero} livrée`,
        corps: "Confirmez la réception en un clic, et notez vos articles.",
        url,
      };
  }
}

/**
 * Rappel à l'ACHETEUR : le livreur a déclaré la commande livrée, mais
 * l'acheteur n'a pas encore attesté l'avoir reçue.
 */
export function chargeRappelConfirmation(params: {
  numero: string;
  commandeId: string;
}): ChargePush {
  return {
    titre: "Avez-vous bien reçu votre commande ?",
    corps: `Confirmez la réception de la commande ${params.numero} en un clic.`,
    url: `/commandes/${params.commandeId}`,
  };
}

/** Notification « nouvelle commande » pour les ADMINS (vue globale). */
export function chargeNouvelleCommandeAdmin(params: {
  numero: string;
  total: number;
  modePaiement: "COD" | "MONETBIL";
}): ChargePush {
  return {
    titre: `Commande ${params.numero} confirmée`,
    corps: `${formaterXAF(params.total)} · ${
      params.modePaiement === "COD" ? "COD" : "Mobile Money (payée)"
    }`,
    url: "/admin/commandes",
  };
}
