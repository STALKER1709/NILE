"use server";

import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { exigerConnexion } from "@/modules/auth/access";
import { calculerSign } from "@/modules/paiement/notification-core";
import { traiterNotificationPaiement } from "@/modules/paiement/notification";

/**
 * Simule la notification serveur d'un paiement (mode mock uniquement).
 * Construit une notification SIGNÉE et la fait traiter par le même code que le
 * vrai callback Monetbil — on teste ainsi le flux complet sans service externe.
 */
export async function simulerPaiementAction(formData: FormData): Promise<void> {
  if (env.PAYMENT_PROVIDER !== "mock") notFound();
  const utilisateur = await exigerConnexion();

  const ref = String(formData.get("ref") ?? "");
  const succes = formData.get("resultat") === "succes";

  // Propriété : le paiement doit appartenir à une commande de l'utilisateur.
  const paiement = await prisma.paiement.findUnique({
    where: { id: ref },
    include: { commande: true },
  });
  if (!paiement || paiement.commande.acheteurId !== utilisateur.id) {
    notFound();
  }

  const corps: Record<string, string> = {
    payment_ref: ref,
    status: succes ? "1" : "0",
  };
  corps.sign = calculerSign(env.MOCK_PAYMENT_SECRET, corps);

  await traiterNotificationPaiement(corps);

  redirect(`/commandes/${paiement.commandeId}?ok=${succes ? "paye" : "echec"}`);
}
