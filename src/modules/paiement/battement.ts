import { prisma } from "@/lib/db";

/**
 * Battement de cœur du balayage des paiements en attente.
 *
 * Le balayage est le dernier filet du parcours de paiement : il rattrape une
 * commande payée dont la notification ne nous est pas parvenue et dont
 * l'acheteur a fermé son navigateur avant que la relecture ne s'en aperçoive.
 *
 * Sa panne est SILENCIEUSE, et c'est ce qui la rend dangereuse. Il suffit d'un
 * `CRON_SECRET` posé d'un seul côté — sur l'hébergeur mais pas dans les
 * secrets du dépôt, ou l'inverse — pour que le balayage cesse de tourner sans
 * que rien ne l'annonce. Tant que les acheteurs restent sur leur page, la
 * relecture masque l'absence, et l'on découvre la panne le jour où l'un d'eux
 * paie puis ferme son téléphone : commande figée, argent encaissé.
 *
 * Chaque passage laisse donc une trace horodatée, qu'un écran d'administration
 * affiche. Un balayage muet depuis des heures se voit alors, au lieu de ne se
 * manifester que par une commande perdue.
 */

const CLE = "dernier_balayage_paiements";

export interface Battement {
  date: Date;
  examinees: number;
  conclues: number;
}

/** Enregistre le passage. N'échoue jamais : c'est une trace, pas le travail. */
export async function marquerBalayage(
  examinees: number,
  conclues: number,
): Promise<void> {
  try {
    const valeur = { date: new Date().toISOString(), examinees, conclues };
    await prisma.configuration.upsert({
      where: { cle: CLE },
      update: { valeur },
      create: { cle: CLE, valeur },
    });
  } catch (erreur) {
    console.error("[balayage] battement non enregistré:", erreur);
  }
}

/** Dernier passage connu, ou `null` si le balayage n'a jamais tourné. */
export async function dernierBalayage(): Promise<Battement | null> {
  const row = await prisma.configuration.findUnique({ where: { cle: CLE } });
  if (!row || typeof row.valeur !== "object" || row.valeur === null) return null;
  const v = row.valeur as Record<string, unknown>;
  const date = typeof v.date === "string" ? new Date(v.date) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return {
    date,
    examinees: typeof v.examinees === "number" ? v.examinees : 0,
    conclues: typeof v.conclues === "number" ? v.conclues : 0,
  };
}
