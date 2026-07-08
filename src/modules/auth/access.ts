import { redirect } from "next/navigation";
import type { Role, Utilisateur, Vendeur } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthProvider } from "@/modules/auth";
import { evaluerAcces } from "@/modules/auth/access-core";

export { evaluerAcces, TOUS_LES_ROLES } from "@/modules/auth/access-core";
export type { DecisionAcces } from "@/modules/auth/access-core";

/** Charge le profil de l'utilisateur connecté (ou null). */
export async function getUtilisateurCourant(): Promise<Utilisateur | null> {
  const authId = await getAuthProvider().getCurrentAuthId();
  if (!authId) return null;
  return prisma.utilisateur.findUnique({ where: { id: authId } });
}

/**
 * Garde serveur : exige un rôle parmi `rolesAutorises`. Redirige sinon.
 * À appeler en tête des pages/Server Actions protégées.
 */
export async function exigerRole(
  ...rolesAutorises: Role[]
): Promise<Utilisateur> {
  const utilisateur = await getUtilisateurCourant();
  const decision = evaluerAcces(utilisateur, rolesAutorises);
  switch (decision) {
    case "OK":
      return utilisateur as Utilisateur;
    case "NON_AUTHENTIFIE":
      redirect("/connexion");
    case "SUSPENDU":
      redirect("/acces-refuse?motif=suspendu");
    case "INTERDIT":
      redirect("/acces-refuse?motif=role");
  }
}

/** Garde serveur : exige simplement d'être connecté (n'importe quel rôle). */
export async function exigerConnexion(): Promise<Utilisateur> {
  return exigerRole("ACHETEUR", "VENDEUR", "ADMIN");
}

/** Garde serveur : exige un vendeur et renvoie son profil boutique. */
export async function exigerVendeur(): Promise<{
  utilisateur: Utilisateur;
  vendeur: Vendeur;
}> {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
  });
  if (!vendeur) redirect("/compte");
  return { utilisateur, vendeur };
}

export type { Role, Utilisateur };
