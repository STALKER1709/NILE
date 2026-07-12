"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formaterXAF } from "@/lib/money";

export interface ProduitVu {
  slug: string;
  titre: string;
  prix: number;
  image?: string;
}

const CLE = "nile_vus_recemment";
const MAX = 12;

function lire(): ProduitVu[] {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return [];
    const data = JSON.parse(brut);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Mémorise le produit courant dans « vus récemment » (localStorage, par
 * appareil). Ne rend rien. À placer sur la fiche produit.
 */
export function MemoriserVu({ produit }: { produit: ProduitVu }) {
  useEffect(() => {
    try {
      const liste = lire().filter((p) => p.slug !== produit.slug);
      liste.unshift(produit);
      localStorage.setItem(CLE, JSON.stringify(liste.slice(0, MAX)));
    } catch {
      // localStorage indisponible (navigation privée stricte) : on ignore.
    }
  }, [produit]);
  return null;
}

/**
 * Bandeau « Vus récemment » (exclut le produit courant). Rendu côté client :
 * n'apparaît que s'il y a au moins un autre produit dans l'historique.
 */
export function VusRecemment({ slugCourant }: { slugCourant: string }) {
  const [produits, setProduits] = useState<ProduitVu[]>([]);

  useEffect(() => {
    setProduits(lire().filter((p) => p.slug !== slugCourant).slice(0, 10));
  }, [slugCourant]);

  if (produits.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Vus récemment</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {produits.map((p) => (
          <Link
            key={p.slug}
            href={`/produit/${p.slug}`}
            className="w-32 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-carte transition hover:-translate-y-0.5 hover:shadow-flottant"
          >
            <div className="relative aspect-square w-full bg-white">
              {p.image ? (
                <Image src={p.image} alt={p.titre} fill sizes="128px" className="object-contain p-1.5" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v8.6l3.5-3.5 2.5 2.5L15 10l4 4V7H5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="ligne-2 min-h-[2.2rem] text-[11px] leading-snug text-gray-700">
                {p.titre}
              </p>
              <p className="mt-0.5 text-sm font-bold text-promo">{formaterXAF(p.prix)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
