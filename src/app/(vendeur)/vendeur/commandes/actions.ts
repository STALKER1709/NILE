"use server";

import { redirect } from "next/navigation";
import { signatureCommandesVendeur } from "@/modules/commande/signature";
import { exigerVendeur } from "@/modules/auth/access";
import { vendeurGereCommande } from "@/modules/commande/vendeur";
import { affectationSchema } from "@/validators/livraison";
import {
  affecterTransporteur,
  marquerExpediee,
  remettreParCode,
  type ResultatLivraison,
} from "@/modules/livraison/livraison";
import { codeRemiseSchema } from "@/validators/livraison";

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

/**
 * Remise chez le client : remplace l'ancien bouton « marquer livrée ».
 * Le vendeur ne peut plus déclarer une livraison de son propre chef — il lui
 * faut le code affiché sur le téléphone de l'acheteur, scanné ou dicté.
 */
export async function remettreVendeurAction(formData: FormData): Promise<void> {
  const parsed = codeRemiseSchema.safeParse({
    commandeId: formData.get("commandeId"),
    code: formData.get("code"),
    mode: formData.get("mode"),
    numeroAttendu: formData.get("numeroAttendu") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/vendeur/commandes?erreur=${encodeURIComponent("Code de réception invalide (6 chiffres).")}`,
    );
  }
  await exigerProprietaireCommande(parsed.data.commandeId);

  const res = await remettreParCode(
    parsed.data.commandeId,
    parsed.data.code,
    parsed.data.mode,
    parsed.data.numeroAttendu,
  );
  if (!res.ok) {
    const msg =
      res.code === "CODE_INVALIDE"
        ? "Code incorrect ou expiré. Demandez le code affiché à l'écran du client."
        : res.code === "MAUVAISE_COMMANDE"
          ? "Ce code appartient à une autre commande."
          : res.code === "ETAT_INVALIDE"
            ? "Cette commande n'est pas en cours de livraison."
            : "Commande introuvable.";
    redirect(`/vendeur/commandes?erreur=${encodeURIComponent(msg)}`);
  }
  redirect("/vendeur/commandes?ok=livree");
}

/**
 * Signature des commandes contenant au moins un article de ce vendeur.
 *
 * Quelques octets par appel : l'écran ne se recharge que lorsqu'un statut a
 * bougé. Le vendeur est identifié par sa session.
 */
export async function signatureCommandesVendeurAction(): Promise<string> {
  const { vendeur } = await exigerVendeur();
  return signatureCommandesVendeur(vendeur.id);
}
