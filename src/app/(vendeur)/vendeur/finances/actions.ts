"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { demanderReversement } from "@/modules/reversement/reversement";
import { lireInfosPaiement, aDesInfosPaiement } from "@/modules/compte/profil";

const MESSAGES: Record<string, string> = {
  MONTANT_INVALIDE: "Montant invalide.",
  SOLDE_INSUFFISANT:
    "Ce montant dépasse ce que vous pouvez demander pour l'instant.",
  INTROUVABLE: "Boutique introuvable.",
};

/**
 * Demande de versement émise par le vendeur. Le rôle est vérifié côté serveur
 * et le solde revérifié dans une transaction : le montant soumis par le client
 * ne peut pas dépasser le dû réel.
 */
export async function demanderVersementAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();

  // Sans coordonnées de reversement, NILE ne pourrait pas payer la demande.
  if (!aDesInfosPaiement(lireInfosPaiement(vendeur.infosPaiement))) {
    redirect(
      "/vendeur/finances?erreur=" +
        encodeURIComponent(
          "Renseignez d'abord un numéro Mobile Money dans votre profil.",
        ),
    );
  }

  const brut = String(formData.get("montant") ?? "").replace(/\s/g, "");
  const montant = Number.parseInt(brut, 10);
  if (!Number.isInteger(montant) || montant <= 0) {
    redirect("/vendeur/finances?erreur=" + encodeURIComponent(MESSAGES.MONTANT_INVALIDE!));
  }

  const res = await demanderReversement(vendeur.id, montant);
  if (!res.ok) {
    redirect(
      "/vendeur/finances?erreur=" +
        encodeURIComponent(MESSAGES[res.code] ?? "Demande impossible."),
    );
  }
  redirect("/vendeur/finances?ok=demande");
}
