export type RoleInscription = "ACHETEUR" | "VENDEUR";

/** Préselectionne le rôle vendeur uniquement depuis un lien vendeur explicite. */
export function roleInitialInscription(role: string | null | undefined): RoleInscription {
  return role?.trim().toUpperCase() === "VENDEUR" ? "VENDEUR" : "ACHETEUR";
}
