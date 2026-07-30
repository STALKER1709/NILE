"use server";

import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { creerPromotion, annulerPromotion } from "@/modules/promotion/promotion";
import { promotionFormSchema } from "@/validators/promotion";

const MESSAGES: Record<string, string> = {
  PRODUIT_INTROUVABLE: "Ce produit ne fait pas partie de votre boutique.",
  VALEUR_INVALIDE: "Valeur de réduction invalide (pourcentage : 1 à 90).",
  PERIODE_INVALIDE: "Période invalide : la fin doit être après le début et dans le futur.",
  PRIX_INSUFFISANT: "Le montant de réduction doit être inférieur au prix du produit.",
  CHEVAUCHEMENT: "Une autre promotion est déjà active sur cette période, pour cette cible.",
};

export async function creerPromotionAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();

  const parsed = promotionFormSchema.safeParse({
    produitId: formData.get("produitId") || undefined,
    type: formData.get("type"),
    valeur: formData.get("valeur"),
    dateDebut: formData.get("dateDebut"),
    dateFin: formData.get("dateFin"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    redirect(`/vendeur/promotions?erreur=${encodeURIComponent(msg)}`);
  }

  const res = await creerPromotion(vendeur.id, parsed.data);
  if (!res.ok) {
    redirect(
      `/vendeur/promotions?erreur=${encodeURIComponent(MESSAGES[res.code] ?? "Création impossible.")}`,
    );
  }
  redirect("/vendeur/promotions?ok=creee");
}

export async function annulerPromotionAction(formData: FormData): Promise<void> {
  const { vendeur } = await exigerVendeur();
  const promotionId = String(formData.get("promotionId") ?? "");
  const res = await annulerPromotion(vendeur.id, promotionId);
  if (!res.ok) {
    redirect(`/vendeur/promotions?erreur=${encodeURIComponent("Promotion introuvable.")}`);
  }
  redirect("/vendeur/promotions?ok=annulee");
}
