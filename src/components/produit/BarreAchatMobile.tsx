"use client";

import { useEffect, useRef, useState } from "react";
import { formaterXAF } from "@/lib/money";
import { BoutonPanier } from "@/components/panier/BoutonPanier";

/**
 * Barre d'achat collante en bas d'écran sur mobile (standard Jumia/AliExpress).
 * Apparaît quand l'encadré d'achat principal (id `achat-principal`) sort de la
 * vue, pour que prix + ajout restent toujours à portée de pouce.
 */
export function BarreAchatMobile({
  produitId,
  stock,
  quantiteInitiale,
  prix,
}: {
  produitId: string;
  stock: number;
  quantiteInitiale: number;
  prix: number;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ancre = document.getElementById("achat-principal");
    if (!ancre) return;
    const obs = new IntersectionObserver(
      ([entree]) => setVisible(!!entree && !entree.isIntersecting),
      { rootMargin: "-40% 0px 0px 0px" },
    );
    obs.observe(ancre);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-14 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-[130%]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <p className="text-[11px] leading-none text-slate-500">Prix</p>
          <p className="text-lg font-bold text-promo">{formaterXAF(prix)}</p>
        </div>
        <div className="flex-1">
          <BoutonPanier
            produitId={produitId}
            stock={stock}
            quantiteInitiale={quantiteInitiale}
          />
        </div>
      </div>
    </div>
  );
}
