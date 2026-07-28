/** Squelette de l'annuaire des boutiques. */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-3 w-64 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-carte">
            <div className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-2/3 rounded" />
                <div className="skeleton h-4 w-24 rounded-full" />
              </div>
            </div>
            <div className="skeleton mt-3 h-3 w-full rounded" />
            <div className="skeleton mt-2 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
