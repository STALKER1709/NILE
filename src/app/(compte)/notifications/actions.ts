"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigerRole } from "@/modules/auth/access";

/**
 * Enregistrement des abonnements Web Push.
 * Les acheteurs reçoivent l'avancement de leurs commandes ; les vendeurs et
 * admins reçoivent les nouvelles commandes et les alertes de gestion.
 */

const abonnementSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(300),
    auth: z.string().min(1).max(100),
  }),
});

export type ResultatPush = { ok: true } | { ok: false; message: string };

export async function enregistrerPushAction(
  abonnementJson: string,
): Promise<ResultatPush> {
  const utilisateur = await exigerRole("ACHETEUR", "VENDEUR", "ADMIN");

  let brut: unknown;
  try {
    brut = JSON.parse(abonnementJson);
  } catch {
    return { ok: false, message: "Abonnement illisible." };
  }
  const parsed = abonnementSchema.safeParse(brut);
  if (!parsed.success) return { ok: false, message: "Abonnement invalide." };

  await prisma.abonnementPush.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: {
      utilisateurId: utilisateur.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    create: {
      utilisateurId: utilisateur.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });
  return { ok: true };
}

export async function supprimerPushAction(
  endpoint: string,
): Promise<ResultatPush> {
  const utilisateur = await exigerRole("ACHETEUR", "VENDEUR", "ADMIN");
  await prisma.abonnementPush.deleteMany({
    where: { endpoint, utilisateurId: utilisateur.id },
  });
  return { ok: true };
}
