"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { vendeurGereCommande } from "@/modules/commande/vendeur";
import { affectationSchema } from "@/validators/livraison";
import {
  affecterTransporteur,
  marquerExpediee,
  marquerLivree,
  type ResultatLivraison,
} from "@/modules/livraison/livraison";

/**
 * Suivi de livraison PILOTÉ PAR LA BOUTIQUE (l'admin supervise).
 * Autorisation stricte : la commande doit appartenir ENTIÈREMENT au vendeur
 * (multi-boutiques -> coordonné par NILE). Le refus à la livraison et le
 * cash COD restent réservés à l'admin (opérations sensibles anti-fraude).
 */

function message(res: Extract<ResultatLivraison, { ok: false }>): string {
  switch (res.code) {
    case "ETAT_INVALIDE":
      return "Action impossible dans l'état actuel de la commande.";
    case "NON_PAYE":
      return "Impossible d'expédier : le paiement Mobile Money n'est pas confirmé.";
    default:
      return "Commande introuvable.";
  }
}

function retour(res: ResultatLivraison, okTag: string): never {
  redirect(
    res.ok
      ? `/vendeur/commandes?ok=${okTag}`
      : `/vendeur/commandes?erreur=${encodeURIComponent(message(res))}`,
  );
}

/** Vérifie la propriété totale de la commande, sinon redirige avec erreur. */
async function exigerProprietaireCommande(commandeId: string): Promise<void> {
  const { vendeur } = await exigerVendeur();
  if (!commandeId || !(await vendeurGereCommande(vendeur.id, commandeId))) {
    redirect(
      `/vendeur/commandes?erreur=${encodeURIComponent(
        "Cette commande n'est pas gérée par ta boutique.",
      )}`,
    );
  }
}

export async function affecterTransporteurVendeurAction(
  formData: FormData,
): Promise<void> {
  const parsed = affectationSchema.safeParse({
    commandeId: formData.get("commandeId"),
    transporteur: formData.get("transporteur"),
  });
  if (!parsed.success) {
    redirect(
      `/vendeur/commandes?erreur=${encodeURIComponent("Nom du transporteur requis.")}`,
    );
  }
  await exigerProprietaireCommande(parsed.data.commandeId);
  retour(
    await affecterTransporteur(parsed.data.commandeId, parsed.data.transporteur),
    "preparation",
  );
}

export async function expedierVendeurAction(formData: FormData): Promise<void> {
  const commandeId = String(formData.get("commandeId") ?? "");
  await exigerProprietaireCommande(commandeId);
  retour(await marquerExpediee(commandeId), "expediee");
}

export async function livrerVendeurAction(formData: FormData): Promise<void> {
  const commandeId = String(formData.get("commandeId") ?? "");
  await exigerProprietaireCommande(commandeId);
  retour(await marquerLivree(commandeId), "livree");
}
