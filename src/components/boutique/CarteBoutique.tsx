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
      className={`group flex animate-fondu-haut flex-col rounded-[17px] border border-stone-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-carte-hover ${
        compact ? "w-60 shrink-0" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-blue-900 text-base font-extrabold text-amber-400 shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
          {boutique.nomBoutique.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-titre text-sm font-bold text-slate-900 transition-colors group-hover:text-nile-800">
            {boutique.nomBoutique}
          </h3>
          <div className="mt-0.5">
            <Badge ton="bleu">Boutique locale</Badge>
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
