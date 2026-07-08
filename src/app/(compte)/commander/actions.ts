"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { exigerConnexion } from "@/modules/auth/access";
import { adresseLivraisonSchema } from "@/validators/commande";
import { passerCommande, type ResultatCommande } from "@/modules/commande/commande";

const modeSchema = z.enum(["COD", "MONETBIL"]);

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
    case "PAIEMENT_INDISPONIBLE":
      return "Le service de paiement est momentanément indisponible. Réessaie.";
    default:
      return "Une erreur est survenue. Réessaie.";
  }
}

async function urlDeBase(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function passerCommandeAction(formData: FormData): Promise<void> {
  const utilisateur = await exigerConnexion();

  const mode = modeSchema.catch("COD").parse(formData.get("mode"));
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

  const base = await urlDeBase();
  const res = await passerCommande(utilisateur.id, parsed.data, {
    mode,
    urlRetour: `${base}/commandes`,
    urlNotification: `${base}/api/paiement/callback`,
    emailAcheteur: utilisateur.email,
    telephoneAcheteur: parsed.data.destTelephone,
    nomAcheteur: parsed.data.destNom,
  });

  if (!res.ok) {
    redirect(`/commander?erreur=${encodeURIComponent(messageCommande(res))}`);
  }

  // Monetbil : rediriger vers le widget de paiement. COD : vers la commande.
  if (res.urlPaiement) {
    redirect(res.urlPaiement);
  }
  redirect(`/commandes/${res.commandeId}?ok=creee`);
}
