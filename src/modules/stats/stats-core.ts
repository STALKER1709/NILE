/** Logique PURE des statistiques de tableaux de bord (testable sans I/O). */

export interface PointJour {
  /** Clé AAAA-MM-JJ (fuseau local du serveur). */
  cle: string;
  /** Libellé court du jour (lun, mar…). */
  label: string;
  valeur: number;
}

const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

function cleJour(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

/**
 * Agrège des événements datés en une série par jour sur les `nbJours`
 * derniers jours (jours vides inclus, valeur 0), du plus ancien au plus
 * récent. Les événements hors fenêtre sont ignorés.
 */
export function serieParJour(
  evenements: { date: Date; valeur: number }[],
  nbJours: number,
  maintenant: Date = new Date(),
): PointJour[] {
  const points: PointJour[] = [];
  const index = new Map<string, number>();
  for (let i = nbJours - 1; i >= 0; i--) {
    const d = new Date(maintenant);
    d.setDate(d.getDate() - i);
    const cle = cleJour(d);
    index.set(cle, points.length);
    points.push({ cle, label: JOURS_COURTS[d.getDay()] ?? "?", valeur: 0 });
  }
  for (const e of evenements) {
    const idx = index.get(cleJour(e.date));
    if (idx !== undefined) {
      const point = points[idx];
      if (point) point.valeur += e.valeur;
    }
  }
  return points;
}

/** Premier instant du mois en cours (pour les « ventes du mois »). */
export function debutDuMois(maintenant: Date = new Date()): Date {
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
}
