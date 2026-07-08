"use server";

import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { adresseLivraisonSchema } from "@/validators/commande";
import { passerCommandeCOD, type ResultatCommande } from "@/modules/commande/commande";

function messageCommande(res: Extract<ResultatCommande, { ok: false }>): string {
  switch (res.code) {
    case "PANIER_VIDE":
      return "Votre panier est vide.";
    case "PLAFOND_DEPASSE":
      return "Le montant dépasse le plafond autorisé pour le paiement à la livraison.";
    case "TROP_COMMANDES_NON_ABOUTIES":
      return "Trop de commandes non abouties sur votre compte. Contactez le support.";
    case "STOCK_INSUFFISANT":
      return `Stock insuffisant pour « ${res.detail ?? "un produit"} ». Ajustez votre panier.`;
    case "INDISPONIBLE":
      return `Le produit « ${res.detail ?? ""} » n'est plus disponible.`;
    default:
      return "Une erreur est survenue. Réessaie.";
  }
}

export async function passerCommandeAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();

  const parsed = adresseLivraisonSchema.safeParse({
    destNom: formData.get("destNom"),
    destTelephone: formData.get("destTelephone"),
    ville: formData.get("ville"),
    quartier: formData.get("quartier"),
    reperes: formData.get("reperes") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Adresse invalide.";
    redirect(`/commander?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await passerCommandeCOD(utilisateur.id, parsed.data);
  if (!res.ok) {
    redirect(`/commander?erreur=${encodeURIComponent(messageCommande(res))}`);
  }
  redirect(`/commandes/${res.commandeId}?ok=creee`);
}
