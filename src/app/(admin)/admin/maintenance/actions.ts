"use server";

import { redirect } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import { purgerHistorique, reinitialiserPlateforme } from "@/modules/admin/maintenance";
import { supprimerProduitAdmin, supprimerUtilisateurAdmin } from "@/modules/admin/suppression";
import {
  phraseConfirmationValide,
  PHRASE_PURGE,
  PHRASE_REINITIALISATION,
} from "@/modules/admin/suppression-core";

function retourErreur(message: string): never {
  redirect(`/admin/maintenance?erreur=${encodeURIComponent(message)}`);
}

/**
 * Efface l'activité (commandes, avis, règlements, promotions, annonces,
 * paniers) en conservant catalogue et comptes. Irréversible : la phrase de
 * confirmation est revérifiée ICI, côté serveur — une protection qui ne
 * vivrait que dans le navigateur ne protégerait rien.
 */
export async function purgerHistoriqueAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");

  if (!phraseConfirmationValide(String(formData.get("confirmation") ?? ""), PHRASE_PURGE)) {
    retourErreur(`Confirmation incorrecte : recopiez exactement « ${PHRASE_PURGE} ».`);
  }

  const resume = await purgerHistorique();
  const params = new URLSearchParams({
    ok: "purge",
    commandes: String(resume.commandes),
    avis: String(resume.avis),
  });
  redirect(`/admin/maintenance?${params.toString()}`);
}

/**
 * Réinitialisation complète : l'activité, puis le catalogue et les comptes.
 * Le compte administrateur qui déclenche l'action est préservé.
 */
export async function reinitialiserAction(formData: FormData): Promise<void> {
  const admin = await exigerRole("ADMIN");

  if (
    !phraseConfirmationValide(
      String(formData.get("confirmation") ?? ""),
      PHRASE_REINITIALISATION,
    )
  ) {
    retourErreur(`Confirmation incorrecte : recopiez exactement « ${PHRASE_REINITIALISATION} ».`);
  }

  const resume = await reinitialiserPlateforme(admin.id);
  const params = new URLSearchParams({
    ok: "reinit",
    produits: String(resume.produits ?? 0),
    utilisateurs: String(resume.utilisateurs ?? 0),
  });
  redirect(`/admin/maintenance?${params.toString()}`);
}

/** Supprime un produit, ou le met en corbeille s'il figure dans des commandes. */
export async function supprimerProduitAdminAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const produitId = String(formData.get("produitId") ?? "");
  const retour = String(formData.get("retour") ?? "/admin/moderation");

  const res = await supprimerProduitAdmin(produitId);
  if (!res.ok) {
    redirect(`${retour}?erreur=${encodeURIComponent("Produit introuvable.")}`);
  }
  redirect(
    `${retour}?ok=${res.mode === "CORBEILLE" ? "produit_corbeille" : "produit_supprime"}`,
  );
}

/** Supprime un compte, ou l'anonymise s'il porte un historique de vente. */
export async function supprimerUtilisateurAction(formData: FormData): Promise<void> {
  const admin = await exigerRole("ADMIN");
  const utilisateurId = String(formData.get("utilisateurId") ?? "");
  const retour = String(formData.get("retour") ?? "/admin/maintenance");

  const res = await supprimerUtilisateurAdmin(admin.id, utilisateurId);
  if (!res.ok) {
    const msg =
      res.code === "SOI_MEME"
        ? "Vous ne pouvez pas supprimer votre propre compte."
        : res.code === "DERNIER_ADMIN"
          ? "Impossible de supprimer le dernier administrateur."
          : "Compte introuvable.";
    redirect(`${retour}?erreur=${encodeURIComponent(msg)}`);
  }
  redirect(
    `${retour}?ok=${res.mode === "ANONYMISATION" ? "compte_anonymise" : "compte_supprime"}`,
  );
}
