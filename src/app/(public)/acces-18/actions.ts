"use server";

import { redirect } from "next/navigation";
import { confirmerCookieMajorite } from "@/modules/catalogue/acces-18";

function retourInterne(valeur: FormDataEntryValue | null): string {
  const chemin = typeof valeur === "string" ? valeur : "/catalogue";
  return chemin.startsWith("/") && !chemin.startsWith("//") && !chemin.includes("\\")
    ? chemin
    : "/catalogue";
}

export async function confirmerMajoriteAction(formData: FormData): Promise<void> {
  const confirme = formData.get("confirme") === "oui";
  const retour = retourInterne(formData.get("retour"));
  if (!confirme) redirect("/catalogue");
  await confirmerCookieMajorite();
  redirect(retour);
}
