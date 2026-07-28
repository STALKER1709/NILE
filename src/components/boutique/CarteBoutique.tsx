import Link from "next/link";
import { Badge } from "@/components/ui/kit";
import type { BoutiqueListe } from "@/modules/catalogue/boutiques";

/**
 * Carte boutique réutilisable (annuaire + mise en avant sur l'accueil).
 * Variante `compact` : largeur fixe pour un défilement horizontal.
 */
export function CarteBoutique({
  boutique,
  compact = false,
  index = 0,
}: {
  boutique: BoutiqueListe;
  compact?: boolean;
  index?: number;
}) {
  const depuis = new Date(boutique.dateCreation).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return (
    <Link
      href={`/boutique/${boutique.id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      className={`group flex animate-fondu-haut flex-col rounded-xl border border-contour-carte bg-white p-4 shadow-carte transition-all duration-200 hover:-translate-y-1 hover:border-nile-500/40 hover:shadow-carte-hover ${
        compact ? "w-56 shrink-0" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-nile-800 to-nile-600 text-lg font-bold text-accent shadow-sm transition-transform duration-200 group-hover:scale-105">
          {boutique.nomBoutique.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-nile-700">
            {boutique.nomBoutique}
          </p>
          <Badge ton="vert">Boutique vérifiée</Badge>
        </div>
      </div>
      {boutique.description && !compact && (
        <p className="ligne-2 mt-2.5 text-sm text-slate-600">
          {boutique.description}
        </p>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-600" aria-hidden="true">
          <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
          <path d="M8 9a4 4 0 0 1 8 0" />
        </svg>
        <span>{boutique.nbProduits} produit{boutique.nbProduits > 1 ? "s" : ""}</span>
        <span className="text-slate-300">·</span>
        <span>Depuis {depuis}</span>
      </p>
    </Link>
  );
}
