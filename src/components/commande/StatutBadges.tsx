import type { StatutCommande, StatutPaiement } from "@prisma/client";
import { Badge } from "@/components/ui/kit";

const LIB_COMMANDE: Record<StatutCommande, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_PREPARATION: "En préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
  REFUSEE: "Refusée",
};

const LIB_PAIEMENT: Record<StatutPaiement, string> = {
  EN_ATTENTE: "Paiement en attente",
  PAYE: "Payé",
  ECHOUE: "Paiement échoué",
  REMBOURSE: "Remboursé",
};

export function BadgeStatutCommande({ statut }: { statut: StatutCommande }) {
  const ton =
    statut === "LIVREE"
      ? "vert"
      : statut === "ANNULEE" || statut === "REFUSEE"
        ? "rouge"
        : statut === "EXPEDIEE" || statut === "EN_PREPARATION"
          ? "bleu"
          : statut === "CONFIRMEE"
            ? "ambre"
            : "neutre";
  return <Badge ton={ton}>{LIB_COMMANDE[statut]}</Badge>;
}

export function BadgeStatutPaiement({ statut }: { statut: StatutPaiement }) {
  const ton =
    statut === "PAYE"
      ? "vert"
      : statut === "ECHOUE"
        ? "rouge"
        : statut === "REMBOURSE"
          ? "neutre"
          : "ambre";
  return <Badge ton={ton}>{LIB_PAIEMENT[statut]}</Badge>;
}
