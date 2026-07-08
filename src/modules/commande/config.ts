import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Lit un paramètre numérique depuis la table Configuration (éditable par l'admin),
 * avec repli sur la variable d'environnement si absent.
 */
async function lireConfigNombre(cle: string, defaut: number): Promise<number> {
  const row = await prisma.configuration.findUnique({ where: { cle } });
  if (row && typeof row.valeur === "number") return row.valeur;
  return defaut;
}

export function getPlafondCOD(): Promise<number> {
  return lireConfigNombre("cod_plafond_xaf", env.COD_PLAFOND_XAF);
}

export function getMaxCommandesNonAbouties(): Promise<number> {
  return lireConfigNombre(
    "cod_max_commandes_non_abouties",
    env.COD_MAX_COMMANDES_NON_ABOUTIES,
  );
}
