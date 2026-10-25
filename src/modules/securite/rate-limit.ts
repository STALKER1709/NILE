import { prisma } from "@/lib/db";

/**
 * Rate limiting adossé à Postgres (fenêtre glissante) : fonctionne en
 * serverless (Vercel) là où un compteur en mémoire ne survivrait pas.
 *
 * Principe : une ligne `EvenementAbus` par tentative sensible. On compte les
 * lignes de la clé dans la fenêtre ; au-delà du plafond, on refuse. Les lignes
 * expirées sont purgées au passage (pas de tâche planifiée nécessaire).
 *
 * Fail-closed : si la base est injoignable, on refuse temporairement la
 * tentative sensible. Une panne du limiteur ne doit pas devenir un contournement.
 */

export interface ResultatLimite {
  autorise: boolean;
  /** Minutes (entières, ≥ 1) avant la prochaine tentative possible. */
  minutesRestantes: number;
}

export async function consommerTentative(
  cle: string,
  max: number,
  fenetreMinutes: number,
): Promise<ResultatLimite> {
  try {
    const maintenant = Date.now();
    const debutFenetre = new Date(maintenant - fenetreMinutes * 60_000);

    // Le verrou consultatif PostgreSQL sérialise les tentatives pour une clé.
    // La CTE force l'exécution du verrou, mais ne renvoie pas la colonne void
    // de pg_advisory_xact_lock à Prisma (qui ne sait pas la désérialiser).
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<{ locked: boolean }>`WITH verrou AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext(${cle}))
      )
      SELECT TRUE AS locked FROM verrou`;
      await tx.evenementAbus.deleteMany({
        where: { cle, dateCreation: { lt: debutFenetre } },
      });
      const nb = await tx.evenementAbus.count({
        where: { cle, dateCreation: { gte: debutFenetre } },
      });
      if (nb >= max) {
        const plusAncienne = await tx.evenementAbus.findFirst({
          where: { cle, dateCreation: { gte: debutFenetre } },
          orderBy: { dateCreation: "asc" },
          select: { dateCreation: true },
        });
        const liberationMs = plusAncienne
          ? plusAncienne.dateCreation.getTime() + fenetreMinutes * 60_000 - maintenant
          : fenetreMinutes * 60_000;
        return { autorise: false, minutesRestantes: Math.max(1, Math.ceil(liberationMs / 60_000)) };
      }
      await tx.evenementAbus.create({ data: { cle } });
      return { autorise: true, minutesRestantes: 0 };
    });
  } catch (erreur) {
    console.error("[rate-limit] indisponible (fail-closed):", erreur);
    return { autorise: false, minutesRestantes: 1 };
  }
}

/** Efface le compteur d'une clé (ex. connexion réussie). */
export async function reinitialiserLimite(cle: string): Promise<void> {
  try {
    await prisma.evenementAbus.deleteMany({ where: { cle } });
  } catch (erreur) {
    console.error("[rate-limit] réinitialisation échouée:", erreur);
  }
}
