/** Squelette de la fiche produit : galerie + encadré d'achat. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="skeleton aspect-square w-full rounded-xl2" />
        <div className="space-y-4">
          <div className="skeleton h-7 w-3/4 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="space-y-3 rounded-xl2 border border-slate-200/80 bg-white p-4 shadow-carte">
            <div className="skeleton h-9 w-40 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-11 w-full rounded-lg" />
            <div className="space-y-2 pt-2">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="skeleton h-28 w-full rounded-xl2" />
    </div>
  );
}
