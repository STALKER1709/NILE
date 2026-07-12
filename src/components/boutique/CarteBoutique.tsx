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
      className={`group flex animate-fondu-haut flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-carte transition duration-200 hover:-translate-y-0.5 hover:border-nile/40 hover:shadow-flottant ${
        compact ? "w-56 shrink-0" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-nile-700 to-nile-500 text-lg font-bold text-white">
          {boutique.nomBoutique.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900 group-hover:text-nile">
            {boutique.nomBoutique}
          </p>
          <Badge ton="vert">Boutique vérifiée</Badge>
        </div>
      </div>
      {boutique.description && !compact && (
        <p className="ligne-2 mt-2.5 text-sm text-gray-500">
          {boutique.description}
        </p>
      )}
      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile" aria-hidden="true">
          <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
          <path d="M8 9a4 4 0 0 1 8 0" />
        </svg>
        {boutique.nbProduits} produit{boutique.nbProduits > 1 ? "s" : ""} · depuis {depuis}
      </p>
    </Link>
  );
}
