"use server";

import { redirect } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import { affectationSchema } from "@/validators/livraison";
import {
  affecterTransporteur,
  marquerExpediee,
  marquerLivree,
  refuserLivraison,
  ajouterPreuve,
  type ResultatLivraison,
} from "@/modules/livraison/livraison";
import type { FichierAEnregistrer } from "@/modules/stockage/StorageProvider";

function message(res: Extract<ResultatLivraison, { ok: false }>): string {
  switch (res.code) {
    case "ETAT_INVALIDE":
      return "Action impossible dans l'état actuel de la commande.";
    case "NON_PAYE":
      return "Impossible d'expédier : la commande Monetbil n'est pas payée.";
    case "IMAGE_INVALIDE":
      return "Image invalide (JPEG/PNG/WEBP, 2 Mo max).";
    default:
      return "Commande introuvable.";
  }
}

function retour(commandeId: string, res: ResultatLivraison, okTag: string): never {
  redirect(
    res.ok
      ? `/admin/commandes/${commandeId}?ok=${okTag}`
      : `/admin/commandes/${commandeId}?erreur=${encodeURIComponent(message(res))}`,
  );
}

export async function affecterTransporteurAction(
  formData: FormData,
): Promise<void> {
  await exigerRole("ADMIN");
  const parsed = affectationSchema.safeParse({
    commandeId: formData.get("commandeId"),
    transporteur: formData.get("transporteur"),
  });
  if (!parsed.success) {
    const id = String(formData.get("commandeId") ?? "");
    redirect(`/admin/commandes/${id}?erreur=Nom%20du%20transporteur%20requis.`);
  }
  const res = await affecterTransporteur(
    parsed.data.commandeId,
    parsed.data.transporteur,
  );
  retour(parsed.data.commandeId, res, "affecte");
}

export async function marquerExpedieeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const id = String(formData.get("commandeId") ?? "");
  retour(id, await marquerExpediee(id), "expediee");
}

export async function marquerLivreeAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const id = String(formData.get("commandeId") ?? "");
  retour(id, await marquerLivree(id), "livree");
}

export async function refuserLivraisonAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const id = String(formData.get("commandeId") ?? "");
  retour(id, await refuserLivraison(id), "refusee");
}

export async function ajouterPreuveAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const id = String(formData.get("commandeId") ?? "");
  const brut = formData.get("preuve");
  if (!(brut instanceof File) || brut.size === 0) {
    redirect(`/admin/commandes/${id}?erreur=Aucune%20image%20fournie.`);
  }
  const fichier: FichierAEnregistrer = {
    nomOriginal: brut.name,
    typeMime: brut.type,
    contenu: Buffer.from(await brut.arrayBuffer()),
  };
  retour(id, await ajouterPreuve(id, fichier), "preuve");
}
