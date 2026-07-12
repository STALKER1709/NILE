/** Squelette du catalogue : barre de filtres + grille de produits. */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement">
      <div className="flex items-baseline justify-between">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-14 w-full rounded-xl2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-carte">
            <div className="skeleton aspect-square w-full" />
            <div className="space-y-2 p-2.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-8 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
