import { Etoiles } from "@/components/ui/kit";

/** Histogramme de confiance : note moyenne + barres 5★ → 1★. */
export function RepartitionAvis({
  total,
  moyenne,
  parNote,
}: {
  total: number;
  moyenne: number;
  parNote: Record<1 | 2 | 3 | 4 | 5, number>;
}) {
  if (total === 0) {
    return <p className="text-sm text-gray-500">Aucun avis pour l&apos;instant.</p>;
  }
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Note globale */}
      <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-gray-50 px-6 py-4 sm:w-40">
        <span className="text-3xl font-extrabold text-gray-900">
          {moyenne.toFixed(1)}
        </span>
        <Etoiles note={moyenne} taille="md" />
        <span className="mt-1 text-xs text-gray-500">
          {total} avis vérifié{total > 1 ? "s" : ""}
        </span>
      </div>

      {/* Barres par étoile */}
      <div className="flex-1 space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((n) => {
          const nb = parNote[n];
          const pct = total > 0 ? Math.round((nb / total) * 100) : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-8 shrink-0 text-right">{n} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <span
                  className="block h-full rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-8 shrink-0 tabular-nums">{nb}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Badge « Achat vérifié » (tout avis NILE provient d'une commande livrée). */
export function BadgeAchatVerifie() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Achat vérifié
    </span>
  );
}
