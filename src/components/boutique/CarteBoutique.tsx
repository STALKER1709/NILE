import Link from "next/link";
import { Badge } from "@/components/ui/kit";
import type { BoutiqueListe } from "@/modules/catalogue/boutiques";

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
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/boutique/${boutique.id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      className={`group flex animate-fondu-haut flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-nile-700/30 hover:shadow-md ${
        compact ? "w-60 shrink-0" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-nile-900 to-nile-800 text-base font-bold text-accent shadow-xs transition-transform duration-300 group-hover:scale-105">
          {boutique.nomBoutique.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-titre text-sm font-bold text-slate-900 transition-colors group-hover:text-nile-800">
            {boutique.nomBoutique}
          </h3>
          <div className="mt-0.5">
            <Badge ton="vert" avecPoint>Certifiée</Badge>
          </div>
        </div>
      </div>

      {boutique.description && !compact && (
        <p className="ligne-2 mt-3 text-xs text-slate-500 leading-relaxed">
          {boutique.description}
        </p>
      )}

      <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
        <span className="font-medium text-slate-600">
          {boutique.nbProduits} produit{boutique.nbProduits > 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>Depuis {depuis}</span>
      </div>
    </Link>
  );
}
