"use server";

import { redirect } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import {
  marquerCashCollecte,
  marquerCashReverse,
} from "@/modules/paiement/reconciliation";

export async function marquerCollecteAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const commandeId = String(formData.get("commandeId") ?? "");
  const res = await marquerCashCollecte(commandeId);
  redirect(
    res.ok
      ? "/admin/reconciliation?ok=collecte"
      : "/admin/reconciliation?erreur=Action%20impossible%20sur%20cette%20commande.",
  );
}

export async function marquerReverseAction(formData: FormData): Promise<void> {
  await exigerRole("ADMIN");
  const commandeId = String(formData.get("commandeId") ?? "");
  const res = await marquerCashReverse(commandeId);
  redirect(
    res.ok
      ? "/admin/reconciliation?ok=reverse"
      : "/admin/reconciliation?erreur=Action%20impossible%20sur%20cette%20commande.",
  );
}
