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
    corps: `${nbArticles} article${nbArticles > 1 ? "s" : ""} — ${formaterXAF(totalVendeur)} · ${
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
