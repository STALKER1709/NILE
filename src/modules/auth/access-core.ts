import type { Role, StatutUtilisateur } from "@prisma/client";

/**
 * Logique PURE d'autorisation, isolée (imports de types uniquement) pour être
 * testable sans base de données, sans requête HTTP et sans config d'environnement.
 */

export type DecisionAcces = "OK" | "NON_AUTHENTIFIE" | "INTERDIT" | "SUSPENDU";

export function evaluerAcces(
  utilisateur: { role: Role; statut: StatutUtilisateur } | null,
  rolesAutorises: readonly Role[],
): DecisionAcces {
  if (!utilisateur) return "NON_AUTHENTIFIE";
  if (utilisateur.statut === "SUSPENDU") return "SUSPENDU";
  if (!rolesAutorises.includes(utilisateur.role)) return "INTERDIT";
  return "OK";
}

export const TOUS_LES_ROLES: readonly Role[] = ["ACHETEUR", "VENDEUR", "ADMIN"];
