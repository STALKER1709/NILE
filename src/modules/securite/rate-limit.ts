import { prisma } from "@/lib/db";

/**
 * Rate limiting adossé à Postgres (fenêtre glissante) : fonctionne en
 * serverless (Vercel) là où un compteur en mémoire ne survivrait pas.
 *
 * Principe : une ligne `EvenementAbus` par tentative sensible. On compte les
 * lignes de la clé dans la fenêtre ; au-delà du plafond, on refuse. Les lignes
 * expirées sont purgées au passage (pas de tâche planifiée nécessaire).
 *
 * Fail-open : si la base est injoignable, on AUTORISE (l'opération métier
 * échouera de toute façon, et on ne verrouille pas tout le site pour un
 * incident d'infrastructure) — l'erreur est journalisée.
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

    // Purge opportuniste des tentatives hors fenêtre pour cette clé.
    await prisma.evenementAbus.deleteMany({
      where: { cle, dateCreation: { lt: debutFenetre } },
    });

    const nb = await prisma.evenementAbus.count({
      where: { cle, dateCreation: { gte: debutFenetre } },
    });
    if (nb >= max) {
      const plusAncienne = await prisma.evenementAbus.findFirst({
        where: { cle },
        orderBy: { dateCreation: "asc" },
        select: { dateCreation: true },
      });
      const liberationMs = plusAncienne
        ? plusAncienne.dateCreation.getTime() + fenetreMinutes * 60_000 - maintenant
        : fenetreMinutes * 60_000;
      return {
        autorise: false,
        minutesRestantes: Math.max(1, Math.ceil(liberationMs / 60_000)),
      };
    }

    await prisma.evenementAbus.create({ data: { cle } });
    return { autorise: true, minutesRestantes: 0 };
  } catch (erreur) {
    console.error("[rate-limit] indisponible (fail-open):", erreur);
    return { autorise: true, minutesRestantes: 0 };
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
