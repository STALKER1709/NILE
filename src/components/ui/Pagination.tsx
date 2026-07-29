import Link from "next/link";
import { entreesPagination } from "@/modules/catalogue/pagination";

/**
 * Pagination numérotée. Rendue en liens (et non en boutons) pour rester
 * fonctionnelle sans JavaScript et permettre l'ouverture dans un onglet.
 */
export function Pagination({
  page,
  pages,
  lien,
  etiquette = "Pagination",
}: {
  page: number;
  pages: number;
  /** Construit l'URL d'une page donnée. */
  lien: (p: number) => string;
  etiquette?: string;
}) {
  if (pages <= 1) return null;
  const entrees = entreesPagination(page, pages);

  const caseClass =
    "grid h-10 min-w-10 place-items-center rounded border border-contour-carte px-3 text-etiquette-md transition-colors";

  return (
    <nav aria-label={etiquette} className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={lien(page - 1)} rel="prev" aria-label="Page précédente" className={`${caseClass} text-slate-600 hover:border-nile-700 hover:text-nile-700`}>
          <Fleche direction="gauche" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${caseClass} text-slate-300`}>
          <Fleche direction="gauche" />
        </span>
      )}

      {entrees.map((e, i) =>
        e === "ellipse" ? (
          <span key={`e${i}`} className="px-1 text-slate-400" aria-hidden="true">
            …
          </span>
        ) : e === page ? (
          <span key={e} aria-current="page" className={`${caseClass} border-nile-700 bg-nile-700 font-bold text-white`}>
            {e}
          </span>
        ) : (
          <Link key={e} href={lien(e)} aria-label={`Page ${e}`} className={`${caseClass} text-slate-600 hover:border-nile-700 hover:text-nile-700`}>
            {e}
          </Link>
        ),
      )}

      {page < pages ? (
        <Link href={lien(page + 1)} rel="next" aria-label="Page suivante" className={`${caseClass} text-slate-600 hover:border-nile-700 hover:text-nile-700`}>
          <Fleche direction="droite" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${caseClass} text-slate-300`}>
          <Fleche direction="droite" />
        </span>
      )}
    </nav>
  );
}

function Fleche({ direction }: { direction: "gauche" | "droite" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d={direction === "gauche" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
