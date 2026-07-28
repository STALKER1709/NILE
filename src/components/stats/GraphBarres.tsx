import { formaterXAF } from "@/lib/money";
import type { PointJour } from "@/modules/stats/stats-core";

/**
 * Mini graphique en barres (CSS pur, aucune librairie — pages légères).
 * Affiche une série par jour ; le survol/appui montre la valeur exacte.
 */
export function GraphBarres({
  points,
  titre,
}: {
  points: PointJour[];
  titre: string;
}) {
  const max = Math.max(...points.map((p) => p.valeur), 1);
  const total = points.reduce((s, p) => s + p.valeur, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-slate-900">{titre}</h2>
        <span className="text-xs text-slate-500">
          Total : <strong className="text-slate-700">{formaterXAF(total)}</strong>
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1.5 sm:gap-2">
        {points.map((p) => (
          <div key={p.cle} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              title={`${p.label} : ${formaterXAF(p.valeur)}`}
              className={`w-full rounded-t ${p.valeur > 0 ? "bg-nile hover:bg-nile-600" : "bg-slate-100"}`}
              style={{ height: `${Math.max(Math.round((p.valeur / max) * 96), 4)}px` }}
            />
            <span className="text-[10px] text-slate-400">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
