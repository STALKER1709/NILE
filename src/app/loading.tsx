/** Écran de chargement entre les pages : squelette de contenu animé. */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-40 w-full rounded-xl2 sm:h-52" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-carte"
          >
            <div className="skeleton aspect-square w-full" />
            <div className="space-y-2 p-3">
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
